let currentAudio = null;
let isPlaying = false;

document.addEventListener('DOMContentLoaded', () => {
    // --- SELECTION LOGIC ---
    const styleOptions = document.querySelectorAll('.style-card');
    const textureOptions = document.querySelectorAll('.texture-btn');
    let selectedStyle = 'classic';
    let selectedTextures = [];

    // Style Selection
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            // Remove selected class from all
            styleOptions.forEach(opt => opt.classList.remove('selected'));
            // Add to clicked
            option.classList.add('selected');
            selectedStyle = option.dataset.value;
        });
    });

    // Texture Selection
    textureOptions.forEach(option => {
        option.addEventListener('click', () => {
            option.classList.toggle('active');
            const value = option.dataset.value;
            if (option.classList.contains('active')) {
                selectedTextures.push(value);
            } else {
                selectedTextures = selectedTextures.filter(t => t !== value);
            }
        });
    });

    // --- GENERATION LOGIC ---
    const generateBtn = document.getElementById('generate-btn');
    const statusConsole = document.getElementById('status-console');
    const statusText = document.getElementById('status-text');
    const progressFill = document.getElementById('progress-fill');

    if (generateBtn) {
        generateBtn.addEventListener('click', async () => {
            const payload = {
                style: selectedStyle,
                ambiance: 'lofi', // Default ambiance
                sounds: selectedTextures
            };

            try {
                generateBtn.disabled = true;
                statusConsole.classList.remove('hidden');
                statusText.textContent = 'INITIALIZING...';
                progressFill.style.width = '10%';

                const response = await fetch('/api/generate', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').getAttribute('content')
                    },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || 'Generation failed');
                }

                const data = await response.json();

                // Use conversionId for polling if available, otherwise taskId (fallback)
                const pollId = data.conversionId || data.taskId;

                if (pollId) {
                    pollStatus(pollId, data.eta);
                }
            } catch (error) {
                console.error('Generation failed:', error);
                statusText.textContent = `ERROR: ${error.message.toUpperCase()}`;
                generateBtn.disabled = false;
            }
        });
    }

    async function pollStatus(id, eta) {
        let progress = 10;
        const interval = setInterval(async () => {
            try {
                const response = await fetch(`/api/status/${id}`);
                const data = await response.json();

                if (data.status === 'completed') {
                    clearInterval(interval);
                    progressFill.style.width = '100%';
                    statusText.textContent = 'GENERATION COMPLETE';
                    setTimeout(() => {
                        window.location.reload();
                    }, 1000);
                } else if (data.status === 'failed') {
                    clearInterval(interval);
                    statusText.textContent = `ERROR: ${data.error || 'GENERATION FAILED'}`;
                    progressFill.style.backgroundColor = 'var(--pink-neon)';
                    if (generateBtn) generateBtn.disabled = false;
                } else {
                    // Simulate progress based on ETA
                    if (progress < 90) {
                        progress += (100 / eta) * 2;
                        progressFill.style.width = `${Math.min(progress, 90)}%`;
                        statusText.textContent = `PROCESSING... ${Math.round(progress)}%`;
                    }
                }
            } catch (e) {
                console.error('Polling error', e);
            }
        }, 2000);
    }

    // --- PLAYER LOGIC ---
    const audioPlayer = new Audio();
    const playPauseBtn = document.getElementById('play-pause-btn');
    const currentTrackTitle = document.getElementById('current-track-title');
    const volumeSlider = document.getElementById('volume-slider');
    const visualizer = document.getElementById('visualizer');

    let isPlaying = false;

    window.playTrack = (url, title) => {
        audioPlayer.src = url;
        audioPlayer.play();
        isPlaying = true;
        updatePlayButton();
        if (currentTrackTitle) currentTrackTitle.textContent = title;
        if (visualizer) visualizer.classList.remove('paused');
    };

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.src) {
                if (isPlaying) {
                    audioPlayer.pause();
                    if (visualizer) visualizer.classList.add('paused');
                } else {
                    audioPlayer.play();
                    if (visualizer) visualizer.classList.remove('paused');
                }
                isPlaying = !isPlaying;
                updatePlayButton();
            }
        });
    }

    // The seekSlider and volumeSlider listeners should refer to audioPlayer, not currentAudio
    // Assuming seekSlider is defined elsewhere or will be added.
    // For now, only volumeSlider is present in the original code.

    if (volumeSlider) {
        volumeSlider.addEventListener('input', (e) => {
            if (audioPlayer) {
                audioPlayer.volume = e.target.value / 100;
            }
        });
    }

    function updatePlayButton() {
        if (!playPauseBtn) return;
        playPauseBtn.innerHTML = isPlaying
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }

    // Initial visualizer state
    if (visualizer) visualizer.classList.add('paused');
});

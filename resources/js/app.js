let audioPlayer = null; // Use a global variable for the Audio object
let isPlaying = false;
let currentPlayingCard = null;

document.addEventListener('DOMContentLoaded', () => {
    // Initialize the audio player
    audioPlayer = new Audio();

    // --- SELECTION LOGIC ---
    const styleOptions = document.querySelectorAll('.style-card');
    const textureOptions = document.querySelectorAll('.texture-btn');
    let selectedStyle = 'classic';
    let selectedTextures = [];

    // Style Selection (Keep as is)
    styleOptions.forEach(option => {
        option.addEventListener('click', () => {
            styleOptions.forEach(opt => opt.classList.remove('selected'));
            option.classList.add('selected');
            selectedStyle = option.dataset.value;
        });
    });

    // Texture Selection (Keep as is)
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
                    pollStatus(pollId, data.eta, selectedStyle);
                }
            } catch (error) {
                console.error('Generation failed:', error);
                statusText.textContent = `ERROR: ${error.message.toUpperCase()}`;
                generateBtn.disabled = false;
            }
        });
    }

    async function pollStatus(id, eta, style) {
        let progress = 10;
        const interval = setInterval(async () => {
            try {
                // Pass style to status endpoint so backend can name file correctly
                const response = await fetch(`/api/status/${id}?style=${style}`);
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
    const playPauseBtn = document.getElementById('play-pause-btn');
    const currentTrackTitle = document.getElementById('current-track-title');
    const volumeSlider = document.getElementById('volume-slider');
    const visualizer = document.getElementById('visualizer');

    // Function exposed globally to be called from the HTML track card
    window.playTrack = (url, title, trackCardButton) => {
        const newTrackCard = trackCardButton.closest('.track-card');

        // Check if the same track is being played/resumed
        if (currentPlayingCard === newTrackCard && isPlaying) {
            // Pause the current track
            audioPlayer.pause();
            isPlaying = false;
            if (visualizer) visualizer.classList.add('paused');
            updatePlayButton();
            trackCardButton.classList.remove('playing');
        } else if (currentPlayingCard === newTrackCard && !isPlaying) {
            // Resume the current track
            audioPlayer.play();
            isPlaying = true;
            if (visualizer) visualizer.classList.remove('paused');
            updatePlayButton();
            trackCardButton.classList.add('playing');
        } else {
            // Stop current track/reset UI if a new one is selected
            if (currentPlayingCard) {
                const prevBtn = currentPlayingCard.querySelector('.play-track-btn');
                if (prevBtn) prevBtn.classList.remove('playing');
            }

            // Load and play new track
            audioPlayer.src = url;
            audioPlayer.play();
            isPlaying = true;

            // Update UI
            updatePlayButton();
            if (currentTrackTitle) currentTrackTitle.textContent = title;
            if (visualizer) visualizer.classList.remove('paused');

            // Mark the new card as playing
            trackCardButton.classList.add('playing');
            currentPlayingCard = newTrackCard;
        }
    };

    if (playPauseBtn) {
        playPauseBtn.addEventListener('click', () => {
            if (audioPlayer.src) {
                if (isPlaying) {
                    audioPlayer.pause();
                    if (visualizer) visualizer.classList.add('paused');
                    if (currentPlayingCard) {
                        const btn = currentPlayingCard.querySelector('.play-track-btn');
                        if (btn) btn.classList.remove('playing');
                    }
                } else {
                    audioPlayer.play();
                    if (visualizer) visualizer.classList.remove('paused');
                    if (currentPlayingCard) {
                        const btn = currentPlayingCard.querySelector('.play-track-btn');
                        if (btn) btn.classList.add('playing');
                    }
                }
                isPlaying = !isPlaying;
                updatePlayButton();
            }
        });
    }

    if (volumeSlider) {
        // Initialize volume
        audioPlayer.volume = volumeSlider.value / 100;

        volumeSlider.addEventListener('input', (e) => {
            if (audioPlayer) {
                // Volume slider uses 0-100, Audio object uses 0-1
                audioPlayer.volume = e.target.value / 100;
            }
        });
    }

    // --- PROGRESS BAR LOGIC ---
    const progressSlider = document.getElementById('progress-slider');
    const playerProgressFill = document.getElementById('player-progress-fill');
    const currentTimeEl = document.getElementById('current-time');
    const totalDurationEl = document.getElementById('total-duration');

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
    }

    if (progressSlider && playerProgressFill) {
        // Update progress bar as audio plays
        audioPlayer.addEventListener('timeupdate', () => {
            if (audioPlayer.duration) {
                const progress = (audioPlayer.currentTime / audioPlayer.duration) * 100;
                progressSlider.value = progress;
                playerProgressFill.style.width = `${progress}%`;

                if (currentTimeEl) currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
            }
        });

        // Set total duration when metadata is loaded
        audioPlayer.addEventListener('loadedmetadata', () => {
            if (totalDurationEl) totalDurationEl.textContent = formatTime(audioPlayer.duration);
        });

        // Seek when slider is changed
        progressSlider.addEventListener('input', (e) => {
            if (audioPlayer.duration) {
                const seekTime = (e.target.value / 100) * audioPlayer.duration;
                audioPlayer.currentTime = seekTime;
                playerProgressFill.style.width = `${e.target.value}%`;
            }
        });
    }

    // Listen for the audio player to end
    audioPlayer.addEventListener('ended', () => {
        isPlaying = false;
        updatePlayButton();
        if (visualizer) visualizer.classList.add('paused');
        if (currentPlayingCard) currentPlayingCard.querySelector('.play-track-btn').classList.remove('playing');
        if (currentTrackTitle) currentTrackTitle.textContent = 'TRACK_ENDED';
    });

    function updatePlayButton() {
        if (!playPauseBtn) return;
        playPauseBtn.innerHTML = isPlaying
            ? '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>'
            : '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>';
    }

    // Initial visualizer state
    if (visualizer) visualizer.classList.add('paused');
});
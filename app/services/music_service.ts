import env from '#start/env'
import app from '@adonisjs/core/services/app'
import fs from 'node:fs/promises'
import path from 'node:path'

export interface GeneratePayload {
    style: string
    ambiance?: string
    sounds?: string[]
}

export interface MusicTrack {
    filename: string
    url: string
    taskId: string
    style: string
    version: string
    date: Date
    size: number
    title: string
}

export default class MusicService {
    private apiKey: string
    private storagePath: string

    constructor() {
        this.apiKey = env.get('MUSIC_GPT_API_KEY')
        this.storagePath = app.publicPath('generated/music')
    }

    /**
   * Call MusicGPT API to generate music
   */
    async generate(payload: GeneratePayload) {
        const prompt = `${payload.style} ${payload.ambiance || ''} ${payload.sounds ? 'with ' + payload.sounds.join(', ') : ''}. High quality, lo-fi aesthetic.`

        console.log('Generating with prompt:', prompt)

        const response = await fetch('https://api.musicgpt.com/api/public/v1/MusicAI', {
            method: 'POST',
            headers: {
                'Authorization': this.apiKey,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                prompt: prompt,
                music_style: payload.style,
                make_instrumental: true,
            })
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error('MusicGPT API Error:', errorText)
            let errorMessage = 'Failed to start generation'
            try {
                const errorJson = JSON.parse(errorText)
                if (errorJson.detail) errorMessage = errorJson.detail
            } catch { }
            throw new Error(errorMessage)
        }

        const data = await response.json() as any

        // Return the first conversion ID for polling
        return {
            taskId: data.task_id,
            conversionId: data.conversion_id_1,
            eta: data.eta || 120
        }
    }

    async getStatus(conversionId: string, style: string = 'unknown') {
        // 1. Check if we already have the files locally
        // We construct the filename based on the convention: {taskId}_{style}_v{version}.mp3
        const filenameV1 = `${conversionId}_${style}_v1.mp3`
        const filenameV2 = `${conversionId}_${style}_v2.mp3`
        const filepathV1 = path.join(this.storagePath, filenameV1)
        const filepathV2 = path.join(this.storagePath, filenameV2)

        try {
            // Check if files exist locally first to avoid unnecessary API calls
            await fs.access(filepathV1)
            return {
                status: 'completed',
                files: [
                    { url: `/generated/music/${filenameV1}`, version: 1 },
                    { url: `/generated/music/${filenameV2}`, version: 2 }
                ]
            }
        } catch {
            // Files don't exist, query API
        }

        try {
            const url = new URL('https://api.musicgpt.com/api/public/v1/byId')
            url.searchParams.set('conversionType', 'MUSIC_AI')
            url.searchParams.set('conversion_id', conversionId)

            const response = await fetch(url.toString(), {
                headers: {
                    'Authorization': this.apiKey
                }
            })

            if (!response.ok) {
                console.error('Status check failed:', await response.text())
                return { status: 'failed' }
            }

            const data = await response.json() as any
            const conv = data.conversion

            if (!conv) {
                return { status: 'processing', progress: 'Checking status...' }
            }

            const status = conv.status?.toUpperCase()

            if (status === 'COMPLETED' && conv.conversion_path_1) {
                const files = []

                // Handle version 1
                if (conv.conversion_path_1) {
                    try {
                        await fs.access(filepathV1)
                    } catch {
                        await this.downloadFile(conv.conversion_path_1, filepathV1)
                    }
                    files.push({ url: `/generated/music/${filenameV1}`, version: 1 })
                }

                // Handle version 2
                if (conv.conversion_path_2) {
                    try {
                        await fs.access(filepathV2)
                    } catch {
                        await this.downloadFile(conv.conversion_path_2, filepathV2)
                    }
                    files.push({ url: `/generated/music/${filenameV2}`, version: 2 })
                }

                return {
                    status: 'completed',
                    files
                }
            } else if (status === 'FAILED' || status === 'ERROR') {
                return { status: 'failed', error: conv.message }
            }

            return {
                status: 'processing',
                progress: `Generating music... (${status})`
            }

        } catch (error) {
            console.error('Error checking status:', error)
            return { status: 'processing' }
        }
    }

    private async downloadFile(url: string, filepath: string) {
        const response = await fetch(url)
        if (!response.ok) throw new Error(`Failed to download ${url}`)

        const buffer = await response.arrayBuffer()
        await fs.writeFile(filepath, Buffer.from(buffer))
    }

    async listLibrary(): Promise<MusicTrack[]> {
        try {
            await fs.mkdir(this.storagePath, { recursive: true })
            const files = await fs.readdir(this.storagePath)

            const tracks: MusicTrack[] = []

            for (const file of files) {
                if (!file.endsWith('.mp3')) continue

                const stats = await fs.stat(path.join(this.storagePath, file))
                const parts = file.replace('.mp3', '').split('_')

                if (parts.length >= 2) {
                    let taskId = parts[0]
                    let style = 'Unknown'
                    let version = '1'

                    if (parts.length >= 3) {
                        // Correct format: {taskId}_{style}_v{version}.mp3
                        style = parts[1]
                        const versionStr = parts[parts.length - 1].replace('.mp3', '')
                        version = versionStr.replace('v', '')
                    } else {
                        // Legacy format: {conversionId}_v{version}.mp3
                        const versionStr = parts[1].replace('.mp3', '')
                        version = versionStr.replace('v', '')
                    }

                    tracks.push({
                        filename: file,
                        url: `/generated/music/${file}`,
                        taskId,
                        style,
                        version,
                        date: stats.mtime,
                        size: stats.size,
                        title: `${style.charAt(0).toUpperCase() + style.slice(1)} Lo-Fi #${taskId.slice(0, 6)} (${version})`
                    })
                }
            }

            return tracks.sort((a, b) => b.date.getTime() - a.date.getTime())
        } catch (error) {
            console.error('Error listing library:', error)
            return []
        }
    }
}

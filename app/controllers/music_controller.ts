import type { HttpContext } from '@adonisjs/core/http'
import MusicService from '#services/music_service'
import { inject } from '@adonisjs/core'

@inject()
export default class MusicController {
    constructor(protected musicService: MusicService) { }

    async index({ view }: HttpContext) {
        const tracks = await this.musicService.listLibrary()
        return view.render('pages/home', { tracks })
    }

    async generate({ request, response }: HttpContext) {
        try {
            const payload = request.only(['style', 'ambiance', 'sounds'])
            const result = await this.musicService.generate(payload)
            return response.json(result)
        } catch (error) {
            return response.status(400).json({
                error: error.message || 'Failed to generate music'
            })
        }
    }

    async status({ request, response }: HttpContext) {
        const id = request.param('id')
        const style = request.input('style', 'unknown')
        const result = await this.musicService.getStatus(id, style)
        return response.json(result)
    }

    async library({ response }: HttpContext) {
        const tracks = await this.musicService.listLibrary()
        return response.json(tracks)
    }
}

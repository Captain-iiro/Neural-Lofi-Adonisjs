/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'

const MusicController = () => import('#controllers/music_controller')

router.get('/', [MusicController, 'index'])
router.group(() => {
    router.post('generate', [MusicController, 'generate'])
    router.get('status/:id', [MusicController, 'status'])
    router.get('library', [MusicController, 'library'])
}).prefix('api')

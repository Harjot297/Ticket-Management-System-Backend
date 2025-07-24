import { createMovie } from '../controllers/movie/createMovie'
import express from 'express'
import { auth } from '../middlewares/auth'
import { isAdmin } from '../middlewares/isAdmin'
import { updateMovie } from '../controllers/movie/updateMovie'
import { softDeleteMovie } from '../controllers/movie/softDeleteMovie'
import { toggleMovieStatus } from '../controllers/movie/toggleMovieStatus'
import { getAllMoviesAdmin } from '../controllers/movie/getAllMoviesAdmin'
import { cacheAllAdminMovie } from '../middlewares/movies/cacheAllAdminMovie'
import { cacheAllMoviesPublic } from '../middlewares/movies/cacheAllMoviesPublic'
import { getAllMoviesPublic } from '../controllers/movie/getAllMoviesUser'

export default (router: express.Router) => {
    router.post('/movies/create' , auth , isAdmin , createMovie);
    router.put('/movies/:movieId/update' , auth , isAdmin , updateMovie);
    router.delete('/movies/:movieId/soft-delete' , auth , isAdmin , softDeleteMovie);
    router.patch('/movies/:movieId/toggle-status' , auth , isAdmin , toggleMovieStatus);
    router.get('/movies/all' , auth , isAdmin , cacheAllAdminMovie , getAllMoviesAdmin);
    router.get('/movies' , cacheAllMoviesPublic , getAllMoviesPublic);
}
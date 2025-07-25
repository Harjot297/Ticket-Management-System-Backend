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
import { cacheUpcomingMovie } from '../middlewares/movies/cacheUpcomingMovie'
import { getUpcomingMovie } from '../controllers/movie/getUpcomingMovie'
import { cacheSingleMovie } from '../middlewares/movies/cacheSingleMovie'
import { getSingleMovie } from '../controllers/movie/getSingleMovie'
import { searchMovies } from '../controllers/movie/searchMovies'
import { cacheMovieSearch } from '../middlewares/movies/cacheMovieSearch'

export default (router: express.Router) => {
    router.post('/movies/create' , auth , isAdmin , createMovie);
    router.put('/movies/:movieId/update' , auth , isAdmin , updateMovie);
    router.delete('/movies/:movieId/soft-delete' , auth , isAdmin , softDeleteMovie);
    router.patch('/movies/:movieId/toggle-status' , auth , isAdmin , toggleMovieStatus);
    router.get('/movies/all' , auth , isAdmin , cacheAllAdminMovie , getAllMoviesAdmin);
    router.get('/movies' , cacheAllMoviesPublic , getAllMoviesPublic);
    router.get('/movies/upcoming' , cacheUpcomingMovie , getUpcomingMovie);
    router.get("/movies/search", cacheMovieSearch , searchMovies);
    router.get("/movies/:movieId", cacheSingleMovie, getSingleMovie);
}
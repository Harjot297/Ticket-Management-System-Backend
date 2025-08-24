import express from 'express'
import { createShow } from '../controllers/shows/createShow'
import { auth } from '../middlewares/auth'
import { isTheatreOrAdmin } from '../middlewares/isTheatreOrAdmin'
import { cancelShow } from '../controllers/shows/cancelShow'
import { updateShow } from '../controllers/shows/updateShow'
import { getShowsByMovie } from '../controllers/shows/getShowsByMovie'
import { getShowsByTheatre } from '../controllers/shows/getShowsByTheatre'
import { cacheShowsByMovie } from '../middlewares/shows/cacheShowsByMovie'
import { cacheShowsByTheatre } from '../middlewares/shows/cacheShowsByTheatre'
import { getShowDetails } from '../controllers/shows/getShowDetails'
import { cacheShowDetails } from '../middlewares/shows/cacheShowDetails'

export default(router: express.Router) => {
    router.post('/show/create' , auth , isTheatreOrAdmin , createShow); 
    router.patch('/show/:showId/cancel-show' , auth , isTheatreOrAdmin , cancelShow);
    router.put('/show/:showId/update-show' , auth , isTheatreOrAdmin , updateShow);
    router.get('/shows/by-movie/:movieId' , cacheShowsByMovie,  getShowsByMovie);
    router.get('/shows/by-theatre/:theatreId', cacheShowsByTheatre,  getShowsByTheatre);
    router.get('/shows/:showId' , cacheShowDetails , getShowDetails);
}
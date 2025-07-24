import { myTheatre } from '../controllers/theatre/my-theatre'
import express from 'express'
import { isTheatreOrAdmin } from '../middlewares/isTheatreOrAdmin'
import { auth } from '../middlewares/auth'
import {globalCache, userScopedCache} from "../helpers/redisCache"
import { updateTheatre } from '../controllers/theatre/update-theatre'
import { pending } from '../controllers/theatre/pending'
import { isAdmin } from '../middlewares/isAdmin'
import { softDeleteTheatre } from '../controllers/theatre/soft-delete'
import { toggleTheatreStatus } from '../controllers/theatre/toggleTheatreStatus'
import { getActiveTheatres } from '../controllers/theatre/getActiveTheatre'
import { getTheatreDetails } from '../controllers/theatre/getTheatreDetails'
import { cacheTheatreId } from '../middlewares/cacheTheatreId'
import { cacheTheatreSearch } from '../middlewares/cacheTheatreSearch'
import { searchTheatre } from '../controllers/theatre/searchTheatre'
import { getNearbyTheatres } from '../controllers/theatre/getNearbyTheatres'
import { cacheNearbyTheatres } from '../middlewares/cacheNearbyTheatres'

export default (router: express.Router) => {

    router.get('/theatre/my-theatre' , auth ,  userScopedCache('theatre') , myTheatre )
    router.post('/theatre/update-theatre' , auth ,  updateTheatre)
    router.get('/theatre/pending' , auth , isAdmin, userScopedCache('theatre'),  pending)
    router.patch('/theatre/:theatreId/soft-delete' , auth , isTheatreOrAdmin , softDeleteTheatre)
    router.patch('/theatre/:theatreId/toggle-status', auth, isTheatreOrAdmin, toggleTheatreStatus);

    router.get('/theatres/active' , auth , globalCache('theatres:active', 120) , getActiveTheatres)
    router.get('/theatres/:theatreId/details', cacheTheatreId , getTheatreDetails);
    router.get('/theatres/search' , cacheTheatreSearch , searchTheatre); // city aur name se search
    router.get('/theatres/nearby' , cacheNearbyTheatres, getNearbyTheatres)
}
import { myTheatre } from '../controllers/theatre/my-theatre'
import express from 'express'
import { isTheatreOrAdmin } from '../middlewares/isTheatreOrAdmin'
import { auth } from '../middlewares/auth'
import {userScopedCache} from "../helpers/redisCache"
import { updateTheatre } from '../controllers/theatre/update-theatre'
import { pending } from '../controllers/theatre/pending'
import { isAdmin } from '../middlewares/isAdmin'
import { softDeleteTheatre } from '../controllers/theatre/soft-delete'
import { toggleTheatreStatus } from '../controllers/theatre/toggleTheatreStatus'

export default (router: express.Router) => {
    router.get('/theatre/my-theatre' , auth ,  userScopedCache('theatre') , myTheatre)
    router.post('/theatre/update-theatre' , auth ,  updateTheatre)
    router.get('/theatre/pending' , auth , isAdmin, userScopedCache('theatre'),  pending)
    router.patch('/theatre/:theatreId/soft-delete' , auth , isTheatreOrAdmin , softDeleteTheatre)
    router.patch('/theatre/:theatreId/toggle-status', auth, isTheatreOrAdmin, toggleTheatreStatus);

}
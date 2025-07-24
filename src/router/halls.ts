import express from 'express'
import { isTheatreOrAdmin } from '../middlewares/isTheatreOrAdmin'
import { createHall } from '../controllers/halls/createHall'
import { auth } from '../middlewares/auth';
import { getHallDetails } from '../controllers/halls/getHallDetails';
import { cacheHallDetails } from '../middlewares/cacheHallDetails';
import { updateHall } from '../controllers/halls/updateHall';
import { softDeleteHall } from '../controllers/halls/softDeleteHall';
import { toggleHallStatus } from '../controllers/halls/toggleHallStatus';
import { getTheatreHalls } from '../controllers/halls/getTheatreHalls';
import { cacheTheatreHalls } from '../middlewares/cacheTheatreHalls';

export default (router: express.Router) => {
    router.post('/halls/create' , auth , isTheatreOrAdmin , createHall);
    router.get('/halls/:hallId/details' ,  cacheHallDetails , getHallDetails);
    router.put('/halls/:hallId/update' , auth , isTheatreOrAdmin , updateHall);
    router.patch('/halls/:hallId/soft-delete' , auth , isTheatreOrAdmin , softDeleteHall);
    router.patch('/halls/:hallId/toggle-status' , auth , isTheatreOrAdmin , toggleHallStatus )
    router.get('/theatre/:theatreId/halls' , cacheTheatreHalls,  getTheatreHalls)
}
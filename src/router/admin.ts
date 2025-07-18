import { approveTheatre } from '../controllers/admin/approveTheatre'
import { rejectTheatre } from '../controllers/admin/rejectTheatre'
import express from 'express'
import { auth } from '../middlewares/auth'
import { isAdmin } from '../middlewares/isAdmin'

export default (router: express.Router) => {
    router.post('/admin/approve-theatre' , auth , isAdmin , approveTheatre);
    router.post('/admin/reject-theatre' , auth , isAdmin , rejectTheatre);
}
import { auth } from '../middlewares/auth'
import { registerTheatre } from '../controllers/user/register-theatre'
import express from 'express'


export default (router: express.Router) => {
    router.post('/user/register-theatre' , auth,  registerTheatre )
}
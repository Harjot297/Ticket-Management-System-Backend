import { auth } from '../middlewares/auth'
import { registerTheatre } from '../controllers/user/register-theatre'
import express from 'express'


export default (router: express.Router) => {
    // Allows only one time theatre registration meaning one 
    // theatre per user
    router.post('/user/register-theatre' , auth,  registerTheatre )
}
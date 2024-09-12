import {NextFunction, Response} from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import User from '../types/user'
import {Request} from '../interfaces/request'

dotenv.config()

function authenticateToken(req: Request, res: Response, next: NextFunction) {
  const token = req.headers['authorization']

  if (!token) {
    return res.sendStatus(403)
  }

  jwt.verify(token, process.env.JWT_SECRET as string, (err, user) => {
    if (err) {
      return res.sendStatus(403)
    }
    req.user = user as User
    next()
  })
}

export default authenticateToken
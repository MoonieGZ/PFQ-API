import {NextFunction, Request, Response} from 'express'
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

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
    req.user = user
    next()
  })
}

export default authenticateToken
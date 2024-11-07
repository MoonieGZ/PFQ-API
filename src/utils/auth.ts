import {NextFunction, Response} from 'express'
import dotenv from 'dotenv'
import {User} from '../types/user'
import {AuthenticatedRequest} from '../interfaces/request'
import {pool} from '../index'

dotenv.config()

/**
 * Middleware to authenticate a user based on an API key.
 *
 * This function extracts the API key from the request headers, verifies it against the database,
 * and retrieves the corresponding user details. If the API key is valid, the user details are
 * attached to the request object and the next middleware is called. Otherwise, an appropriate
 * error response is sent.
 *
 * @param {AuthenticatedRequest} req - The request object, containing the API key in the headers.
 * @param {Response} res - The response object, used to send back error messages if authentication fails.
 * @param {NextFunction} next - The next middleware function in the stack.
 */
export async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['authorization']

  if (!apiKey) {
    return res.status(403).json({message: 'No API key provided.'})
  }

  try {
    const [users] = await pool.query(
      'SELECT users.id, users.name, users.staff FROM users JOIN apikeys ON users.id = apikeys.userid WHERE apikeys.key = ?',
      [apiKey]
    )

    if ((users as never[]).length === 0) {
      return res.status(401).json({message: 'No such user'})
    }

    const results = users as User[]
    req.user = results[0] as User
    next()
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

export async function isStaff(userid: number) {
  const [users] = await pool.query(
    'SELECT id, name, staff FROM users WHERE id = ?', [userid]
  )

  if ((users as never[]).length === 0) {
    return false
  }

  const results = users as User[]
  return results[0].staff ? results[0].staff : false
}
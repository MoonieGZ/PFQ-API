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
async function authenticateToken(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const apiKey = req.headers['authorization']

  if (!apiKey) {
    return res.status(403).json({message: 'No API key provided.'})
  }

  try {
    // Query the database to find the user ID associated with the provided API key
    const [userid] = await pool.query('SELECT `userid` from `apikeys` WHERE `key` = ?', [apiKey])

    // If no user ID is found, return a 401 status with an error message
    if ((userid as never[]).length === 0) {
      return res.status(401).json({message: 'No such user'})
    }

    const foundUserId = userid as { userid: string }[]

    // Query the database to retrieve the user details using the found user ID
    const [users] = await pool.query(
      'SELECT id, name, staff FROM users WHERE id = ?', [foundUserId[0].userid]
    )

    // If no user details are found, return a 401 status with an error message
    if ((users as never[]).length === 0) {
      return res.status(401).json({message: 'No such user'})
    }

    // Cast the query result to the User type and attach the user details to the request object
    const results = users as User[]
    req.user = results[0] as User
    next()
  } catch (err) {
    // Handle any errors that occur during the process
    if (err instanceof Error) {
      return res.status(500).json({message: err.message})
    }

    // Return a generic error message if the error is not an instance of Error
    return res.status(500).json({message: 'An unknown error occurred'})
  }
}

export default authenticateToken
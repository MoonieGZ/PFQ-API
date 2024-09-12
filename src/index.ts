import express, {Request, Response} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {authenticator} from 'otplib'

import User from './types/user'
import authenticateToken from './utils/auth'
import {AuthenticatedRequest} from './interfaces/request'

dotenv.config()

const app = express()
const port = process.env.PORT || 2138
const jwtSecret = process.env.JWT_SECRET || 'secret'

app.use(cors())
app.use(express.json())

const pool = mysql.createPool({
  host: process.env.MYSQL_SERVER,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
})

/**
 * GET /
 *
 * This endpoint serves the root URL and sends a simple greeting message.
 *
 * @param {Request} _ - The request object (not used in this endpoint).
 * @param {Response} res - The response object, used to send back the greeting message.
 */
app.get('/', (_, res: Response) => {
  res.send('Hello!')
})

/**
 * GET /health
 *
 * This endpoint is used to check the health status of the server.
 * It returns a JSON object with a message indicating the server is running.
 *
 * @param {Request} _ - The request object (not used in this endpoint).
 * @param {Response} res - The response object, used to send back the health status.
 */
app.get('/health', (_, res: Response) => {
  res.status(200).json({message: 'ok'})
})

/**
 * POST /login
 *
 * This endpoint handles user login. It verifies the provided username, password, and optional OTP (One-Time Password).
 * If the credentials are valid, it returns a JWT token.
 *
 * @param {Request} req - The request object, containing the username, password, and optional OTP in the body.
 * @param {Response} res - The response object, used to send back the appropriate response.
 */
app.post('/login', async (req: Request, res: Response) => {
  const {username, password, otp} = req.body

  // Check if JWT secret is set
  if (jwtSecret === 'secret') {
    res.status(500).json({message: 'JWT secret not set'})
  }

  try {
    // Query the database for the user with the provided username
    const [rows] = await pool.query(
      'SELECT id, name, pw, 2fa_key as otp, staff FROM users WHERE name = ?',
      [username]
    )

    // If no user is found, return a 401 status
    if ((rows as never[]).length === 0) {
      return res.status(401).json({message: 'No such user'})
    }

    const results = rows as User[]
    const user = results[0]

    // If the user has 2FA enabled and no OTP is provided, return a 401 status
    if (user.otp && !otp) {
      return res.status(401).json({message: '2FA required'})
    }

    // If the provided OTP is invalid, return a 401 status
    if (user.otp && !authenticator.check(otp, user.otp)) {
      return res.status(401).json({message: 'Invalid 2FA code'})
    }

    // If the provided password is correct, generate and return a JWT token
    if (bcrypt.compareSync(password, user.pw)) {
      const token = jwt.sign({id: user.id, staff: user.staff}, jwtSecret, {
        expiresIn: '7d',
      })
      res.json({token})
    } else {
      // If the password is incorrect, return a 401 status
      return res.status(401).json({message: 'Invalid credentials'})
    }

  } catch (err) {
    // Handle any errors that occur during the process
    if (err instanceof Error) {
      return res.status(500).json({message: err.message})
    }

    return res.status(500).json({message: 'An unknown error occurred'})
  }
})

/**
 * GET /me
 *
 * This endpoint retrieves the authenticated user's information.
 * It requires a valid JWT token to be provided in the request headers.
 * If the token is valid, it queries the database for the user's details and returns them.
 *
 * @param {AuthenticatedRequest} req - The request object, containing the authenticated user's ID in `req.user.id`.
 * @param {Response} res - The response object, used to send back the user's information or an error message.
 */
app.get('/me', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user === undefined) {
    return res.status(500).json({message: 'Not authenticated'})
  }

  try {
    // Query the database for the user's details using the authenticated user's ID
    const [rows] = await pool.query(
      'SELECT id, name, name_display as displayname, staff FROM users WHERE id = ?',
      [req.user.id]
    )

    const results = rows as User[]

    // If no user is found, return a 404 status
    if (results === undefined || results.length === 0) {
      return res.status(404).json({message: 'User not found'})
    }

    const user = results[0]

    // Return the user's details
    res.json(user)
  } catch (err) {
    // Handle any errors that occur during the process
    if (err instanceof Error) {
      return res.status(500).json({message: err.message})
    }

    return res.status(500).json({message: 'An unknown error occurred'})
  }
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
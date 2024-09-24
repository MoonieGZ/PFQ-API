import express, {Response} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

import {authenticateToken} from './utils/auth'
import {RouteMe} from './routes/me'
import {RouteDex} from './routes/dex'
import {RoutePokemon} from './routes/pokemon'
import {RouteBoosts} from './routes/boosts'
import {RouteEggSprite} from './routes/sprite'
import {RouteDecodeShortlink, RouteEncodeShortlink, RouteFromUsername} from './routes/shortlinks'
import {RouteUsernameHistory} from './routes/usernames'
import {RouteTypeRaceRotation, RouteTypeRaceTeam} from './routes/typerace'
import {RouteClickBoosts} from './routes/eltafez/clicks'
import {RouteWishforgeBadges} from './routes/wishforge'
import {RouteVWave} from './routes/vwave'
import {RouteInventoryCurrency, RouteInventoryGems, RouteInventoryMarket} from './routes/inventory'

dotenv.config()

const app = express()
const port = process.env.PORT || 2138

app.use(cors())
app.use(express.json())

export const pool = mysql.createPool({
  host: process.env.MYSQL_SERVER,
  user: process.env.MYSQL_USER,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  timezone: 'Z',
})

/**
 * Route to respond with a simple "Hello!" message.
 * @route GET /
 * @param {Request} _ - The request object (not used).
 * @param {Response} res - The response object.
 */
app.get('/', (_, res: Response) => {
  res.send('Hello!')
})

/**
 * Route to check the health of the server.
 * Responds with a JSON object containing a message "ok".
 * @route GET /health
 * @param {Request} _ - The request object (not used).
 * @param {Response} res - The response object.
 */
app.get('/health', (_, res: Response) => {
  res.status(200).json({message: 'ok'})
})

/**
 * Route to get user information.
 * Requires authentication.
 * @route GET /me
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/me', authenticateToken, RouteMe)

/**
 * Route to get the Pokédex information.
 * Requires authentication.
 * @route GET /dex
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/dex', authenticateToken, RouteDex)

/**
 * Route to get Pokémon information.
 * Requires authentication.
 * @route GET /pokemon
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/pokemon', authenticateToken, RoutePokemon)

/**
 * Route to get boosts information.
 * Requires authentication.
 * @route GET /boosts
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/boosts', authenticateToken, RouteBoosts)

/**
 * Route to get egg sprite information.
 * @route GET /getEggSprite
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/getEggSprite', RouteEggSprite)

/**
 * Route to encode a shortlink.
 * Requires authentication.
 * @route GET /shortlink/encode
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/shortlink/encode', authenticateToken, RouteEncodeShortlink)

/**
 * Route to decode a shortlink.
 * Requires authentication.
 * @route GET /shortlink/decode
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/shortlink/decode', authenticateToken, RouteDecodeShortlink)

/**
 * Route to get shortlink from a username.
 * Requires authentication.
 * @route GET /shortlink/from-username
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/shortlink/from-username', authenticateToken, RouteFromUsername)

/**
 * Route to get the username history.
 * Requires authentication.
 * @route GET /username-history
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/username-history', authenticateToken, RouteUsernameHistory)

/**
 * Route to get the Type Race rotation information.
 * Requires authentication.
 * @route GET /tr/rotation
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/tr/rotation', authenticateToken, RouteTypeRaceRotation)

/**
 * Route to get the Type Race team.
 * Requires authentication.
 * @route GET /tr/team
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/tr/team', authenticateToken, RouteTypeRaceTeam)

/**
 * Route to get Wishforge badges information.
 * Requires authentication.
 * @route GET /badges
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/badges', authenticateToken, RouteWishforgeBadges)

/**
 * Route to get V-Wave information.
 * Requires authentication.
 * @route GET /vwave
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/vwave', authenticateToken, RouteVWave)

/**
 * Route to get click boosts information.
 * Requires authentication.
 * @route GET /eltafez/clickboosts
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/eltafez/clickboosts', authenticateToken, RouteClickBoosts)

/**
 * Route to get inventory gems information.
 * Requires authentication.
 * @route GET /inventory/gems
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/inventory/gems', authenticateToken, RouteInventoryGems)

/**
 * Route to get inventory currency information.
 * Requires authentication.
 * @route GET /inventory/currency
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/inventory/currency', authenticateToken, RouteInventoryCurrency)

/**
 * Route to get inventory market value.
 * Requires authentication.
 * @route GET /inventory/market
 * @middleware authenticateToken - Middleware to authenticate the token.
 * @param {Request} req - The request object.
 * @param {Response} res - The response object.
 */
app.get('/inventory/market', authenticateToken, RouteInventoryMarket)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
import express, {Response} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'

import {authenticateToken} from './utils/auth'
import {RouteMe} from './routes/me'
import {RouteDex} from './routes/dex'
import {RoutePokemon, RoutePokemonIV} from './routes/pokemon'
import {RouteBoosts} from './routes/boosts'
import {RouteEggSprite} from './routes/sprite'
import {RouteDecodeShortlink, RouteEncodeShortlink, RouteFromUsername} from './routes/shortlinks'
import {RouteUsernameHistory} from './routes/usernames'
import {RouteTypeRaceRotation, RouteTypeRaceTeam} from './routes/typerace'
import {RouteClickBoosts} from './routes/eltafez/clicks'
import {RouteWishforgeBadges} from './routes/wishforge'
import {RouteVWave} from './routes/vwave'
import {RouteInventoryCurrency, RouteInventoryGems, RouteInventoryMarket} from './routes/inventory'
import {RouteDiscordHypermode} from './routes/discord'

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

app.get('/', (_, res: Response) => {
  res.send('Hello!')
})

app.get('/health', (_, res: Response) => {
  res.status(200).json({message: 'ok'})
})

app.get('/me', authenticateToken, RouteMe)

app.get('/dex', authenticateToken, RouteDex)

app.get('/pokemon', authenticateToken, RoutePokemon)
app.get('/pokemon/iv', RoutePokemonIV)

app.get('/boosts', authenticateToken, RouteBoosts)

app.get('/getEggSprite', RouteEggSprite)

app.get('/shortlink/encode', authenticateToken, RouteEncodeShortlink)
app.get('/shortlink/decode', authenticateToken, RouteDecodeShortlink)
app.get('/shortlink/from-username', authenticateToken, RouteFromUsername)

app.get('/username-history', authenticateToken, RouteUsernameHistory)

app.get('/tr/rotation', authenticateToken, RouteTypeRaceRotation)
app.get('/tr/team', authenticateToken, RouteTypeRaceTeam)

app.get('/badges', authenticateToken, RouteWishforgeBadges)

app.get('/vwave', authenticateToken, RouteVWave)

app.get('/eltafez/clickboosts', authenticateToken, RouteClickBoosts)

app.get('/inventory/gems', authenticateToken, RouteInventoryGems)
app.get('/inventory/currency', authenticateToken, RouteInventoryCurrency)
app.get('/inventory/market', authenticateToken, RouteInventoryMarket)

app.get('/discord/hypermode', authenticateToken, RouteDiscordHypermode)

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
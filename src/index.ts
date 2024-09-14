import express, {Request, Response} from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import mysql from 'mysql2/promise'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import {authenticator} from 'otplib'

import authenticateToken from './utils/auth'
import {AuthenticatedRequest} from './interfaces/request'
import {User} from './types/user'
import {DexEntry, PkmnEntry} from './types/dex'
import {badFormes, getEggSprite, getMiniSprite, natureMap} from './utils/dex'
import {BoostsResponse} from './types/boosts'
import {areSameDay} from './utils/date'
import {decodeShortLink} from './utils/shortlinks'

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
  timezone: 'Z',
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

/**
 * GET /dex
 *
 * This endpoint retrieves a list of Pokémon entries from the database, optionally filtered by types.
 * The results are grouped by region and sorted by Pokémon name and form name.
 * It requires a valid JWT token to be provided in the request headers.
 *
 * @param {AuthenticatedRequest} req - The request object, containing the user's information and query parameters.
 * @param {Response} res - The response object, used to send back the Pokémon entries or an error message.
 */
app.get('/dex', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const {types} = req.query
  const requestedTypes = types as string | undefined

  // Base query to retrieve Pokémon entries and their regions
  let query = `
    SELECT b.name AS region_name, a.formeid, a.name, a.formename 
    FROM data_pokemon AS a 
    JOIN data_regions AS b ON a.region = b.id
  `

  const queryParams: string[] = []

  // If types are provided, add a WHERE clause to filter by types
  if (requestedTypes) {
    const typeArray = requestedTypes.split(',').map(type => type.trim())
    query += ` WHERE a.type1 IN (${typeArray.map(() => '?').join(',')}) OR
     a.type2 IN (${typeArray.map(() => '?').join(',')})`
    queryParams.push(...typeArray, ...typeArray)
  }

  // Order the results by region name, Pokémon name, and form name
  query += ' ORDER BY b.name ASC, a.name ASC, a.formename ASC'

  try {
    // Execute the query
    const [rows] = await pool.query(query, queryParams)
    const results = rows as DexEntry[]

    // Group the results by region and filter out unwanted entries
    const groupedByRegion: Record<string, Array<DexEntry>> =
        results.reduce<Record<string, DexEntry[]>>((acc, entry) => {
          if (entry.formename === 'Internal Data Forme') return acc
          if (badFormes.includes(entry.formeid)) return acc

          const sprite = getMiniSprite(entry.formeid)
          if (sprite == null) return acc

          const region: string = entry.region_name || 'Unknown'
          if (!acc[region]) {
            acc[region] = []
          }

          const newEntry: DexEntry = {
            formeid: entry.formeid,
            name: entry.name,
            formename: entry.formename,
            sprite: sprite
          }

          acc[region].push(newEntry)

          return acc
        }, {})

    // TODO: Allow a toggle for sorting (e.g. National Dex order)

    // Sort the entries within each region
    for (const region in groupedByRegion) {
      groupedByRegion[region].sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name)
        return nameComparison === 0 ? a.formename.localeCompare(b.formename) : nameComparison
      })
    }

    // Format the results for the response
    const sortedResults = Object.entries(groupedByRegion).map(([region_name, pokemon]) => ({
      region_name,
      pokemon
    }))

    // Send the sorted results as a JSON response
    res.json(sortedResults)
  } catch (err) {
    // Handle any errors that occur during the process
    if (err instanceof Error) {
      return res.status(500).json({message: err.message})
    }

    return res.status(500).json({message: 'An unknown error occurred'})
  }
})

/**
 * GET /pokemon
 *
 * This endpoint retrieves a list of Pokémon entries from the database, optionally filtered by natures.
 * It requires a valid JWT token to be provided in the request headers.
 *
 * @param {AuthenticatedRequest} req - The request object, containing the user's information and query parameters.
 * @param {Response} res - The response object, used to send back the Pokémon entries or an error message.
 */
app.get('/pokemon', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  const {natures} = req.query
  const requestedNatures = natures as string | undefined

  if (req.user === undefined) {
    return res.status(500).json({message: 'Not authenticated'})
  }

  // Initialize query parameters with the user ID
  const queryParams: (string | number)[] = [req.user.id]
  let natureParams = ''

  if (requestedNatures) {
    const naturesArray = Array.isArray(requestedNatures) ? requestedNatures : requestedNatures.split(',')

    // Handle single nature filter
    if (naturesArray.length === 1) {
      const mappedNature = natureMap(naturesArray[0].trim())
      if (mappedNature === null) {
        return res.status(404).json({message: 'Invalid nature'})
      }
      natureParams += ' AND nature = ?'
      queryParams.push(mappedNature)
    } else if (naturesArray.length > 1) {
      // Handle multiple natures filter
      const conditions = naturesArray.map((nature) => {
        const mappedNature = natureMap(nature.trim())
        if (mappedNature === null) {
          return res.status(404).json({message: 'Invalid nature'})
        }
        queryParams.push(mappedNature)
        return 'nature = ?'
      }).join(' OR ')
      natureParams += ` AND (${conditions})`
    }
  }

  try {
    // Execute the query to retrieve Pokémon entries
    const [rows] = await pool.query(
      `SELECT a.id, a.formeid, CONCAT(b.name,'/',b.formename) AS name, a.color, COUNT(*) AS count
      FROM (
        SELECT id,
          CASE formeid
            WHEN '666' THEN CONCAT('666',LOWER(HEX(0xa0+(ot MOD 0x14))))                     -- Vivillon
            WHEN '000c0' THEN CONCAT('000c',LOWER(CONV(1+(ot MOD 0x15),10,36)))              -- Maravol
            WHEN '669' THEN CONCAT('669',LOWER(HEX(0xa0+(id MOD IF(id<=5587680,26,27)))))    -- Flabebe
            WHEN '670' THEN CONCAT('670',LOWER(HEX(0xa0+(id MOD IF(id<=5587680,26,27)))))    -- Floette
            WHEN '671' THEN CONCAT('671',LOWER(HEX(0xa0+(id MOD IF(id<=5587680,26,27)))))    -- Florges
            WHEN '773a' THEN CONCAT('773c',(id MOD 7)+1)                                     -- Minior
            WHEN '892' THEN CONCAT('892',LOWER(HEX(0xa+(id MOD 4))))                         -- Zarude
            WHEN '655' THEN IF(id>4167413 AND (id MOD 10)=0, '655l', '655')                  -- Lefty Delphox
            WHEN '924' THEN IF((id MOD 100)=42, '924a', '924')                               -- Maushold Family of Three
            WHEN '981' THEN IF((id MOD 100)=42, '981b', '981')                               -- Dudunsparce Three Segment
            WHEN '405s' THEN CONCAT('405s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)  -- Seasonal Turwig
            WHEN '406s' THEN CONCAT('406s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)  -- Seasonal Grotle
            WHEN '407s' THEN CONCAT('407s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)  -- Seasonal Torterra
            WHEN '585' THEN CONCAT('585s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)   -- Seasonal Deerling
            WHEN '586' THEN CONCAT('586s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)   -- Seasonal Sawsbuck
          ELSE formeid END AS formeid,
          CASE WHEN shiny='s' AND albino='a' THEN 'melanistic'
            WHEN shiny='s' THEN 'shiny'
            WHEN albino='a' THEN 'albino'
          ELSE 'normal' END AS color
        FROM pokemon
        WHERE userid = ?
        ` + natureParams + `
      ) a
      JOIN data_pokemon b USING (formeid)
      GROUP BY formeid, color`,
      queryParams
    )

    const results = rows as PkmnEntry[]

    // Send the results as a JSON response
    res.json(results)
  } catch (err) {
    // Handle any errors that occur during the process
    if (err instanceof Error) {
      return res.status(500).json({message: err.message})
    }

    return res.status(500).json({message: 'An unknown error occurred'})
  }
})

/**
 * GET /boosts
 *
 * This endpoint retrieves the user's current boosts and statuses.
 * It requires a valid JWT token to be provided in the request headers.
 * If the token is valid, it queries the database for various user boosts and returns them.
 *
 * @param {AuthenticatedRequest} req - The request object, containing the authenticated user's ID in `req.user.id`.
 * @param {Response} res - The response object, used to send back the user's boosts or an error message.
 */
app.get('/boosts', authenticateToken, async (req: AuthenticatedRequest, res: Response) => {
  if (req.user === undefined) {
    return res.status(500).json({message: 'Not authenticated'})
  }

  const nowUTC = new Date()

  const boosts: BoostsResponse = {
    hyperMode: false,
    silverAmulet: false,
    goldAmulet: false,
    cobaltAmulet: false,
    shinyCharm: false,
    shinyChainName: '',
    shinyChainCount: 0,
    shinyChainForme: '',
    uberCharm: false,
    typeRace: false,
    albinoLevel: 0,
    zCrystal: false,
    seiPower: 0,
    potd: false
  }

  try {
    //region HyperMode
    const [users] = await pool.query('SELECT staff, ultimate FROM users WHERE id = ?', [req.user.id])

    if ((users as never[]).length === 0) {
      return res.status(401).json({message: 'No such user'})
    }

    const userResult = (users as { staff: number, ultimate: Date }[])[0]
    boosts.hyperMode = (userResult.staff > 0 || userResult.ultimate > nowUTC)
    //endregion

    //region Items
    const [items] = await pool.query('SELECT item, quantity FROM inventory WHERE userid = ? AND item IN(1041,1042,1043)', [req.user.id])
    const itemResults = items as { item: number, quantity: number }[]

    itemResults.forEach(item => {
      if (item.item === 1041) boosts.silverAmulet = item.quantity > 0
      if (item.item === 1042) boosts.goldAmulet = item.quantity > 0
      if (item.item === 1043) boosts.cobaltAmulet = item.quantity > 0
    })
    //endregion

    //region User Stats
    const [userStats] = await pool.query(
      `SELECT u.shinycharm, u.radar_id, u.radar_chain, u.ubercharm, p.name, p.formename, p.type1, p.type2
         FROM users_stats u JOIN data_pokemon p ON  u.radar_id = p.formeid
         WHERE u.userid = ?`,
      [req.user.id])

    const userStatsResult = (userStats as
        { shinycharm: Date, radar_id: string, radar_chain: number, ubercharm: Date, name: string, formename: string, type1: string, type2: string }[])[0]

    boosts.shinyCharm = userStatsResult.shinycharm > nowUTC
    boosts.shinyChainName = userStatsResult.name + (userStatsResult.formename ? ` [${userStatsResult.formename}]` : '')
    boosts.shinyChainCount = userStatsResult.radar_chain
    boosts.shinyChainForme = userStatsResult.radar_id
    boosts.uberCharm = userStatsResult.ubercharm > nowUTC
    //endregion

    //region Type Race
    const types = [userStatsResult.type1, userStatsResult.type2 || '']

    const [typeWar] = await pool.query('SELECT type FROM typewar WHERE userid = ? AND month = DATE_FORMAT(CURDATE(), \'%Y-%m-01\')', [req.user.id])
    const typeWarResult = (typeWar as { type: string }[])[0]

    boosts.typeRace = types.includes(typeWarResult.type)
    //endregion

    //region Albino Hunt
    const [albinoHunt] = await pool.query('SELECT level, charged, typeboost, typetimestamp FROM albino_hunt WHERE userid = ?', [req.user.id])
    const albinoHuntResult = (albinoHunt as { level: number, charged: Date, typeboost: string, typetimestamp: Date }[])[0]

    boosts.albinoLevel = areSameDay(albinoHuntResult.charged, nowUTC) ? albinoHuntResult.level : 0
    boosts.zCrystal = albinoHuntResult.typetimestamp > nowUTC && types.includes(albinoHuntResult.typeboost)
    //endregion

    //region Counters
    const [counters] = await pool.query('SELECT bonus, bonusday FROM counters WHERE id = 8')
    const countersResult = (counters as { bonus: number, bonusday: Date }[])[0]

    boosts.seiPower = areSameDay(countersResult.bonusday, nowUTC) ? countersResult.bonus : 0
    //endregion

    //region POTD
    const [potdForecast] = await pool.query('SELECT potd FROM forecast_potd WHERE date = CURDATE()')
    const potdForecastResult = (potdForecast as { potd: string }[])[0]

    boosts.potd = potdForecastResult?.potd === boosts.shinyChainForme
    //endregion

    res.json(boosts)
  } catch (err) {
    // Handle any errors that occur during the process
    if (err instanceof Error) {
      return res.status(500).json({message: err.message})
    }

    return res.status(500).json({message: 'An unknown error occurred'})
  }
})

/**
 * GET /getEggSprite
 *
 * This endpoint retrieves the egg sprite for a given Pokémon based on a summary provided in the query parameters.
 * The summary is decoded to get the Pokémon ID, which is then used to query the database for the formeid.
 * The formeid is used to get the corresponding egg sprite, which is returned as a JSON response.
 *
 * @param {Request} req - The request object, containing the summary in the query parameters.
 * @param {Response} res - The response object, used to send back the egg sprite or an error message.
 */
app.get('/getEggSprite', async (req: Request, res: Response) => {
  const {summary} = req.query
  if (summary == null) {
    return res.status(400).json({message: 'No summary provided'})
  }

  const id = decodeShortLink(summary as string) as number

  const [pkmn] = await pool.query('SELECT formeid FROM pokemon WHERE id = ?', [id])
  const pkmnResult = (pkmn as { formeid: string }[])[0]
  const sprite = getEggSprite(pkmnResult.formeid)
  res.json(sprite)
})

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`)
})
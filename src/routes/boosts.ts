import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {BoostsResponse} from '../types/boosts'
import {areSameDay} from '../utils/date'
import {pool} from '../index'

export async function RouteBoosts(req: AuthenticatedRequest, res: Response) {
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

    const userResult = (users as { staff: number, ultimate?: Date }[])[0]
    boosts.hyperMode = (userResult.staff > 0 || (userResult.ultimate !== undefined && userResult.ultimate > nowUTC))
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
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
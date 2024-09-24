import {AuthenticatedRequest} from '../../interfaces/request'
import {Response} from 'express'
import {pool} from '../../index'
import {isBirthdayBonus} from '../../utils/date'
import {ClickBoostResponse, ClickBoostResult} from '../../types/eltafez/clicks'
import {getBadges} from '../../utils/wishforge'
import {getVWave} from '../../utils/vwave'

export async function RouteClickBoosts(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const now = new Date()

    const [boosts] = await pool.query('SELECT staff, staff_sub, dob, joined, ultimate FROM users WHERE id = ?', [req.user.id])
    const boost = (boosts as ClickBoostResponse[])[0] as ClickBoostResponse

    let date: Date
    if (boost.dob === undefined) {
      date = boost.joined
    } else {
      date = boost.dob
    }

    const result: ClickBoostResult = {
      hypermode: (boost.staff > 0 || boost.ultimate !== undefined && boost.ultimate > now),
      wikieditor: (boost.staff_sub & 1) !== 0,
      helpinghand: (boost.staff_sub & 2) !== 0,
      birthday: isBirthdayBonus(date),
      nitroboost: (boost.staff_sub & 8) !== 0
    }

    const badges = await getBadges(req.user.id)
    const vwave = await getVWave()

    res.json({boosts: result, badges: badges, vwave})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
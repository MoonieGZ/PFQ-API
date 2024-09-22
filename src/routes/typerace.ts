import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {computeType} from '../utils/types'
import {pool} from '../index'

export async function RouteGetTypeRaceRotation(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const [typeWar] = await pool.query('SELECT type FROM typewar WHERE userid = ? AND month = DATE_FORMAT(CURDATE(), \'%Y-%m-01\')', [req.user.id])
  const typeWarResult = (typeWar as { type: string }[])[0]

  const typeRotation: string[] = computeType(req.user).map(type => type === typeWarResult.type ? `${type} [active]` : type)

  res.json({rotation: typeRotation})
}

export async function RouteGetTypeRaceTeam(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const [typeWar] = await pool.query('SELECT type FROM typewar WHERE userid = ? AND month = DATE_FORMAT(CURDATE(), \'%Y-%m-01\')', [req.user.id])
  const typeWarResult = (typeWar as { type: string }[])[0]

  res.json(typeWarResult)
}
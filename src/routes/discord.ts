import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {pool} from '../index'

export async function RouteDiscordHypermode(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const requestedId = req.query.id as number | undefined

  if (!requestedId) {
    return res.status(400).json({error: 'Invalid request'})
  }

  try {
    const [rows] = await pool.query('SELECT staff, ultimate FROM users WHERE discordid = ?', [requestedId])
    const results = rows as UserUltimate[]

    if (results.length === 0) {
      return res.status(404).json({error: 'User not found'})
    }

    if (results[0].staff > 0 || results[0].ultimate !== undefined && results[0].ultimate > new Date()) {
      return res.status(200).json({hypermode: true})
    }

    return res.status(200).json({hypermode: false})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

interface UserUltimate {
  staff: number;
  ultimate: Date;
}
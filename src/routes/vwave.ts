import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {getVWave} from '../utils/vwave'

export async function RouteVWave(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const vwave = await getVWave()
    res.json({vwave: vwave})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
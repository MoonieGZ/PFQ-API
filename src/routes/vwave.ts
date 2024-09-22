import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {getVWave} from '../utils/vwave'

export async function RouteGetVWave(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const vwave = await getVWave()
  res.json({vwave: vwave})
}
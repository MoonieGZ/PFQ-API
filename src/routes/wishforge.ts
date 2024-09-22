import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {getBadges} from '../utils/wishforge'

export async function RouteGetWishforgeBadges(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const badges = await getBadges(req.user.id)
    return res.json({badges: badges})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
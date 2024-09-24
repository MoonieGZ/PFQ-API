import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {pool} from '../index'

export async function RouteInventoryGems(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const [inventory] = await pool.query(
      'SELECT b.id, b.name, a.quantity FROM inventory a JOIN data_items b on a.item = b.id WHERE userid = ? AND b.category = \'Gems\' ORDER BY b.id;',
      [req.user.id])
    res.json({inventory: inventory})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

export async function RouteInventoryCurrency(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const [currency] = await pool.query('SELECT b.credits, b.gold, b.zophan FROM `apikeys` a JOIN `users` b ON a.userid = b.id WHERE a.userid = ?', [req.user.id])
    res.json({inventory: currency})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
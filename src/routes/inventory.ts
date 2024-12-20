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
    const [currency] = await pool.query('SELECT credits, gold, zophan FROM `users` WHERE userid = ?', [req.user.id])
    res.json({inventory: currency})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

export async function RouteInventoryMarket(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const [inventory] = await pool.query(
      `SELECT i.item, d.name, i.quantity, MIN(m.price) AS price 
      FROM inventory i 
      JOIN data_items d ON i.item = d.id 
      LEFT JOIN marketboard_items_new m ON i.item = m.itemid 
      WHERE i.userid = ? AND i.quantity != 0 
      GROUP BY i.item, i.quantity, d.name`,
      [req.user.id]
    )

    res.json({inventory: inventory})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
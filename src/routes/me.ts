import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {User} from '../types/user'
import {pool} from '../index'

export async function RouteMe(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(500).json({message: 'Not authenticated'})
  }

  try {
    const [rows] = await pool.query(
      'SELECT id, name, name_display as displayname, staff FROM users WHERE id = ?',
      [req.user.id]
    )

    const results = rows as User[]

    if (results.length === 0) {
      return res.status(404).json({message: 'User not found'})
    }

    res.json(results[0])
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
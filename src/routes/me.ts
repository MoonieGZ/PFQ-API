import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {User} from '../types/user'
import {pool} from '../index'
import {encodeShortLink} from '../utils/shortlinks'

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

    const user = results[0]
    user.shortlink = encodeShortLink(user.id)

    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {id, ...userWithoutId} = user

    res.json(userWithoutId)
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {isStaff} from '../utils/auth'
import {pool} from '../index'
import {User} from '../types/user'

export async function RouteGetUsernameHistory(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !await isStaff(req.user.id)) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const requestedName = req.query.username as string | undefined
  if (!requestedName) {
    return res.status(400).json({error: 'Invalid request'})
  }

  try {
    const [users] = await pool.query(
      'SELECT id FROM users WHERE name = ?', [requestedName]
    )

    if (!(users as User[]).length) {
      return res.status(404).json({message: 'User not found'})
    }

    const user = (users as User[])[0]
    const [usernameChanges] = await pool.query('SELECT * FROM user_name_changes WHERE userid = ?', [user.id])

    res.json(usernameChanges)
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
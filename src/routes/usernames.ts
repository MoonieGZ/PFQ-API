import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {isStaff} from '../utils/auth'
import {pool} from '../index'

export async function RouteUsernameHistory(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !await isStaff(req.user.id)) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const requestedName = req.query.username as string | undefined
  if (!requestedName) {
    return res.status(400).json({error: 'Invalid request'})
  }

  try {
    const [results] = await pool.query(
      `
        SELECT u.id, unc.*
        FROM users u
        LEFT JOIN user_name_changes unc ON u.id = unc.userid
        WHERE u.name = ?
      `,
      [requestedName]
    )

    if (!(results as never[]).length) {
      return res.status(404).json({message: 'User not found'})
    }

    res.json(results)
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {isStaff} from '../utils/auth'
import {pool} from '../index'
import {User} from '../types/user'

export async function RouteSendPm(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !await isStaff(req.user.id)) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const requestedName = req.body.username as string | undefined
  const requestedContent = req.body.content as string | undefined

  if (!requestedName || !requestedContent) {
    return res.status(400).json({error: 'Invalid request'})
  }

  const [rows] = await pool.query(
    'SELECT id, name, name_display as displayname, staff FROM users WHERE name = ?',
    [requestedName]
  )

  const results = rows as User[]

  if (results.length === 0) {
    return res.status(404).json({message: 'User not found'})
  }

  const user = results[0]

  try {
    const subject = 'Discord Report'

    const [pmResults] = await pool.query(
      `
                insert into pm (from, to, subject, content)
                values (?, ?, ?, ?)
            `,
      [2, user.id, subject, requestedContent]
    )

    if (!(pmResults as never[]).length) {
      return res.status(404).json({message: 'User not found'})
    }

    const [pmConvoResults] = await pool.query(
      `
                insert into pm_convos (userid, otheruser, lastsubject, lastpostby)
                values (?, ?, ?, 'me')
                on duplicate key update timestamp   = now(),
                                        lastsubject = values(lastsubject),
                                        lastpostby  = values(lastpostby)
            `,
      [2, user.id, subject, requestedContent]
    )

    if (!(pmConvoResults as never[]).length) {
      return res.status(404).json({message: 'User not found'})
    }

    return res.status(200).json({message: 'Message sent'})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
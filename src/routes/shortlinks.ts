import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {decodeShortLink, encodeShortLink} from '../utils/shortlinks'
import {isStaff} from '../utils/auth'
import {pool} from '../index'
import {User} from '../types/user'

export async function RouteEncodeShortlink(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !await isStaff(req.user.id)) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const requestedId = req.query.key as number | undefined

    if (!requestedId) {
      return res.status(400).json({error: 'Invalid request'})
    }

    res.json({result: encodeShortLink(requestedId)})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

export async function RouteDecodeShortlink(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !await isStaff(req.user.id)) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const requestedShortlink = req.query.key as string | undefined

    if (!requestedShortlink) {
      return res.status(400).json({error: 'Invalid request'})
    }

    res.json({result: decodeShortLink(requestedShortlink)})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

export async function RouteFromUsername(req: AuthenticatedRequest, res: Response) {
  if (!req.user || !await isStaff(req.user.id)) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  try {
    const requestedUsername = req.query.key as string | undefined

    if (!requestedUsername) {
      return res.status(400).json({error: 'Invalid request'})
    }

    const [users] = await pool.query('SELECT id FROM users WHERE name = ?', [requestedUsername])
    if ((users as never[]).length === 0) {
      return res.status(404).json({error: 'User not found'})
    }

    res.json({result: encodeShortLink((users as User[])[0].id)})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
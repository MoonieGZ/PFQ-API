import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {decodeShortLink, encodeShortLink} from '../utils/shortlinks'
import {isStaff} from '../utils/auth'

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
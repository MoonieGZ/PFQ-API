import {Request, Response} from 'express'
import {decodeShortLink} from '../utils/shortlinks'
import {getEggSprite} from '../utils/dex'
import {pool} from '../index'

export async function RouteEggSprite(req: Request, res: Response) {
  const {summary} = req.query
  if (!summary) {
    return res.status(400).json({message: 'No summary provided'})
  }

  try {
    const id = decodeShortLink(summary as string) as number
    const [pkmn] = await pool.query('SELECT formeid FROM pokemon WHERE id = ?', [id])
    res.json(getEggSprite((pkmn as { formeid: string }[])[0].formeid))
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
import {AuthenticatedRequest} from '../interfaces/request'
import {Request, Response} from 'express'
import {natureMap} from '../utils/dex'
import {PkmnEntry} from '../types/dex'
import {pool} from '../index'
import {decodeShortLink} from '../utils/shortlinks'
import {decodeStats} from '../utils/pokemon'
import {RowDataPacket} from 'mysql2'

export async function RoutePokemon(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const {natures} = req.query
  const requestedNatures = natures as string | undefined

  const queryParams: (string | number)[] = [req.user.id]
  let natureParams = ''

  if (requestedNatures) {
    const naturesArray = Array.isArray(requestedNatures) ? requestedNatures : requestedNatures.split(',')

    if (naturesArray.length === 1) {
      const mappedNature = natureMap(naturesArray[0].trim())
      if (mappedNature === null) {
        return res.status(404).json({message: 'Invalid nature'})
      }
      natureParams += ' AND nature = ?'
      queryParams.push(mappedNature)
    } else if (naturesArray.length > 1) {
      const conditions = naturesArray.map((nature) => {
        const mappedNature = natureMap(nature.trim())
        if (mappedNature === null) {
          return res.status(404).json({message: 'Invalid nature'})
        }
        queryParams.push(mappedNature)
        return 'nature = ?'
      }).join(' OR ')
      natureParams += ` AND (${conditions})`
    }
  }

  try {
    const [rows] = await pool.query(
      `SELECT a.id, a.formeid, CONCAT(b.name,'/',b.formename) AS name, a.color, COUNT(*) AS count
      FROM (
        SELECT id,
          CASE formeid
            WHEN '666' THEN CONCAT('666',LOWER(HEX(0xa0+(ot MOD 0x14))))                     -- Vivillon
            WHEN '000c0' THEN CONCAT('000c',LOWER(CONV(1+(ot MOD 0x15),10,36)))              -- Maravol
            WHEN '669' THEN CONCAT('669',LOWER(HEX(0xa0+(id MOD IF(id<=5587680,26,27)))))    -- Flabebe
            WHEN '670' THEN CONCAT('670',LOWER(HEX(0xa0+(id MOD IF(id<=5587680,26,27)))))    -- Floette
            WHEN '671' THEN CONCAT('671',LOWER(HEX(0xa0+(id MOD IF(id<=5587680,26,27)))))    -- Florges
            WHEN '773a' THEN CONCAT('773c',(id MOD 7)+1)                                     -- Minior
            WHEN '892' THEN CONCAT('892',LOWER(HEX(0xa+(id MOD 4))))                         -- Zarude
            WHEN '655' THEN IF(id>4167413 AND (id MOD 10)=0, '655l', '655')                  -- Lefty Delphox
            WHEN '924' THEN IF((id MOD 100)=42, '924a', '924')                               -- Maushold Family of Three
            WHEN '981' THEN IF((id MOD 100)=42, '981b', '981')                               -- Dudunsparce Three Segment
            WHEN '405s' THEN CONCAT('405s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)  -- Seasonal Turwig
            WHEN '406s' THEN CONCAT('406s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)  -- Seasonal Grotle
            WHEN '407s' THEN CONCAT('407s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)  -- Seasonal Torterra
            WHEN '585' THEN CONCAT('585s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)   -- Seasonal Deerling
            WHEN '586' THEN CONCAT('586s',(MONTH(NOW())-(DAY(NOW())<=20)) DIV 3 MOD 4 + 1)   -- Seasonal Sawsbuck
          ELSE formeid END AS formeid,
          CASE WHEN shiny='s' AND albino='a' THEN 'melanistic'
            WHEN shiny='s' THEN 'shiny'
            WHEN albino='a' THEN 'albino'
          ELSE 'normal' END AS color
        FROM pokemon
        WHERE userid = ?
        ` + natureParams + `
      ) a
      JOIN data_pokemon b USING (formeid)
      GROUP BY formeid, color`,
      queryParams
    )

    const results = rows as PkmnEntry[]

    res.json(results)
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}

const cache: { [key: string]: number[] } = {}

export async function RoutePokemonIV(req: Request, res: Response) {
  const {id} = req.query
  const requestedShortlink = id as string | undefined

  if (!requestedShortlink) {
    return res.status(404).json({message: 'Invalid ID: No ID provided'})
  }

  if (cache[requestedShortlink]) {
    return res.json({value: cache[requestedShortlink], cached: true})
  }

  const requestedId = decodeShortLink(requestedShortlink)
  if (requestedId === null) {
    return res.status(404).json({message: 'Invalid ID: Invalid shortlink'})
  }

  try {
    const [rows] = await pool.query<RowDataPacket[]>('SELECT iv FROM pokemon WHERE id = ? AND stage = `pokemon` LIMIT 1', [requestedId])

    const result = rows.length > 0 ? (rows[0] as { iv: number }).iv : null
    if (result === null) {
      return res.status(404).json({message: 'Failed to fetch IV.'})
    }

    const iv = decodeStats(result)
    cache[requestedShortlink] = iv

    res.json({value: iv, cached: false})
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
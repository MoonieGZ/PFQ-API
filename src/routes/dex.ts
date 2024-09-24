import {AuthenticatedRequest} from '../interfaces/request'
import {Response} from 'express'
import {DexEntry} from '../types/dex'
import {badFormes, getMiniSprite} from '../utils/dex'
import {pool} from '../index'

export async function RouteDex(req: AuthenticatedRequest, res: Response) {
  if (!req.user) {
    return res.status(403).json({error: 'Unauthorized'})
  }

  const {types} = req.query
  const requestedTypes = types as string | undefined

  let query = `
    SELECT b.name AS region_name, a.formeid, a.name, a.formename 
    FROM data_pokemon AS a 
    JOIN data_regions AS b ON a.region = b.id
  `

  const queryParams: string[] = []

  if (requestedTypes) {
    const typeArray = requestedTypes.split(',').map(type => type.trim())
    query += ` WHERE a.type1 IN (${typeArray.map(() => '?').join(',')}) OR
     a.type2 IN (${typeArray.map(() => '?').join(',')})`
    queryParams.push(...typeArray, ...typeArray)
  }

  query += ' ORDER BY b.name ASC, a.name ASC, a.formename ASC'

  try {
    const [rows] = await pool.query(query, queryParams)
    const results = rows as DexEntry[]

    const groupedByRegion: Record<string, Array<DexEntry>> =
        results.reduce<Record<string, DexEntry[]>>((acc, entry) => {
          if (entry.formename === 'Internal Data Forme') return acc
          if (badFormes.includes(entry.formeid)) return acc

          const sprite = getMiniSprite(entry.formeid)
          if (sprite == null) return acc

          const region: string = entry.region_name || 'Unknown'
          if (!acc[region]) {
            acc[region] = []
          }

          const newEntry: DexEntry = {
            formeid: entry.formeid,
            name: entry.name,
            formename: entry.formename,
            sprite: sprite
          }

          acc[region].push(newEntry)

          return acc
        }, {})

    // TODO: Allow a toggle for sorting (e.g. National Dex order)

    for (const region in groupedByRegion) {
      groupedByRegion[region].sort((a, b) => {
        const nameComparison = a.name.localeCompare(b.name)
        return nameComparison === 0 ? a.formename.localeCompare(b.formename) : nameComparison
      })
    }

    const sortedResults = Object.entries(groupedByRegion).map(([region_name, pokemon]) => ({
      region_name,
      pokemon
    }))

    res.json(sortedResults)
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
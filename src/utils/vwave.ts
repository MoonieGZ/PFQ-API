import {pool} from '../index'
import {RowDataPacket} from 'mysql2'

export async function getVWave(): Promise<string> {
  const [rows] = await pool.query<RowDataPacket[]>('SELECT vwave FROM forecast_vwave WHERE date = CURDATE()')
  return rows[0].vwave as string
}
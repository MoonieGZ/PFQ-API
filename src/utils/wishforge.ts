import {pool} from '../index'

export async function getBadges(userid: number) {
  const [badges] = await pool.query('SELECT a.type, b.name FROM gemwish_badges a JOIN data_gemwish_badges b ON a.level = b.id WHERE a.userid = ?', [userid])
  return badges
}
import {pool} from '../index'
import {Request, Response} from 'express'
import mysql from 'mysql2/promise'

export async function RouteMetricsZophan(req: Request, res: Response) {
  try {
    const [dailyStats] = await pool.query(`
        SELECT DATE(timestamp) AS day, COUNT(*) AS transactions, SUM(amount) AS total
        FROM zophan
        GROUP BY day
    `)

    const dailyRows = dailyStats as mysql.RowDataPacket[]

    const [weeklyStats] = await pool.query(`
        SELECT YEAR(timestamp) AS year, WEEK(timestamp) AS week, COUNT(*) AS transactions, SUM(amount) AS total
        FROM zophan
        GROUP BY year, week
    `)

    const weeklyRows = weeklyStats as mysql.RowDataPacket[]

    const [monthlyStats] = await pool.query(`
        SELECT YEAR(timestamp) AS year, MONTH(timestamp) AS month, COUNT(*) AS transactions, SUM(amount) AS total
        FROM zophan
        GROUP BY year, month
    `)

    const monthlyRows = monthlyStats as mysql.RowDataPacket[]

    let metrics = '# Aggregated metrics\n'

    dailyRows.forEach(({day, transactions, total}) => {
      metrics += `zophan_daily_transactions{day="${day}"} ${transactions}\n`
      metrics += `zophan_daily_amount{day="${day}"} ${total || 0}\n`
    })

    weeklyRows.forEach(({year, week, transactions, total}) => {
      metrics += `zophan_weekly_transactions{year="${year}", week="${week}"} ${transactions}\n`
      metrics += `zophan_weekly_amount{year="${year}", week="${week}"} ${total || 0}\n`
    })

    monthlyRows.forEach(({year, month, transactions, total}) => {
      metrics += `zophan_monthly_transactions{year="${year}", month="${month}"} ${transactions}\n`
      metrics += `zophan_monthly_amount{year="${year}", month="${month}"} ${total || 0}\n`
    })

    res.set('Content-Type', 'text/plain')
    res.send(metrics)
  } catch (err) {
    return res.status(500).json({message: err instanceof Error ? err.message : 'An unknown error occurred'})
  }
}
// Apply only the additive trip-to-invoice schema upgrade (no data backfill).
const { loadEnvConfig } = require('@next/env')
const { Client } = require('pg')
const { readFileSync } = require('node:fs')
const { resolve } = require('node:path')
loadEnvConfig(process.cwd(), true, { info() {}, error() {} })
const client = new Client({ connectionString: process.env.DIRECT_URL || process.env.DATABASE_URL, connectionTimeoutMillis: 15000 })
async function main() {
  await client.connect()
  try {
    if (process.argv.includes('--check')) {
      const result = await client.query(`SELECT
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'Trip' AND column_name = 'partyBillId') AS trip_link,
        EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = current_schema() AND table_name = 'PartyBill' AND column_name = 'tripLinked') AS bill_flag`)
      if (!result.rows[0].trip_link || !result.rows[0].bill_flag) {
        const error = new Error('Trip invoice schema is not ready')
        error.code = 'SCHEMA_NOT_READY'
        throw error
      }
      console.log('Trip-to-invoice schema verified.')
      return
    }
    await client.query('BEGIN')
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query("SET LOCAL statement_timeout = '30s'")
    await client.query(readFileSync(resolve('prisma/sql/20260911_trip_invoice_links.sql'), 'utf8'))
    await client.query('COMMIT')
    console.log('Trip-to-invoice schema upgrade applied. Existing records were not allocated or removed.')
  } catch (error) {
    if (!process.argv.includes('--check')) await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}
main().catch(error => { console.error(`Schema upgrade failed (${error.code || 'unknown error'}).`); process.exitCode = 1 })

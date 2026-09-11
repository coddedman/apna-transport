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
    await client.query('BEGIN')
    await client.query("SET LOCAL lock_timeout = '5s'")
    await client.query("SET LOCAL statement_timeout = '30s'")
    await client.query(readFileSync(resolve('prisma/sql/20260911_trip_invoice_links.sql'), 'utf8'))
    await client.query('COMMIT')
    console.log('Trip-to-invoice schema upgrade applied. Existing records were not allocated or removed.')
  } catch (error) {
    await client.query('ROLLBACK')
    throw error
  } finally {
    await client.end()
  }
}
main().catch(error => { console.error(`Schema upgrade failed (${error.code || 'unknown error'}).`); process.exitCode = 1 })

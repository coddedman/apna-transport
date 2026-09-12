const { spawnSync } = require('node:child_process')
// Production applies the reviewed additive upgrade; previews only verify it.
const args = ['scripts/apply-trip-invoice-links.cjs']
if (process.env.VERCEL_ENV !== 'production') args.push('--check')
const result = spawnSync(process.execPath, args, { stdio: 'inherit', env: process.env })
if (result.error) console.error('Unable to start database preparation.')
process.exit(result.status ?? 1)

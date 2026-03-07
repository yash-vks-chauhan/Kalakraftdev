#!/usr/bin/env node

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: process.cwd(),
  encoding: 'utf8',
}).trim()

const tracked = execFileSync('git', ['ls-files', '-z'], {
  cwd: repoRoot,
  encoding: 'utf8',
})
  .split('\0')
  .filter(Boolean)
  .filter((file) => fs.existsSync(path.join(repoRoot, file)))

const blockedPatterns = [
  { label: 'database artifact', test: (file) => /\.(db|sqlite|sqlite3)(\.|$)/i.test(file) },
  { label: 'database backup', test: (file) => /\.(bak|backup)$/i.test(file) && /(db|sqlite)/i.test(file) },
  { label: 'environment file', test: (file) => /(^|\/)\.env($|\.)/.test(file) && !/\.env\.example$/.test(file) },
  { label: 'private key / certificate', test: (file) => /\.(pem|key|p12|crt)$/i.test(file) },
  { label: 'Next.js build output', test: (file) => /(^|\/)\.next\//.test(file) },
]

const violations = tracked.flatMap((file) =>
  blockedPatterns
    .filter((pattern) => pattern.test(file))
    .map((pattern) => ({ file, label: pattern.label })),
)

if (violations.length > 0) {
  console.error('Blocked sensitive or generated files are tracked in git:')
  for (const violation of violations) {
    console.error(`- ${violation.file} (${violation.label})`)
  }
  process.exit(1)
}

console.log('No blocked sensitive or generated files are tracked.')

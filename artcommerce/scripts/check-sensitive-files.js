#!/usr/bin/env node

const { execFileSync } = require('node:child_process')
const fs = require('node:fs')
const path = require('node:path')

const repoRoot = execFileSync('git', ['rev-parse', '--show-toplevel'], {
  cwd: process.cwd(),
  encoding: 'utf8',
}).trim()

const candidateFiles = execFileSync('git', ['ls-files', '-z', '--cached', '--others', '--exclude-standard'], {
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

const pathViolations = candidateFiles.flatMap((file) =>
  blockedPatterns
    .filter((pattern) => pattern.test(file))
    .map((pattern) => ({ file, label: pattern.label })),
)

const placeholderValues = [
  /postgres(?:ql)?:\/\/(?:user|username):(?:password|pass)@/i,
  /smtp:\/\/(?:user|username):(?:password|pass)@/i,
  /(?:hostname|host):(?:port|5432|587)/i,
  /(?:dbname|database_name|your_|example\.com|smtp\.example\.com)/i,
]

const contentPatterns = [
  { label: 'Postgres connection string', pattern: /postgres(?:ql)?:\/\/[^\s"'`<>]+/gi },
  { label: 'SMTP connection string with credentials', pattern: /smtp:\/\/[^\s"'`<>]+/gi },
  { label: 'Firebase web API key literal', pattern: /AIza[0-9A-Za-z_-]{35}/g },
  { label: 'AWS access key', pattern: /\bAKIA[0-9A-Z]{16}\b/g },
  { label: 'GitHub fine-grained token', pattern: /\bgithub_pat_[A-Za-z0-9_]+\b/g },
  { label: 'Slack token', pattern: /\bxox[baprs]-[A-Za-z0-9-]+\b/g },
  { label: 'Stripe secret key', pattern: /\bsk_(?:live|test)_[A-Za-z0-9]+\b/g },
  { label: 'private key block', pattern: /-----BEGIN (?:RSA |EC |OPENSSH |)PRIVATE KEY-----/g },
]

const skippedContentExtensions = new Set([
  '.gif',
  '.jpeg',
  '.jpg',
  '.mp4',
  '.pdf',
  '.png',
  '.ppt',
  '.pptx',
  '.webp',
])

function isPlaceholder(value) {
  return placeholderValues.some((pattern) => pattern.test(value))
}

function shouldScanContent(file) {
  const ext = path.extname(file).toLowerCase()
  if (skippedContentExtensions.has(ext)) return false
  const stat = fs.statSync(path.join(repoRoot, file))
  return stat.size <= 2 * 1024 * 1024
}

function readTextFile(file) {
  const buffer = fs.readFileSync(path.join(repoRoot, file))
  if (buffer.includes(0)) return null
  return buffer.toString('utf8')
}

const contentViolations = []

for (const file of candidateFiles) {
  if (!shouldScanContent(file)) continue
  const text = readTextFile(file)
  if (!text) continue

  for (const { label, pattern } of contentPatterns) {
    pattern.lastIndex = 0
    const matches = text.match(pattern) || []
    if (matches.some((match) => !isPlaceholder(match))) {
      contentViolations.push({ file, label })
    }
  }
}

const violations = [...pathViolations, ...contentViolations]

if (violations.length > 0) {
  console.error('Blocked sensitive or generated files are tracked or ready to be committed:')
  for (const violation of violations) {
    console.error(`- ${violation.file} (${violation.label})`)
  }
  process.exit(1)
}

console.log('No blocked sensitive or generated files were found.')

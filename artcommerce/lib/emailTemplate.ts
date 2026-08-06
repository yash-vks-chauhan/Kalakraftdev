import { getPublicAppUrlForPath } from './appUrl'
import { escapeHtml } from './emailContent'

/* -------------------------------------------------------------------------- */
/* Kalakraft transactional email shell                                        */
/*                                                                            */
/* One 600px table-based layout shared by every email the store sends. The    */
/* header, footer and type scale are fixed; the middle `module` is the only   */
/* part that changes between messages.                                        */
/*                                                                            */
/* Every string handed to this renderer is escaped here, so call sites pass   */
/* raw values and never build HTML themselves.                                */
/* -------------------------------------------------------------------------- */

const INK = '#1a1a1a'
const BODY_INK = '#444444'
const GRAPHITE = '#666666'
const MUTED = '#8a8a8a'
const HAIRLINE = '#e5e5e5'
const ROW_LINE = '#f0f0f0'
const PAPER = '#fafafa'
const COPPER = '#d4a373'
const WHITE = '#ffffff'

const SERIF = "Georgia,'Times New Roman',Times,serif"
const SANS = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif"

export type ReceiptItem = {
  name: string
  meta?: string
  amount: string
}

export type FactRow = {
  label: string
  value: string
  /** Renders the value in copper — use for the one number that matters. */
  accent?: boolean
}

/** The single swappable block between the intro copy and the sign-off. */
export type EmailModule =
  /** A one-time code on a panel, with an expiry caption. */
  | { kind: 'code'; code: string; caption?: string }
  /** Line items with running totals — order receipts. */
  | {
      kind: 'receipt'
      items: ReceiptItem[]
      subtotals?: { label: string; value: string }[]
      total: { label: string; value: string }
    }
  /** A labelled key/value panel — product stats, ticket details. */
  | { kind: 'facts'; title?: string; rows: FactRow[] }
  /** A simple itemised list — cart contents. */
  | { kind: 'list'; items: { name: string; meta?: string }[] }
  /** Verbatim prose from a human, newlines preserved — support replies. */
  | { kind: 'quote'; text: string }

export type EmailCta = {
  label: string
  href: string
}

export type EmailOptions = {
  /** Hidden preview line shown in the inbox list next to the subject. */
  preheader: string
  /** Uppercase label above the headline — what this email is about. */
  eyebrow: string
  heading: string
  /** One entry per paragraph. */
  body: string[]
  module?: EmailModule
  cta?: EmailCta
  /** Small print between the module and the sign-off. */
  note?: string
  /** Defaults to the team sign-off; pass `false` for internal alerts. */
  signoff?: string | false
  /** The footer's "why you got this" line. */
  footerReason: string
}

function td(styles: string, content: string) {
  return `<td style="${styles}">${content}</td>`
}

/* ---------------------------------- modules -------------------------------- */

function renderCode(module: Extract<EmailModule, { kind: 'code' }>) {
  const caption = module.caption
    ? `<tr>${td(
        `padding:0 20px 22px 20px;font-family:${SANS};font-size:12px;line-height:18px;letter-spacing:0.1em;text-transform:uppercase;color:${COPPER};text-align:center;`,
        escapeHtml(module.caption),
      )}</tr>`
    : ''

  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:${PAPER};border:1px solid ${HAIRLINE};">
      <tr>
        ${td(
          `padding:24px 20px ${module.caption ? '10px' : '24px'} 20px;font-family:${SERIF};font-size:34px;line-height:40px;letter-spacing:0.32em;text-indent:0.32em;color:${INK};text-align:center;`,
          escapeHtml(module.code),
        )}
      </tr>
      ${caption}
    </table>`
}

function renderReceipt(module: Extract<EmailModule, { kind: 'receipt' }>) {
  const head = `
    <tr>
      ${td(
        `padding:0 0 9px 0;border-bottom:1px solid ${HAIRLINE};font-family:${SANS};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${GRAPHITE};`,
        'Item',
      )}
      <td align="right" style="padding:0 0 9px 0;border-bottom:1px solid ${HAIRLINE};font-family:${SANS};font-size:10px;letter-spacing:0.14em;text-transform:uppercase;color:${GRAPHITE};">Amount</td>
    </tr>`

  const items = module.items
    .map((item, index) => {
      const divider =
        index === 0
          ? ''
          : `<tr><td style="padding:0;border-top:1px solid ${ROW_LINE};font-size:0;line-height:0;">&nbsp;</td><td style="padding:0;border-top:1px solid ${ROW_LINE};font-size:0;line-height:0;">&nbsp;</td></tr>`

      const meta = item.meta
        ? `<div style="font-size:12.5px;line-height:18px;color:${GRAPHITE};padding-top:2px;">${escapeHtml(item.meta)}</div>`
        : ''

      return `${divider}
        <tr>
          ${td(
            `padding:15px 12px 15px 0;font-family:${SANS};font-size:14.5px;line-height:21px;color:${INK};`,
            `${escapeHtml(item.name)}${meta}`,
          )}
          <td align="right" valign="top" style="padding:15px 0;font-family:${SANS};font-size:14.5px;line-height:21px;color:${INK};">${escapeHtml(item.amount)}</td>
        </tr>`
    })
    .join('')

  const subtotals = (module.subtotals ?? [])
    .map((row, index, all) => {
      const first = index === 0
      const last = index === all.length - 1
      const cell = `padding:${first ? '14px' : '0'} 12px ${last ? '14px' : '5px'} 0;${first ? `border-top:1px solid ${HAIRLINE};` : ''}font-family:${SANS};font-size:13.5px;line-height:20px;color:${GRAPHITE};`
      const amount = `padding:${first ? '14px' : '0'} 0 ${last ? '14px' : '5px'} 0;${first ? `border-top:1px solid ${HAIRLINE};` : ''}font-family:${SANS};font-size:13.5px;line-height:20px;color:${GRAPHITE};`
      return `<tr>${td(cell, escapeHtml(row.label))}<td align="right" style="${amount}">${escapeHtml(row.value)}</td></tr>`
    })
    .join('')

  const total = `
    <tr>
      ${td(
        `padding:14px 12px 0 0;border-top:2px solid ${INK};font-family:${SANS};font-size:11px;letter-spacing:0.14em;text-transform:uppercase;color:${INK};`,
        escapeHtml(module.total.label),
      )}
      <td align="right" style="padding:14px 0 0 0;border-top:2px solid ${INK};font-family:${SERIF};font-size:22px;line-height:26px;color:${INK};">${escapeHtml(module.total.value)}</td>
    </tr>`

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;border-collapse:collapse;">${head}${items}${subtotals}${total}</table>`
}

function renderFacts(module: Extract<EmailModule, { kind: 'facts' }>) {
  const title = module.title
    ? `<tr><td colspan="2" style="padding:20px 22px 4px 22px;font-family:${SERIF};font-size:19px;line-height:26px;color:${INK};">${escapeHtml(module.title)}</td></tr>`
    : ''

  const rows = module.rows
    .map((row, index, all) => {
      const first = index === 0 && !module.title
      const last = index === all.length - 1
      const top = first ? '20px' : index === 0 ? '10px' : '0'
      const bottom = last ? '20px' : '4px'
      return `<tr>
        ${td(
          `padding:${top} 22px ${bottom} 22px;font-family:${SANS};font-size:13px;line-height:20px;color:${GRAPHITE};`,
          escapeHtml(row.label),
        )}
        <td align="right" style="padding:${top} 22px ${bottom} 22px;font-family:${SANS};font-size:13px;line-height:20px;color:${row.accent ? COPPER : INK};${row.accent ? 'font-weight:600;' : ''}">${escapeHtml(row.value)}</td>
      </tr>`
    })
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:${PAPER};border:1px solid ${HAIRLINE};">${title}${rows}</table>`
}

function renderList(module: Extract<EmailModule, { kind: 'list' }>) {
  const rows = module.items
    .map((item, index) => {
      const divider =
        index === 0
          ? ''
          : `<tr><td style="padding:0;border-top:1px solid ${ROW_LINE};font-size:0;line-height:0;">&nbsp;</td></tr>`
      const meta = item.meta
        ? `<div style="font-size:12.5px;line-height:18px;color:${GRAPHITE};padding-top:2px;">${escapeHtml(item.meta)}</div>`
        : ''
      return `${divider}<tr>${td(
        `padding:14px 22px;font-family:${SANS};font-size:14.5px;line-height:21px;color:${INK};`,
        `${escapeHtml(item.name)}${meta}`,
      )}</tr>`
    })
    .join('')

  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:${PAPER};border:1px solid ${HAIRLINE};">${rows}</table>`
}

function renderQuote(module: Extract<EmailModule, { kind: 'quote' }>) {
  const text = escapeHtml(module.text).replace(/\r?\n/g, '<br />')
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="width:100%;background-color:${PAPER};border-left:2px solid ${COPPER};">
      <tr>
        ${td(`padding:20px 22px;font-family:${SANS};font-size:15px;line-height:25px;color:${BODY_INK};`, text)}
      </tr>
    </table>`
}

function renderModule(module: EmailModule) {
  switch (module.kind) {
    case 'code':
      return renderCode(module)
    case 'receipt':
      return renderReceipt(module)
    case 'facts':
      return renderFacts(module)
    case 'list':
      return renderList(module)
    case 'quote':
      return renderQuote(module)
  }
}

/* ----------------------------------- shell --------------------------------- */

function renderCta(cta: EmailCta) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0">
      <tr>
        <td style="background-color:${INK};">
          <a href="${escapeHtml(cta.href)}" style="display:inline-block;padding:14px 30px;font-family:${SANS};font-size:13px;letter-spacing:0.1em;text-transform:uppercase;color:${WHITE};text-decoration:none;">${escapeHtml(cta.label)}</a>
        </td>
      </tr>
    </table>`
}

function footerLink(label: string, path: string) {
  return `<a href="${getPublicAppUrlForPath(path)}" style="color:${INK};text-decoration:underline;text-underline-offset:2px;">${label}</a>`
}

export function renderEmail(options: EmailOptions): string {
  const {
    preheader,
    eyebrow,
    heading,
    body,
    module,
    cta,
    note,
    signoff = '— The Kalakraft team',
    footerReason,
  } = options

  const paragraphs = body
    .map(
      (text, index) =>
        `<tr>${td(
          `padding:${index === 0 ? '0' : '14px'} 40px 0 40px;font-family:${SANS};font-size:15px;line-height:25px;color:${BODY_INK};`,
          escapeHtml(text),
        )}</tr>`,
    )
    .join('')

  const moduleRow = module
    ? `<tr>${td('padding:26px 40px 0 40px;', renderModule(module))}</tr>`
    : ''

  const ctaRow = cta ? `<tr>${td('padding:30px 40px 0 40px;', renderCta(cta))}</tr>` : ''

  const noteRow = note
    ? `<tr>${td(
        `padding:24px 40px 0 40px;font-family:${SANS};font-size:14px;line-height:23px;color:${GRAPHITE};`,
        escapeHtml(note),
      )}</tr>`
    : ''

  const signoffRow = signoff
    ? `<tr>${td(
        `padding:26px 40px 34px 40px;font-family:${SANS};font-size:15px;line-height:25px;color:${BODY_INK};`,
        escapeHtml(signoff),
      )}</tr>`
    : `<tr>${td('padding:0 40px 34px 40px;font-size:0;line-height:0;', '&nbsp;')}</tr>`

  const links = [
    footerLink('Contact', '/contact'),
    footerLink('Privacy', '/privacy'),
    footerLink('About us', '/about'),
  ].join('&nbsp;&nbsp;·&nbsp;&nbsp;')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light dark" />
<meta name="supported-color-schemes" content="light dark" />
<title>${escapeHtml(heading)}</title>
<style>
  @media only screen and (max-width:620px) {
    .kk-shell { width:100% !important; }
    .kk-pad { padding-left:24px !important; padding-right:24px !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;mso-hide:all;">${escapeHtml(preheader)}</div>
<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color:${PAPER};margin:0;padding:0;">
  <tr>
    <td align="center" style="padding:0;">
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="600" class="kk-shell" style="width:600px;max-width:600px;background-color:${WHITE};">

        <tr>
          <td class="kk-pad" style="padding:32px 40px 22px 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0">
              <tr>
                <td width="36" style="width:36px;height:36px;background-color:${INK};text-align:center;vertical-align:middle;font-family:${SERIF};font-size:21px;line-height:36px;color:${WHITE};">k</td>
                <td style="padding-left:12px;font-family:${SERIF};font-size:21px;line-height:36px;color:${INK};letter-spacing:0.01em;">kalakraft</td>
              </tr>
            </table>
          </td>
        </tr>
        <tr>
          <td class="kk-pad" style="padding:0 40px;">
            <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%">
              <tr>
                <td width="44" style="width:44px;height:2px;background-color:${COPPER};font-size:0;line-height:2px;">&nbsp;</td>
                <td style="height:2px;background-color:${HAIRLINE};font-size:0;line-height:2px;">&nbsp;</td>
              </tr>
            </table>
          </td>
        </tr>

        <tr>
          <td class="kk-pad" style="padding:34px 40px 12px 40px;font-family:${SANS};font-size:11px;line-height:16px;letter-spacing:0.16em;text-transform:uppercase;color:${GRAPHITE};">${escapeHtml(eyebrow)}</td>
        </tr>
        <tr>
          <td class="kk-pad" style="padding:0 40px 16px 40px;font-family:${SERIF};font-size:27px;line-height:34px;color:${INK};">${escapeHtml(heading)}</td>
        </tr>
        ${paragraphs}
        ${moduleRow}
        ${ctaRow}
        ${noteRow}
        ${signoffRow}

        <tr>
          <td class="kk-pad" style="padding:0 40px;">
            <div style="height:1px;background-color:${HAIRLINE};font-size:0;line-height:1px;">&nbsp;</div>
          </td>
        </tr>
        <tr>
          <td class="kk-pad" style="padding:22px 40px 34px 40px;font-family:${SANS};font-size:12px;line-height:20px;color:${GRAPHITE};">
            ${links}
            <br /><br />
            <span style="color:${MUTED};">${escapeHtml(footerReason)}</span>
          </td>
        </tr>

      </table>
    </td>
  </tr>
</table>
</body>
</html>`
}

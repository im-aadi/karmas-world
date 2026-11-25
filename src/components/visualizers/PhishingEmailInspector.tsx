import { useState } from 'react'
import {
  Mail,
  ShieldAlert,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  Search,
  ExternalLink,
} from 'lucide-react'

export interface PhishingScenario {
  id: string
  title: string
  threatCategory: string
  difficulty: 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'
  fromHeader: string
  returnPath: string
  subject: string
  date: string
  spfStatus: 'PASS' | 'SOFTFAIL' | 'FAIL'
  dkimStatus: 'PASS' | 'FAIL'
  dmarcStatus: 'PASS' | 'REJECT' | 'QUARANTINE' | 'NONE'
  originatingIp: string
  bodyHtml: string
  fakeLinkText: string
  actualTargetUrl: string
  hasAttachment: boolean
  attachmentName?: string
  attachmentType?: string
  indicators: string[]
  explanation: string
}

const PHISHING_SCENARIOS: PhishingScenario[] = [
  {
    id: 'scenario-m365',
    title: 'Microsoft 365 Urgent Password Expiration Notice',
    threatCategory: 'Credential Harvester (Typosquatting)',
    difficulty: 'BEGINNER',
    fromHeader: 'Microsoft Security Team <security-alert@office365-support-portal.net>',
    returnPath: 'bounce-service@mailgun-relay-bulk.ru',
    subject: 'CRITICAL: Your Microsoft 365 Password Expires in 2 Hours',
    date: 'Today, 08:42 AM',
    spfStatus: 'FAIL',
    dkimStatus: 'FAIL',
    dmarcStatus: 'REJECT',
    originatingIp: '185.220.101.5 (Known Bulletproof Hosting)',
    bodyHtml: `Dear Valued Colleague,<br/><br/>
Your corporate organization password will expire today at 11:00 AM. Failure to authenticate your credentials will result in immediate termination of Outlook, OneDrive, and SharePoint mailbox privileges.<br/><br/>
Please retain your current password immediately by verifying below:`,
    fakeLinkText: 'https://login.microsoftonline.com/common/oauth2/v2.0/authorize',
    actualTargetUrl: 'http://microsofft-auth-verify.xyz/login.php?user=target@karmas.world',
    hasAttachment: false,
    indicators: [
      'Sender domain "office365-support-portal.net" is an unregistered lookalike, not official microsoft.com.',
      'Return-Path points to an unrelated Russian relay server.',
      'SPF and DKIM authentication both failed.',
      'Artificially imposed urgency ("expires in 2 hours") to cause cognitive panic.',
      'Hyperlink text displays authentic Microsoft URL, but actual destination is typosquatted phishing domain.',
    ],
    explanation: 'A classic credential harvesting campaign utilizing artificial urgency and display text manipulation. Always hover over hyperlinks and check DMARC authentication alignments.',
  },
  {
    id: 'scenario-bec',
    title: 'Executive Wire Transfer Request (CEO Fraud / BEC)',
    threatCategory: 'Business Email Compromise (Social Engineering)',
    difficulty: 'INTERMEDIATE',
    fromHeader: 'Aditya Kashyap <aditya@karmas-world-advisory.com>',
    returnPath: 'aditya-kashyap-ceo@protonmail.com',
    subject: 'Urgent: Confidential Acquisition Wire Payment Required Today',
    date: 'Yesterday, 04:15 PM',
    spfStatus: 'SOFTFAIL',
    dkimStatus: 'FAIL',
    dmarcStatus: 'NONE',
    originatingIp: '103.208.220.44',
    bodyHtml: `Hi Finance Team,<br/><br/>
I am currently in closed-door discussions regarding a confidential strategic asset acquisition. Because of strict NDAs, do not call my office line or discuss this with anyone in the department.<br/><br/>
Please initiate an expedited international wire transfer of <strong>$48,500 USD</strong> to our escrow agent account. Details attached.<br/><br/>
Thanks,<br/>Aditya Kashyap<br/>CEO, Karma's World`,
    fakeLinkText: 'View Escrow Account Routing Information',
    actualTargetUrl: 'https://attacker-c2.top/escrow-invoice.pdf',
    hasAttachment: true,
    attachmentName: 'Confidential_Acquisition_Wire_Instructions.pdf.exe',
    attachmentType: 'Executable disguised as PDF (Double Extension)',
    indicators: [
      'Lookalike domain "karmas-world-advisory.com" instead of legitimate "karmas.world".',
      'Return-Path routes to a free anonymous webmail provider.',
      'High-pressure secrecy command ("Do not call or discuss with anyone") designed to bypass dual-authorization controls.',
      'Urgent financial wire transaction requested outside standard ERP procurement channels.',
      'Attachment uses double extension (.pdf.exe) concealing an executable binary.',
    ],
    explanation: 'Business Email Compromise (BEC) targets accounting personnel by impersonating high-ranking executives. Defense requires out-of-band phone verification and strict double-signature financial controls.',
  },
  {
    id: 'scenario-dhl',
    title: 'DHL Express Package Delivery Exception & Invoice',
    threatCategory: 'Malware Dropper (Macro-Enabled Document)',
    difficulty: 'ADVANCED',
    fromHeader: 'DHL Global Tracking <tracking-update@dhl-express-tracking.com>',
    returnPath: 'postmaster@compromised-smb-domain.co.uk',
    subject: 'Delivery Exception Notice: Tracking #DHL-984210-IN (Customs Duty Due)',
    date: '2 Days Ago',
    spfStatus: 'PASS',
    dkimStatus: 'PASS',
    dmarcStatus: 'NONE',
    originatingIp: '194.67.210.82',
    bodyHtml: `Dear Customer,<br/><br/>
Your inbound express consignment (#DHL-984210-IN) could not be delivered due to outstanding customs tariff clearance fee ($4.20).<br/><br/>
Please download and review the official customs clearance slip to authorize redelivery.`,
    fakeLinkText: 'Download Clearance Receipt & Reschedule',
    actualTargetUrl: 'http://cdn-dhl-dispatch.info/invoices/DHL_Clearance_Notice.docm',
    hasAttachment: true,
    attachmentName: 'DHL_Clearance_Notice.docm',
    attachmentType: 'Word Macro-Enabled Document (VBA Loader)',
    indicators: [
      'Spoofed logistics domain mimicking official DHL courier services.',
      'Compromised third-party server passed SPF/DKIM (account takeover of innocent domain).',
      'Attachment is a .docm file containing weaponized VBA macros.',
      'Small dollar fee ($4.20) designed to lower victim hesitation.',
    ],
    explanation: 'Advanced phishing campaigns frequently hijack legitimate compromised email accounts to pass SPF/DKIM checks. Never enable macros on unsolicited documents.',
  },
]

export function PhishingEmailInspector() {
  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('scenario-m365')
  const [showHeaders, setShowHeaders] = useState(false)
  const [revealedLink, setRevealedLink] = useState(false)
  const [userRating, setUserRating] = useState<'SAFE' | 'SUSPICIOUS' | 'MALICIOUS' | null>(null)
  const [hasSubmittedTriage, setHasSubmittedTriage] = useState(false)

  const scenario = PHISHING_SCENARIOS.find((s) => s.id === selectedScenarioId) ?? PHISHING_SCENARIOS[0]!

  function handleSelectScenario(id: string) {
    setSelectedScenarioId(id)
    setShowHeaders(false)
    setRevealedLink(false)
    setUserRating(null)
    setHasSubmittedTriage(false)
  }

  function handleTriageSubmit(rating: 'SAFE' | 'SUSPICIOUS' | 'MALICIOUS') {
    setUserRating(rating)
    setHasSubmittedTriage(true)
  }

  return (
    <div className="phishing-inspector-container" id="phishing-inspector">
      <div className="phishing-header">
        <div className="phishing-title-wrap">
          <span className="section-cyber-tag">
            <Mail size={13} /> SECURITY OPERATIONS EMAIL TRIAGE SANDBOX
          </span>
          <h3>Interactive Phishing & Email Header Inspector</h3>
          <p>
            Triage real-world suspicious emails as a SOC security analyst. Examine SPF, DKIM, and DMARC alignments, inspect spoofed return-paths, and analyze weaponized links.
          </p>
        </div>
      </div>

      <div className="phishing-scenario-selector">
        {PHISHING_SCENARIOS.map((sc) => (
          <button
            key={sc.id}
            className={`scenario-btn ${selectedScenarioId === sc.id ? 'active' : ''}`}
            onClick={() => handleSelectScenario(sc.id)}
          >
            <span className="sc-difficulty">{sc.difficulty}</span>
            <span className="sc-title">{sc.title}</span>
          </button>
        ))}
      </div>

      <div className="phishing-workbench-grid">
        {/* Email Client Preview Pane */}
        <div className="email-client-card">
          <div className="email-client-header">
            <div className="email-window-controls">
              <span className="ctrl red" />
              <span className="ctrl yellow" />
              <span className="ctrl green" />
            </div>
            <span className="client-title">Mail Client — Inbox Triage</span>
            <button
              className="toggle-headers-btn"
              onClick={() => setShowHeaders(!showHeaders)}
            >
              <Search size={13} /> {showHeaders ? 'Hide Full Headers' : 'Inspect Raw Headers (RFC 822)'}
            </button>
          </div>

          {/* Raw Headers Drawer */}
          {showHeaders && (
            <div className="raw-headers-drawer">
              <div className="header-field">
                <span className="h-key">From:</span>
                <span className="h-val">{scenario.fromHeader}</span>
              </div>
              <div className="header-field highlight-alert">
                <span className="h-key">Return-Path:</span>
                <span className="h-val">{scenario.returnPath}</span>
              </div>
              <div className="header-field">
                <span className="h-key">Originating-IP:</span>
                <span className="h-val">{scenario.originatingIp}</span>
              </div>
              <div className="auth-results-box">
                <div className="auth-tag">
                  SPF: <strong className={scenario.spfStatus.toLowerCase()}>{scenario.spfStatus}</strong>
                </div>
                <div className="auth-tag">
                  DKIM: <strong className={scenario.dkimStatus.toLowerCase()}>{scenario.dkimStatus}</strong>
                </div>
                <div className="auth-tag">
                  DMARC: <strong className={scenario.dmarcStatus.toLowerCase()}>{scenario.dmarcStatus}</strong>
                </div>
              </div>
            </div>
          )}

          {/* Email Body & Envelope */}
          <div className="email-envelope-info">
            <div className="envelope-row">
              <span className="env-label">From:</span>
              <strong className="env-val">{scenario.fromHeader}</strong>
            </div>
            <div className="envelope-row">
              <span className="env-label">Subject:</span>
              <span className="env-val subject">{scenario.subject}</span>
            </div>
            <div className="envelope-row">
              <span className="env-label">Date:</span>
              <span className="env-val date">{scenario.date}</span>
            </div>
          </div>

          <div
            className="email-body-content"
            dangerouslySetInnerHTML={{ __html: scenario.bodyHtml }}
          />

          {/* Action Link with Destination Reveal */}
          <div className="email-action-link-box">
            <span className="link-inspect-prompt">Inspect Hyperlink Destination (Hover or Click to inspect):</span>
            <div
              className={`inspectable-link ${revealedLink ? 'revealed' : ''}`}
              onClick={() => setRevealedLink(!revealedLink)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') setRevealedLink(!revealedLink)
              }}
            >
              <ExternalLink size={14} />
              <span className="displayed-text">{scenario.fakeLinkText}</span>
            </div>

            {revealedLink && (
              <div className="revealed-target-banner">
                <AlertTriangle size={15} />
                <span>
                  ACTUAL DESTINATION: <code>{scenario.actualTargetUrl}</code>
                </span>
              </div>
            )}
          </div>

          {/* Attachment Box if Present */}
          {scenario.hasAttachment && (
            <div className="email-attachment-box">
              <FileText size={18} className="attachment-icon" />
              <div className="attachment-info">
                <span className="attachment-name">{scenario.attachmentName}</span>
                <span className="attachment-desc">{scenario.attachmentType}</span>
              </div>
              <span className="attachment-flag-alert">High Threat Risk</span>
            </div>
          )}
        </div>

        {/* Security Analyst Triage & Remediation Box */}
        <div className="analyst-triage-panel">
          <div className="triage-header">
            <h4>SOC Analyst Decision & Remediation</h4>
            <p>Assess threat signals and declare incident classification.</p>
          </div>

          <div className="triage-action-buttons">
            <button
              className={`triage-btn safe ${userRating === 'SAFE' ? 'selected' : ''}`}
              onClick={() => handleTriageSubmit('SAFE')}
            >
              <CheckCircle2 size={16} /> Benign (Deliver)
            </button>
            <button
              className={`triage-btn suspicious ${userRating === 'SUSPICIOUS' ? 'selected' : ''}`}
              onClick={() => handleTriageSubmit('SUSPICIOUS')}
            >
              <AlertTriangle size={16} /> Suspicious (Junk / Warn)
            </button>
            <button
              className={`triage-btn malicious ${userRating === 'MALICIOUS' ? 'selected' : ''}`}
              onClick={() => handleTriageSubmit('MALICIOUS')}
            >
              <ShieldAlert size={16} /> Malicious (Quarantine & Block)
            </button>
          </div>

          {hasSubmittedTriage && (
            <div className={`triage-verdict-box ${userRating === 'MALICIOUS' ? 'correct' : 'incorrect'}`}>
              <div className="verdict-banner">
                {userRating === 'MALICIOUS' ? (
                  <>
                    <CheckCircle2 size={18} className="icon-pass" />
                    <strong>Correct Classification: Verified Malicious Phishing</strong>
                  </>
                ) : (
                  <>
                    <XCircle size={18} className="icon-fail" />
                    <strong>Incorrect Assessment: This is a Dangerous Phishing Attack</strong>
                  </>
                )}
              </div>

              <div className="indicators-checklist">
                <span className="indicators-title">Key Threat Indicators (IoCs):</span>
                <ul>
                  {scenario.indicators.map((ind, i) => (
                    <li key={i}>{ind}</li>
                  ))}
                </ul>
              </div>

              <div className="remediation-steps">
                <span className="indicators-title">Standard Incident Playbook:</span>
                <p>1. Quarantine email from all recipient mailboxes immediately.</p>
                <p>2. Block sender domain and originating IP at Perimeter Mail Gateway.</p>
                <p>3. Reset credentials if any user submitted input.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

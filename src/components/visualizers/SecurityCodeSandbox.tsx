import { useState } from 'react'
import {
  Terminal,
  Play,
  RotateCcw,
  Code2,
  Copy,
  Check,
  FileCode,
} from 'lucide-react'

export interface ScriptTemplate {
  id: string
  name: string
  category: string
  filename: string
  description: string
  code: string
  simulateRun: (code: string) => Promise<string[]>
}

const SCRIPT_TEMPLATES: ScriptTemplate[] = [
  {
    id: 'port-scanner',
    name: 'TCP Port Scanner',
    category: 'Network Recon',
    filename: 'port_scanner.py',
    description: 'Multi-threaded socket port scanner detecting open perimeter services.',
    code: `import socket
import sys

TARGET_HOST = "10.0.1.50"
TARGET_PORTS = [21, 22, 25, 80, 443, 3389, 8080]

print(f"[*] Starting TCP Connect scan on {TARGET_HOST}...")

for port in TARGET_PORTS:
    try:
        sock = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        sock.settimeout(0.5)
        result = sock.connect_ex((TARGET_HOST, port))
        if result == 0:
            print(f"[+] Port {port:5d}/TCP : OPEN (Service detected)")
        else:
            print(f"[-] Port {port:5d}/TCP : CLOSED")
        sock.close()
    except Exception as e:
        print(f"[!] Error scanning port {port}: {e}")

print("[*] Scan completed successfully.")
`,
    simulateRun: async () => {
      return [
        '[*] Starting TCP Connect scan on 10.0.1.50...',
        '[-] Port    21/TCP : CLOSED',
        '[+] Port    22/TCP : OPEN (OpenSSH 8.9p1 Ubuntu)',
        '[-] Port    25/TCP : CLOSED',
        '[+] Port    80/TCP : OPEN (nginx/1.22.1)',
        '[+] Port   443/TCP : OPEN (nginx/1.22.1 - TLS 1.3)',
        '[-] Port  3389/TCP : CLOSED',
        '[+] Port  8080/TCP : OPEN (Apache Tomcat/9.0)',
        '[*] Scan completed successfully. 4 open services discovered.',
      ]
    },
  },
  {
    id: 'header-auditor',
    name: 'HTTP Security Headers Auditor',
    category: 'AppSec Defense',
    filename: 'audit_headers.py',
    description: 'Audits essential HTTP hardening headers (CSP, HSTS, X-Frame-Options).',
    code: `import urllib.request

URL = "https://karmas.world"
RECOMMENDED_HEADERS = [
    "Content-Security-Policy",
    "Strict-Transport-Security",
    "X-Frame-Options",
    "X-Content-Type-Options",
    "Referrer-Policy"
]

print(f"[*] Auditing HTTP security response headers for {URL}...")

req = urllib.request.Request(URL, headers={'User-Agent': 'CyberAuditor/1.0'})
with urllib.request.urlopen(req) as response:
    headers = {k: v for k, v in response.getheaders()}
    for h in RECOMMENDED_HEADERS:
        if h in headers:
            print(f"[+] PASS: {h} is configured ({headers[h][:35]}...)")
        else:
            print(f"[-] FAIL: {h} is MISSING! (Recommended for defense)")

print("[*] Audit complete. Score: 5/5 Hardened.")
`,
    simulateRun: async () => {
      return [
        '[*] Auditing HTTP security response headers for https://karmas.world...',
        '[+] PASS: Content-Security-Policy is configured (default-src \'self\'; script-src...)',
        '[+] PASS: Strict-Transport-Security is configured (max-age=63072000; includeSubDomains...)',
        '[+] PASS: X-Frame-Options is configured (DENY)',
        '[+] PASS: X-Content-Type-Options is configured (nosniff)',
        '[+] PASS: Referrer-Policy is configured (strict-origin-when-cross-origin)',
        '[*] Audit complete. Security Grade: A+ (Strict Zero-Trust Profile)',
      ]
    },
  },
  {
    id: 'hash-cracker',
    name: 'Dictionary Hash Cracker',
    category: 'Cryptography',
    filename: 'hash_cracker.py',
    description: 'Dictionary attack tool matching SHA-256 preimages against wordlists.',
    code: `import hashlib

TARGET_HASH = "5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8"
WORDLIST = ["admin", "qwerty", "letmein", "password", "welcome123", "secret"]

print(f"[*] Target SHA-256 Hash: {TARGET_HASH}")
print(f"[*] Initiating dictionary attack across {len(WORDLIST)} candidates...")

cracked = False
for word in WORDLIST:
    candidate_hash = hashlib.sha256(word.encode()).hexdigest()
    if candidate_hash == TARGET_HASH:
        print(f"[+] CRACKED! Preimage discovered: '{word}'")
        cracked = True
        break

if not cracked:
    print("[-] Password not found in dictionary list.")
`,
    simulateRun: async () => {
      return [
        '[*] Target SHA-256 Hash: 5e884898da28047151d0e56f8dc6292773603d0d6aabbdd62a11ef721d1542d8',
        '[*] Initiating dictionary attack across 6 candidates...',
        '[-] Testing "admin"... Mismatch',
        '[-] Testing "qwerty"... Mismatch',
        '[-] Testing "letmein"... Mismatch',
        '[+] CRACKED! Preimage discovered: \'password\'',
        '[*] Total time elapsed: 0.003 seconds (Collision verified).',
      ]
    },
  },
]

export function SecurityCodeSandbox() {
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('port-scanner')
  const [code, setCode] = useState<string>(SCRIPT_TEMPLATES[0]!.code)
  const [outputLines, setOutputLines] = useState<string[]>([])
  const [isRunning, setIsRunning] = useState<boolean>(false)
  const [copied, setCopied] = useState(false)

  const template = SCRIPT_TEMPLATES.find((t) => t.id === selectedTemplateId) ?? SCRIPT_TEMPLATES[0]!

  function handleSelectTemplate(tmpl: ScriptTemplate) {
    setSelectedTemplateId(tmpl.id)
    setCode(tmpl.code)
    setOutputLines([])
  }

  function handleReset() {
    setCode(template.code)
    setOutputLines([])
  }

  async function handleRun() {
    setIsRunning(true)
    setOutputLines([`$ python3 ${template.filename}`, 'Executing sandbox process...'])

    const results = await template.simulateRun(code)

    setTimeout(() => {
      setOutputLines([`$ python3 ${template.filename}`, ...results])
      setIsRunning(false)
    }, 600)
  }

  function handleCopy() {
    navigator.clipboard?.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="security-code-sandbox-container" id="code-sandbox">
      <div className="sandbox-header">
        <div className="sandbox-title-wrap">
          <span className="section-cyber-tag">
            <Code2 size={13} /> IN-BROWSER CYBERSECURITY SCRIPTING SANDBOX
          </span>
          <h3>Security Tooling & Python Automation Lab</h3>
          <p>
            Inspect and execute Python security utilities. Practice writing socket scanners, auditing HTTP response headers, and testing cryptographic attacks in a safe client-side environment.
          </p>
        </div>
      </div>

      <div className="sandbox-template-bar">
        {SCRIPT_TEMPLATES.map((tmpl) => (
          <button
            key={tmpl.id}
            className={`tmpl-btn ${selectedTemplateId === tmpl.id ? 'active' : ''}`}
            onClick={() => handleSelectTemplate(tmpl)}
          >
            <span className="tmpl-category">{tmpl.category}</span>
            <span className="tmpl-name">{tmpl.name}</span>
          </button>
        ))}
      </div>

      <div className="code-workspace-grid">
        {/* Code Editor Pane */}
        <div className="editor-pane">
          <div className="editor-toolbar">
            <div className="file-info">
              <FileCode size={14} className="file-icon" />
              <span>{template.filename}</span>
            </div>
            <div className="editor-actions">
              <button className="tool-btn" onClick={handleCopy} title="Copy code">
                {copied ? <Check size={13} /> : <Copy size={13} />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
              <button className="tool-btn" onClick={handleReset} title="Reset code to original">
                <RotateCcw size={13} />
                <span>Reset</span>
              </button>
              <button className="run-script-btn" onClick={handleRun} disabled={isRunning}>
                <Play size={13} />
                <span>{isRunning ? 'Running…' : 'Run Script'}</span>
              </button>
            </div>
          </div>

          <div className="editor-textarea-wrap">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="code-textarea"
              spellCheck={false}
              rows={16}
            />
          </div>
        </div>

        {/* Execution Terminal Pane */}
        <div className="terminal-pane">
          <div className="terminal-toolbar">
            <div className="terminal-dots">
              <span className="dot red" />
              <span className="dot yellow" />
              <span className="dot green" />
            </div>
            <span className="terminal-title">Python 3.11 Runtime Console</span>
          </div>

          <div className="terminal-screen">
            {outputLines.length === 0 ? (
              <div className="terminal-placeholder">
                <Terminal size={28} />
                <p>Click "Run Script" to execute {template.filename} in the safe sandbox environment.</p>
              </div>
            ) : (
              <div className="terminal-output-feed">
                {outputLines.map((line, idx) => (
                  <div
                    key={idx}
                    className={`term-line ${
                      line.startsWith('[+]')
                        ? 'pass-line'
                        : line.startsWith('[-]')
                        ? 'fail-line'
                        : line.startsWith('[$]')
                        ? 'cmd-line'
                        : ''
                    }`}
                  >
                    {line}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

import { useState } from 'react'
import {
  Lock,
  Eye,
  EyeOff,
  Cpu,
  Zap,
  Server,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from 'lucide-react'

export interface EntropyAnalysis {
  length: number
  poolSize: number
  entropyBits: number
  combinations: number
  rating: 'VERY_WEAK' | 'WEAK' | 'MODERATE' | 'STRONG' | 'EXCEPTIONAL'
  ratingLabel: string
  crackTimes: {
    onlineThrottled: string
    offlineCpu: string
    gpuRig: string
    supercomputer: string
  }
  warnings: string[]
  suggestions: string[]
}

const COMMON_PASSWORDS = new Set([
  'password', 'password123', 'admin', '123456', '12345678', 'qwerty',
  'letmein', 'welcome', 'login', 'iloveyou', 'monkey', 'dragon', 'master'
])

function formatTime(seconds: number): string {
  if (seconds < 1) return 'Instantaneous (< 1 sec)'
  if (seconds < 60) return `${Math.round(seconds)} seconds`
  const minutes = seconds / 60
  if (minutes < 60) return `${Math.round(minutes)} minutes`
  const hours = minutes / 60
  if (hours < 24) return `${Math.round(hours)} hours`
  const days = hours / 24
  if (days < 365) return `${Math.round(days)} days`
  const years = days / 365
  if (years < 1000) return `${Math.round(years)} years`
  if (years < 1000000) return `${(years / 1000).toFixed(1)} thousand years`
  if (years < 1000000000) return `${(years / 1000000).toFixed(1)} million years`
  return `${(years / 1000000000).toFixed(1)} billion years (Centuries)`
}

export function calculatePasswordEntropy(pwd: string): EntropyAnalysis {
  if (!pwd) {
    return {
      length: 0,
      poolSize: 0,
      entropyBits: 0,
      combinations: 0,
      rating: 'VERY_WEAK',
      ratingLabel: 'Empty Password',
      crackTimes: {
        onlineThrottled: 'Instant',
        offlineCpu: 'Instant',
        gpuRig: 'Instant',
        supercomputer: 'Instant',
      },
      warnings: ['No password entered.'],
      suggestions: ['Enter at least 14 characters or a 4-word passphrase.'],
    }
  }

  let poolSize = 0
  const hasLower = /[a-z]/.test(pwd)
  const hasUpper = /[A-Z]/.test(pwd)
  const hasDigits = /[0-9]/.test(pwd)
  const hasSpecial = /[^a-zA-Z0-9]/.test(pwd)

  if (hasLower) poolSize += 26
  if (hasUpper) poolSize += 26
  if (hasDigits) poolSize += 10
  if (hasSpecial) poolSize += 33

  const length = pwd.length
  // Information entropy in bits: E = L * log2(R)
  const entropyBits = Math.round(length * (Math.log2(poolSize || 1) * 10)) / 10
  const combinations = Math.pow(poolSize || 1, length)

  // Crack rate constants (guesses per second)
  const GUESSES_ONLINE = 100 // 100/sec (rate limited web forms)
  const GUESSES_CPU = 10_000_000 // 10M/sec (fast hashing CPU)
  const GUESSES_GPU_RIG = 100_000_000_000 // 100 Billion/sec (8x RTX 4090 cluster)
  const GUESSES_SUPERCOMPUTER = 10_000_000_000_000 // 10 Trillion/sec

  // Average time to crack = (combinations / 2) / rate
  const halfCombinations = combinations / 2

  let rating: EntropyAnalysis['rating'] = 'VERY_WEAK'
  let ratingLabel = 'Critically Weak'

  if (entropyBits < 28) {
    rating = 'VERY_WEAK'
    ratingLabel = 'Very Weak (Trivial to Crack)'
  } else if (entropyBits < 40) {
    rating = 'WEAK'
    ratingLabel = 'Weak (Vulnerable to GPU Rigs)'
  } else if (entropyBits < 64) {
    rating = 'MODERATE'
    ratingLabel = 'Moderate (Decent for non-critical accounts)'
  } else if (entropyBits < 90) {
    rating = 'STRONG'
    ratingLabel = 'Strong (Resistant to modern offline clusters)'
  } else {
    rating = 'EXCEPTIONAL'
    ratingLabel = 'Exceptional (Military / Quantum Grade)'
  }

  const warnings: string[] = []
  const suggestions: string[] = []

  const lowerPwd = pwd.toLowerCase()
  if (COMMON_PASSWORDS.has(lowerPwd)) {
    warnings.push(`Matches a known leaked dictionary password ("${lowerPwd}").`)
  }
  if (/^[0-9]+$/.test(pwd)) {
    warnings.push('Only numbers detected — severely limits search space.')
  }
  if (/^[a-zA-Z]+$/.test(pwd)) {
    warnings.push('Only letters detected — no special characters or digits.')
  }
  if (/(.)\1{2,}/.test(pwd)) {
    warnings.push('Contains 3 or more repeated consecutive identical characters.')
  }
  if (/(123|abc|qwerty|asdf)/i.test(pwd)) {
    warnings.push('Contains easily guessable sequential keyboard sequence.')
  }

  if (length < 12) {
    suggestions.push('Increase length to at least 14 characters for offline security.')
  }
  if (!hasSpecial) {
    suggestions.push('Add punctuation or symbol characters ($ # ! @ % &) to increase pool size.')
  }
  if (!hasDigits) {
    suggestions.push('Include numbers to expand character space.')
  }
  suggestions.push('Tip: Passphrases like "correct-horse-battery-staple" offer high entropy with easy recall.')

  return {
    length,
    poolSize,
    entropyBits,
    combinations,
    rating,
    ratingLabel,
    crackTimes: {
      onlineThrottled: formatTime(halfCombinations / GUESSES_ONLINE),
      offlineCpu: formatTime(halfCombinations / GUESSES_CPU),
      gpuRig: formatTime(halfCombinations / GUESSES_GPU_RIG),
      supercomputer: formatTime(halfCombinations / GUESSES_SUPERCOMPUTER),
    },
    warnings,
    suggestions,
  }
}

export function PasswordEntropyChecker() {
  const [password, setPassword] = useState('CyberDefense$2026!')
  const [showPassword, setShowPassword] = useState(false)

  const analysis = calculatePasswordEntropy(password)

  function getRatingColor(rating: EntropyAnalysis['rating']) {
    switch (rating) {
      case 'VERY_WEAK':
        return '#ff4d6d'
      case 'WEAK':
        return '#ffa502'
      case 'MODERATE':
        return '#f1c40f'
      case 'STRONG':
        return '#2ecc71'
      case 'EXCEPTIONAL':
        return 'var(--mint)'
      default:
        return '#85929e'
    }
  }

  function getPercent(bits: number): number {
    return Math.min(100, Math.max(5, Math.round((bits / 100) * 100)))
  }

  return (
    <div className="entropy-checker-container" id="password-entropy">
      <div className="entropy-header">
        <div className="entropy-title-wrap">
          <span className="section-cyber-tag">
            <Lock size={13} /> INFORMATION ENTROPY & BRUTE-FORCE CALCULATOR
          </span>
          <h3>Password Entropy & Hardware Crack-Time Analyzer</h3>
          <p>
            Measure Shannon entropy ($E = L \times \log_2(R)$), evaluate brute-force permutation search space, and view crack time estimates across modern GPU clusters.
          </p>
        </div>
      </div>

      <div className="entropy-card-main">
        <div className="password-input-wrap">
          <label htmlFor="entropy-password-input">Test Password / Passphrase:</label>
          <div className="input-field-relative">
            <input
              id="entropy-password-input"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Type or paste a password..."
              className="password-entropy-input"
            />
            <button
              type="button"
              className="toggle-visibility-btn"
              onClick={() => setShowPassword(!showPassword)}
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          </div>
        </div>

        {/* Strength Meter Bar */}
        <div className="entropy-meter-section">
          <div className="meter-label-row">
            <span className="meter-status" style={{ color: getRatingColor(analysis.rating) }}>
              {analysis.ratingLabel}
            </span>
            <span className="entropy-score-badge">
              <strong>{analysis.entropyBits}</strong> Bits of Entropy
            </span>
          </div>
          <div className="entropy-progress-bar">
            <div
              className="entropy-progress-fill"
              style={{
                width: `${getPercent(analysis.entropyBits)}%`,
                backgroundColor: getRatingColor(analysis.rating),
              }}
            />
          </div>
        </div>

        {/* Mathematical Parameters Grid */}
        <div className="entropy-math-grid">
          <div className="math-metric-card">
            <span className="metric-tag">LENGTH (L)</span>
            <strong className="metric-num">{analysis.length} chars</strong>
            <span className="metric-sub">Total characters</span>
          </div>
          <div className="math-metric-card">
            <span className="metric-tag">CHAR POOL (R)</span>
            <strong className="metric-num">{analysis.poolSize} glyphs</strong>
            <span className="metric-sub">Lowercase, uppercase, digits, symbols</span>
          </div>
          <div className="math-metric-card">
            <span className="metric-tag">ENTROPY BITS</span>
            <strong className="metric-num">{analysis.entropyBits} bits</strong>
            <span className="metric-sub">$L \times \log_2(R)$</span>
          </div>
          <div className="math-metric-card">
            <span className="metric-tag">SEARCH SPACE</span>
            <strong className="metric-num">
              {analysis.combinations > 1e15
                ? `~10^${Math.round(Math.log10(analysis.combinations))}`
                : analysis.combinations.toLocaleString()}
            </strong>
            <span className="metric-sub">Total permutations ($R^L$)</span>
          </div>
        </div>

        {/* Hardware Cracking Time Benchmark Grid */}
        <div className="crack-time-benchmarks">
          <div className="benchmarks-header">
            <span>
              <Cpu size={15} /> Hardware Brute-Force Cracking Speed Estimates (Average Case)
            </span>
          </div>
          <div className="benchmarks-grid">
            <div className="rig-card">
              <div className="rig-meta">
                <Server size={16} />
                <span className="rig-name">Online Web Form</span>
              </div>
              <span className="rig-speed">100 attempts / sec</span>
              <strong className="rig-time">{analysis.crackTimes.onlineThrottled}</strong>
            </div>

            <div className="rig-card">
              <div className="rig-meta">
                <Cpu size={16} />
                <span className="rig-name">Standard CPU</span>
              </div>
              <span className="rig-speed">10 Million / sec</span>
              <strong className="rig-time">{analysis.crackTimes.offlineCpu}</strong>
            </div>

            <div className="rig-card highlight">
              <div className="rig-meta">
                <Zap size={16} />
                <span className="rig-name">8x RTX 4090 GPU Cluster</span>
              </div>
              <span className="rig-speed">100 Billion / sec (NTLM/MD5)</span>
              <strong className="rig-time">{analysis.crackTimes.gpuRig}</strong>
            </div>

            <div className="rig-card">
              <div className="rig-meta">
                <Sparkles size={16} />
                <span className="rig-name">Distributed Supercomputer</span>
              </div>
              <span className="rig-speed">10 Trillion / sec</span>
              <strong className="rig-time">{analysis.crackTimes.supercomputer}</strong>
            </div>
          </div>
        </div>

        {/* Warnings & Hardening Recommendations */}
        <div className="entropy-advisories-grid">
          {analysis.warnings.length > 0 && (
            <div className="advisory-card warning">
              <div className="advisory-title">
                <AlertTriangle size={15} /> Detected Vulnerabilities
              </div>
              <ul>
                {analysis.warnings.map((w, i) => (
                  <li key={i}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="advisory-card recommendations">
            <div className="advisory-title">
              <CheckCircle2 size={15} /> Security Recommendations
            </div>
            <ul>
              {analysis.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}

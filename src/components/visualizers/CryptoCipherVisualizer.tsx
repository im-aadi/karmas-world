import { useState, useId } from 'react'
import {
  KeyRound,
  Lock,
  Unlock,
  CheckCircle2,
} from 'lucide-react'

// Simple deterministic SHA-256 in browser via Web Crypto API (async) or fast fallback
async function sha256Hex(text: string): Promise<string> {
  if (typeof crypto !== 'undefined' && crypto.subtle) {
    const encoder = new TextEncoder()
    const data = encoder.encode(text)
    const hashBuffer = await crypto.subtle.digest('SHA-256', data)
    const hashArray = Array.from(new Uint8Array(hashBuffer))
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('')
  }
  // Fallback FNV-1a based 64-char pseudo-hash for non-crypto environments
  let h1 = 0x811c9dc5
  let h2 = 0x487a21f3
  for (let i = 0; i < text.length; i++) {
    const code = text.charCodeAt(i)
    h1 = Math.imul(h1 ^ code, 0x01000193)
    h2 = Math.imul(h2 ^ (code + i), 0x01000193)
  }
  const s1 = Math.abs(h1).toString(16).padStart(8, '0')
  const s2 = Math.abs(h2).toString(16).padStart(8, '0')
  return (s1 + s2).repeat(4)
}

function caesarEncrypt(text: string, shift: number): string {
  const s = ((shift % 26) + 26) % 26
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      if (code >= 65 && code <= 90) {
        return String.fromCharCode(((code - 65 + s) % 26) + 65)
      } else if (code >= 97 && code <= 122) {
        return String.fromCharCode(((code - 97 + s) % 26) + 97)
      }
      return char
    })
    .join('')
}

function vigenereEncrypt(text: string, key: string): string {
  if (!key) return text
  const cleanKey = key.toUpperCase().replace(/[^A-Z]/g, '')
  if (cleanKey.length === 0) return text

  let keyIndex = 0
  return text
    .split('')
    .map((char) => {
      const code = char.charCodeAt(0)
      const shift = cleanKey.charCodeAt(keyIndex % cleanKey.length)! - 65

      if (code >= 65 && code <= 90) {
        keyIndex++
        return String.fromCharCode(((code - 65 + shift) % 26) + 65)
      } else if (code >= 97 && code <= 122) {
        keyIndex++
        return String.fromCharCode(((code - 97 + shift) % 26) + 97)
      }
      return char
    })
    .join('')
}

export function CryptoCipherVisualizer() {
  const cipherShiftId = useId()
  const vigenereKeyId = useId()
  const [activeTab, setActiveTab] = useState<'CLASSICAL' | 'AES' | 'AVALANCHE'>('CLASSICAL')

  // Classical Cipher State
  const [cipherType, setCipherType] = useState<'CAESAR' | 'VIGENERE'>('CAESAR')
  const [plaintext, setPlaintext] = useState('ATTACK AT DAWN ON THE NORTHERN GATE')
  const [caesarShift, setCaesarShift] = useState(3)
  const [vigenereKey, setVigenereKey] = useState('CYBER')

  // AES Rounds State
  const [selectedAesStep, setSelectedAesStep] = useState<number>(1)

  // Avalanche Effect State
  const [sampleA, setSampleA] = useState('password123')
  const [sampleB, setSampleB] = useState('password124')
  const [hashA, setHashA] = useState('ef92b778bafe771e89245b89ecbc08a44a4e166c06659911881f383d4473e94f')
  const [hashB, setHashB] = useState('b9836338575083f2a713b194fb8a666e858dbff78d65561a3374fc7d0ad21b5b')
  const [differingBitsCount, setDifferingBitsCount] = useState(128)

  const ciphertext =
    cipherType === 'CAESAR'
      ? caesarEncrypt(plaintext, caesarShift)
      : vigenereEncrypt(plaintext, vigenereKey)

  async function updateHashes(textA: string, textB: string) {
    setSampleA(textA)
    setSampleB(textB)
    const [hA, hB] = await Promise.all([sha256Hex(textA), sha256Hex(textB)])
    setHashA(hA)
    setHashB(hB)

    // Calculate Hamming distance in hex
    let diffChars = 0
    for (let i = 0; i < Math.min(hA.length, hB.length); i++) {
      if (hA[i] !== hB[i]) diffChars++
    }
    // Approximate bit differences (average 2 bits per different hex char)
    setDifferingBitsCount(Math.min(256, Math.max(0, Math.round((diffChars / 64) * 256))))
  }

  return (
    <div className="crypto-visualizer-container" id="crypto-visualizer">
      <div className="crypto-header">
        <div className="crypto-title-wrap">
          <span className="section-cyber-tag">
            <KeyRound size={13} /> CRYPTOGRAPHIC MECHANICS & CIPHER WORKSHOP
          </span>
          <h3>Interactive Cryptography & Cipher Visualizer</h3>
          <p>
            Understand the foundational building blocks of security: substitution, transposition, block cipher rounds, and the avalanche effect in cryptographic hash functions.
          </p>
        </div>
        <div className="crypto-tab-pills">
          <button
            className={`crypto-tab-btn ${activeTab === 'CLASSICAL' ? 'active' : ''}`}
            onClick={() => setActiveTab('CLASSICAL')}
          >
            Classical Ciphers
          </button>
          <button
            className={`crypto-tab-btn ${activeTab === 'AES' ? 'active' : ''}`}
            onClick={() => setActiveTab('AES')}
          >
            AES Block Mechanics
          </button>
          <button
            className={`crypto-tab-btn ${activeTab === 'AVALANCHE' ? 'active' : ''}`}
            onClick={() => setActiveTab('AVALANCHE')}
          >
            Hash Avalanche Effect
          </button>
        </div>
      </div>

      {/* Tab 1: Classical Ciphers */}
      {activeTab === 'CLASSICAL' && (
        <div className="classical-cipher-panel">
          <div className="cipher-selector-row">
            <div className="cipher-type-toggles">
              <button
                className={`type-btn ${cipherType === 'CAESAR' ? 'active' : ''}`}
                onClick={() => setCipherType('CAESAR')}
              >
                Caesar Shift Cipher
              </button>
              <button
                className={`type-btn ${cipherType === 'VIGENERE' ? 'active' : ''}`}
                onClick={() => setCipherType('VIGENERE')}
              >
                Vigenère Polyalphabetic Cipher
              </button>
            </div>

            {cipherType === 'CAESAR' ? (
              <div className="cipher-param-control">
                <label htmlFor={cipherShiftId}>Key Shift: <strong>+{caesarShift}</strong> positions</label>
                <input
                  id={cipherShiftId}
                  type="range"
                  min="1"
                  max="25"
                  value={caesarShift}
                  onChange={(e) => setCaesarShift(parseInt(e.target.value, 10))}
                />
              </div>
            ) : (
              <div className="cipher-param-control">
                <label htmlFor={vigenereKeyId}>Polyalphabetic Keyword:</label>
                <input
                  id={vigenereKeyId}
                  type="text"
                  value={vigenereKey}
                  onChange={(e) => setVigenereKey(e.target.value.toUpperCase())}
                  className="keyword-input"
                  maxLength={12}
                />
              </div>
            )}
          </div>

          <div className="cipher-io-grid">
            <div className="io-card">
              <div className="io-card-header">
                <span className="io-badge input">
                  <Unlock size={14} /> Plaintext Input
                </span>
                <span className="char-count">{plaintext.length} characters</span>
              </div>
              <textarea
                value={plaintext}
                onChange={(e) => setPlaintext(e.target.value)}
                placeholder="Type text to encrypt..."
                className="cipher-textarea"
                rows={3}
              />
            </div>

            <div className="io-card output">
              <div className="io-card-header">
                <span className="io-badge output">
                  <Lock size={14} /> Ciphertext Output
                </span>
                <span className="encryption-meta">
                  {cipherType === 'CAESAR' ? `Shift +${caesarShift}` : `Key: ${vigenereKey || 'NONE'}`}
                </span>
              </div>
              <div className="ciphertext-display">
                <code>{ciphertext}</code>
              </div>
            </div>
          </div>

          {/* Alphabet Wheel Mapping Demonstration */}
          <div className="alphabet-mapping-strip">
            <span className="mapping-label">Character Shift Mapping (A → Z):</span>
            <div className="mapping-alphabet-row">
              {'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('').map((ch) => {
                const enc = caesarEncrypt(ch, caesarShift)
                return (
                  <div key={ch} className="mapping-pair">
                    <span className="char-orig">{ch}</span>
                    <span className="char-arrow">↓</span>
                    <span className="char-enc">{enc}</span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: AES Block Mechanics */}
      {activeTab === 'AES' && (
        <div className="aes-mechanics-panel">
          <div className="aes-intro-banner">
            <div className="aes-intro-text">
              <h4>Advanced Encryption Standard (AES) — Anatomy of a Round</h4>
              <p>
                AES-128 processes data in 128-bit (4×4 byte matrix) blocks across 10 rounds. Each round applies four distinct mathematical transformations providing <strong>Confusion</strong> and <strong>Diffusion</strong>.
              </p>
            </div>
          </div>

          <div className="aes-steps-bar">
            <button
              className={`aes-step-btn ${selectedAesStep === 1 ? 'active' : ''}`}
              onClick={() => setSelectedAesStep(1)}
            >
              1. SubBytes (S-Box)
            </button>
            <button
              className={`aes-step-btn ${selectedAesStep === 2 ? 'active' : ''}`}
              onClick={() => setSelectedAesStep(2)}
            >
              2. ShiftRows (Permutation)
            </button>
            <button
              className={`aes-step-btn ${selectedAesStep === 3 ? 'active' : ''}`}
              onClick={() => setSelectedAesStep(3)}
            >
              3. MixColumns (Diffusion)
            </button>
            <button
              className={`aes-step-btn ${selectedAesStep === 4 ? 'active' : ''}`}
              onClick={() => setSelectedAesStep(4)}
            >
              4. AddRoundKey (XOR)
            </button>
          </div>

          <div className="aes-step-details-grid">
            <div className="step-info-card">
              {selectedAesStep === 1 && (
                <>
                  <div className="step-badge">CONFUSION PRINCIPLE</div>
                  <h5>SubBytes: Non-Linear Substitution</h5>
                  <p>
                    Each byte in the 4×4 state matrix is replaced with another byte according to an 8-bit non-linear substitution table (the Rijndael S-Box).
                  </p>
                  <ul className="step-features">
                    <li>Eliminates linear mathematical relationships between input and output.</li>
                    <li>Derived from multiplicative inverse in Galois Field $GF(2^8)$ combined with affine transformation.</li>
                    <li>Defends against differential and linear cryptanalysis.</li>
                  </ul>
                </>
              )}

              {selectedAesStep === 2 && (
                <>
                  <div className="step-badge">DIFFUSION PRINCIPLE</div>
                  <h5>ShiftRows: Cyclic Row Transposition</h5>
                  <p>
                    The rows of the 4×4 state matrix are cyclically shifted to the left by differing byte offsets:
                  </p>
                  <ul className="step-features">
                    <li>Row 0: Not shifted (0 byte shift).</li>
                    <li>Row 1: Cyclically shifted left by 1 byte.</li>
                    <li>Row 2: Cyclically shifted left by 2 bytes.</li>
                    <li>Row 3: Cyclically shifted left by 3 bytes.</li>
                    <li>Ensures bytes of each column are spread across different columns in subsequent rounds.</li>
                  </ul>
                </>
              )}

              {selectedAesStep === 3 && (
                <>
                  <div className="step-badge">MAXIMUM SPREAD</div>
                  <h5>MixColumns: Linear Matrix Multiplication</h5>
                  <p>
                    Each column of the state matrix is multiplied by a fixed polynomial matrix modulo $x^4 + 1$ in $GF(2^8)$.
                  </p>
                  <ul className="step-features">
                    <li>Takes all 4 bytes of a column and mixes them together into 4 completely new bytes.</li>
                    <li>Combined with ShiftRows, after just two rounds every single output bit depends on every single input bit!</li>
                    <li>Omitted in the final (10th) round to make decryption symmetrical.</li>
                  </ul>
                </>
              )}

              {selectedAesStep === 4 && (
                <>
                  <div className="step-badge">KEY MIXING</div>
                  <h5>AddRoundKey: Bitwise XOR with Round Key</h5>
                  <p>
                    A 128-bit subkey (derived from the master key via the Rijndael Key Schedule) is combined with the state matrix using bitwise XOR ($\oplus$).
                  </p>
                  <ul className="step-features">
                    <li>Adds the secret key entropy into the cipher state.</li>
                    <li>XOR is self-inverting: $(A \oplus K) \oplus K = A$, making decryption mathematically reversible.</li>
                    <li>Applied at round 0 (pre-round), every intermediate round, and round 10.</li>
                  </ul>
                </>
              )}
            </div>

            {/* Matrix Visualizer */}
            <div className="aes-matrix-card">
              <span className="matrix-title">128-Bit State Matrix (4×4 Bytes)</span>
              <div className="state-matrix-grid">
                {Array.from({ length: 16 }).map((_, i) => (
                  <div
                    key={i}
                    className={`matrix-cell ${selectedAesStep === 1 ? 'subbed' : selectedAesStep === 2 ? 'shifted' : selectedAesStep === 3 ? 'mixed' : 'keyed'}`}
                  >
                    <span>0x{((i * 17 + 42) % 256).toString(16).padStart(2, '0').toUpperCase()}</span>
                  </div>
                ))}
              </div>
              <span className="matrix-foot-note">16 bytes × 8 bits = 128 bits per cryptographic block</span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Hash Avalanche Effect */}
      {activeTab === 'AVALANCHE' && (
        <div className="avalanche-panel">
          <div className="avalanche-intro">
            <h4>Strict Avalanche Criterion (SAC) in Cryptographic Hashes</h4>
            <p>
              In a secure cryptographic hash function like SHA-256, changing even a <strong>single bit</strong> in the input causes approximately <strong>50%</strong> of the output hash bits to flip completely unpredictably.
            </p>
          </div>

          <div className="avalanche-inputs-grid">
            <div className="avalanche-input-card">
              <label>Input Message A:</label>
              <input
                type="text"
                value={sampleA}
                onChange={(e) => void updateHashes(e.target.value, sampleB)}
                className="avalanche-text-field"
              />
              <div className="hash-result-box">
                <span className="hash-algo">SHA-256 (A):</span>
                <code className="hash-code">{hashA}</code>
              </div>
            </div>

            <div className="avalanche-input-card">
              <label>Input Message B (Notice 1 Character Difference):</label>
              <input
                type="text"
                value={sampleB}
                onChange={(e) => void updateHashes(sampleA, e.target.value)}
                className="avalanche-text-field highlight-diff"
              />
              <div className="hash-result-box">
                <span className="hash-algo">SHA-256 (B):</span>
                <code className="hash-code">{hashB}</code>
              </div>
            </div>
          </div>

          <div className="avalanche-metric-bar">
            <div className="metric-box">
              <span className="metric-title">ESTIMATED BIT FLIP DISTANCE</span>
              <strong className="metric-val">{differingBitsCount} / 256 Bits (~{Math.round((differingBitsCount / 256) * 100)}%)</strong>
            </div>
            <div className="metric-bar-wrap">
              <div className="metric-bar-fill" style={{ width: `${Math.round((differingBitsCount / 256) * 100)}%` }} />
            </div>
            <p className="avalanche-note">
              <CheckCircle2 size={14} /> Demonstrates ideal diffusion: An attacker cannot infer any correlation between similar preimages.
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

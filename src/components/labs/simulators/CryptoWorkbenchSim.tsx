import { useState, type FormEvent } from 'react'
import { Lock, Unlock, ShieldAlert, Cpu, Sparkles, CheckCircle2 } from 'lucide-react'

interface CryptoWorkbenchSimProps {
  challenge?: {
    targetHash: string
    algorithm: string
    wordlist: string[]
    cipherPayload: {
      iv: string
      ciphertext: string
      tag: string
      expectedPlaintext: string
    }
  }
}

export function CryptoWorkbenchSim({ challenge }: CryptoWorkbenchSimProps) {
  const [activeTab, setActiveTab] = useState<'cracker' | 'aes' | 'flaw'>('cracker')
  const [targetHash, setTargetHash] = useState(
    challenge?.targetHash || 'd63cd4c0c078e98e65e5dfbc3773573fde926b108acf14b8d56ab8039758daba'
  )
  const [cracking, setCracking] = useState(false)
  const [crackedResult, setCrackedResult] = useState<string | null>(null)
  const [testedCount, setTestedCount] = useState(0)

  // AES Decryptor state
  const [aesKey, setAesKey] = useState('')
  const [decryptedText, setDecryptedText] = useState<string | null>(null)
  const [decryptError, setDecryptError] = useState<string | null>(null)

  const wordlist = challenge?.wordlist || [
    'password',
    'admin123',
    'qwerty',
    'dragon',
    'karmacyber2026',
    'KW{cr4ck_th3_h4sh_sh4256}',
    'cybersecurity101',
  ]

  function runDictionaryAttack() {
    setCracking(true)
    setCrackedResult(null)
    setTestedCount(0)

    let idx = 0
    const interval = setInterval(() => {
      if (idx >= wordlist.length) {
        clearInterval(interval)
        setCracking(false)
        return
      }
      setTestedCount(idx + 1)
      const candidate = wordlist[idx]
      // In this challenge, the secret is KW{cr4ck_th3_h4sh_sh4256}
      if (candidate === 'KW{cr4ck_th3_h4sh_sh4256}') {
        clearInterval(interval)
        setCrackedResult(candidate)
        setCracking(false)
        return
      }
      idx++
    }, 120)
  }

  function handleAesDecrypt(e: FormEvent) {
    e.preventDefault()
    setDecryptError(null)
    setDecryptedText(null)

    if (aesKey.trim() === 'karmas-world-aes-master-key-2026') {
      setDecryptedText(challenge?.cipherPayload.expectedPlaintext || 'KW{43s_gcm_auth_d3crypt3d}')
    } else {
      setDecryptError('Authentication Tag Verification Failed (Ciphertext tampering or incorrect 256-bit key).')
    }
  }

  return (
    <div className="crypto-workbench-container">
      {/* Workbench Navigation */}
      <div className="crypto-nav-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('cracker')}
          className={`crypto-tab ${activeTab === 'cracker' ? 'active' : ''}`}
        >
          <Cpu size={14} />
          <span>Dictionary Hash Cracker (SHA-256)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('aes')}
          className={`crypto-tab ${activeTab === 'aes' ? 'active' : ''}`}
        >
          <Lock size={14} />
          <span>AES-256-GCM Decryptor</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('flaw')}
          className={`crypto-tab ${activeTab === 'flaw' ? 'active' : ''}`}
        >
          <ShieldAlert size={14} />
          <span>Cryptographic Flaw Analysis</span>
        </button>
      </div>

      {activeTab === 'cracker' && (
        <div className="crypto-tab-content">
          <div className="crypto-card">
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">Target Hash Input</h4>
            <p className="text-xs text-zinc-400 mb-3">
              One-way cryptographic hash intercepted from leaked database dump.
            </p>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={targetHash}
                onChange={(e) => setTargetHash(e.target.value)}
                className="crypto-input font-mono text-xs w-full"
              />
              <button
                type="button"
                onClick={runDictionaryAttack}
                disabled={cracking}
                className="crypto-btn flex items-center gap-1.5 shrink-0"
              >
                <Sparkles size={14} />
                <span>{cracking ? 'Attacking...' : 'Run Dictionary Attack'}</span>
              </button>
            </div>

            <div className="p-3 rounded bg-zinc-950 border border-zinc-800 text-xs">
              <div className="flex justify-between text-zinc-400 mb-2">
                <span>Loaded Wordlist: {wordlist.length} candidates</span>
                <span>Tested: {testedCount} / {wordlist.length}</span>
              </div>
              <div className="w-full bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                <div
                  className="bg-cyan-500 h-full transition-all duration-150"
                  style={{ width: `${(testedCount / wordlist.length) * 100}%` }}
                />
              </div>
            </div>

            {crackedResult && (
              <div className="mt-4 p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm mb-1">
                  <CheckCircle2 size={16} />
                  <span>Hash Successfully Cracked!</span>
                </div>
                <div className="text-xs text-zinc-300">
                  Original Plaintext / Captured Flag:
                </div>
                <div className="mt-2 p-2 bg-black/60 rounded border border-emerald-800 font-mono text-emerald-300 text-sm select-all">
                  {crackedResult}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'aes' && (
        <div className="crypto-tab-content">
          <div className="crypto-card">
            <h4 className="text-sm font-semibold text-zinc-100 mb-1">AES-256-GCM Authenticated Decryption</h4>
            <p className="text-xs text-zinc-400 mb-4">
              Supply the symmetric encryption key to decrypt the payload and verify the GCM integrity authentication tag.
            </p>

            <div className="grid grid-cols-2 gap-3 mb-4 text-xs font-mono">
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">Initialization Vector (IV / Nonce):</span>
                <span className="text-amber-400">{challenge?.cipherPayload.iv || 'f24a89bc30d12e45789a12bc'}</span>
              </div>
              <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800">
                <span className="text-zinc-500 block mb-1">Authentication Tag (GCM Tag):</span>
                <span className="text-blue-400">{challenge?.cipherPayload.tag || '3a8f9024bc126789de0145fa8912cb34'}</span>
              </div>
            </div>

            <form onSubmit={handleAesDecrypt}>
              <div className="mb-3">
                <label className="block text-xs font-mono text-zinc-300 mb-1">256-Bit Symmetric Secret Key</label>
                <input
                  type="text"
                  value={aesKey}
                  onChange={(e) => setAesKey(e.target.value)}
                  placeholder="Paste revealed encryption key (e.g. karmas-world-aes-master-key-2026)"
                  className="crypto-input font-mono text-xs w-full"
                />
              </div>

              <div className="flex gap-2 mb-4">
                <button type="submit" className="crypto-btn flex items-center gap-1.5">
                  <Unlock size={14} />
                  <span>Decrypt & Verify Integrity</span>
                </button>
                <button
                  type="button"
                  onClick={() => setAesKey('karmas-world-aes-master-key-2026')}
                  className="payload-pill"
                >
                  Autofill Master Key
                </button>
              </div>
            </form>

            {decryptedText && (
              <div className="p-3.5 bg-emerald-950/70 border border-emerald-500/50 rounded-lg">
                <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-sm mb-1">
                  <CheckCircle2 size={16} />
                  <span>Decryption Successful & GCM Tag Validated!</span>
                </div>
                <div className="mt-2 p-2 bg-black/60 rounded border border-emerald-800 font-mono text-emerald-300 text-sm select-all">
                  {decryptedText}
                </div>
              </div>
            )}

            {decryptError && (
              <div className="p-3 bg-red-950/60 border border-red-500/50 rounded text-xs text-red-200">
                {decryptError}
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'flaw' && (
        <div className="crypto-tab-content">
          <div className="crypto-card">
            <h4 className="text-sm font-semibold text-zinc-100 mb-2">Cryptographic Flaw: Nonce & Salt Reuse</h4>
            <p className="text-xs text-zinc-300 mb-4 leading-relaxed">
              In modern authenticated encryption schemes like AES-GCM or ChaCha20-Poly1305, reusing an Initialization
              Vector (Nonce) with the same key catastrophic destroys confidentiality and allows message forgery.
            </p>
            <div className="p-4 rounded-lg bg-zinc-950 border border-amber-500/40">
              <div className="flex items-center gap-2 text-amber-400 font-semibold text-xs mb-2">
                <ShieldAlert size={15} />
                <span>Audit Incident Report: Salt Reuse Finding</span>
              </div>
              <p className="text-xs text-zinc-400 mb-2 font-mono">
                Observation: System administrator configured static IV <code>0x0000000000000000</code> across all users.
              </p>
              <div className="p-2.5 bg-black/80 rounded border border-zinc-800 font-mono text-emerald-400 text-xs select-all">
                KW&#123;s4lt_r3us3_c0mpr0m1s3&#125;
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

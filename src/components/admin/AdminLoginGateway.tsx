import { useState, type FormEvent } from 'react'
import { ArrowRight, KeyRound, Lock, Shield, ShieldAlert, Sparkles, XCircle } from 'lucide-react'
import type { LearnerAccount } from '../../data/account'

const ASSIGNED_ADMIN_EMAIL = 'adityakumar748847@gmail.com'
const VALID_ADMIN_PASSKEYS = ['KW-ADMIN-748847', 'adityakumar748847', 'adityakumar748847@gmail.com']

type Props = {
  account: LearnerAccount | null
  onLogin: () => void
  onRegister?: () => void
  onEnterAdmin: (adminUser: LearnerAccount) => void
}

export function AdminLoginGateway({ account, onLogin, onEnterAdmin }: Props) {
  const [passkey, setPasskey] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const handlePasskeySubmit = (e: FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const clean = passkey.trim()
    const isValid = VALID_ADMIN_PASSKEYS.includes(clean) || clean.toLowerCase() === ASSIGNED_ADMIN_EMAIL.toLowerCase()

    if (isValid) {
      setSuccess('Identity verified. Granting administrative clearance...')
      setTimeout(() => {
        const creatorAdmin: LearnerAccount = {
          id: 'admin-aditya-kumar',
          displayName: 'Aditya Kumar (Admin)',
          email: ASSIGNED_ADMIN_EMAIL,
          role: 'ADMIN',
          mfaEnabled: true,
        }
        onEnterAdmin(creatorAdmin)
      }, 400)
    } else {
      setError(`Access Denied (403 Forbidden): Invalid administrator security passkey. Only the assigned platform administrator (${ASSIGNED_ADMIN_EMAIL}) is permitted to unlock this console.`)
    }
  }

  return (
    <section className="wrap" style={{ padding: '64px 0 96px', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '12px' }}>
          <span className="eyebrow-line" /> RESTRICTED SECURITY CONSOLE &bull; LEVEL 4 CLEARANCE
        </div>
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 18px',
            borderRadius: '16px',
            background: 'rgba(255, 170, 0, 0.1)',
            border: '1px solid rgba(255, 170, 0, 0.4)',
            display: 'grid',
            placeItems: 'center',
            color: '#ffa726'
          }}
        >
          <Lock size={30} />
        </div>
        <h2 style={{ fontSize: '36px', letterSpacing: '-0.04em', margin: '0 0 12px' }}>
          Administrator <span style={{ color: '#ffa726' }}>Access Gateway</span>
        </h2>
        <p style={{ color: '#9aa8b4', fontSize: '14px', lineHeight: '1.7', margin: '0' }}>
          This operations dashboard is strictly restricted to the assigned platform administrator. Unauthorized access attempts are monitored and prohibited.
        </p>
      </div>

      <div
        style={{
          background: '#101823',
          border: '1px solid #202c37',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.5)'
        }}
      >
        <div style={{ display: 'grid', gap: '20px' }}>
          {/* Assigned Admin Policy Notice */}
          <div
            style={{
              padding: '14px 16px',
              background: 'rgba(255, 170, 0, 0.08)',
              border: '1px solid rgba(255, 170, 0, 0.28)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              gap: '12px'
            }}
          >
            <ShieldAlert size={20} color="#ffa726" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: '11px', color: '#e0d8c8', lineHeight: '1.6' }}>
              <strong>Designated Administrator:</strong> Aditya Kumar (<code>{ASSIGNED_ADMIN_EMAIL}</code>).
              <br />
              Public access and guest accounts cannot view or alter this dashboard.
            </div>
          </div>

          {/* Secure Admin Key Authentication Form */}
          <form onSubmit={handlePasskeySubmit} style={{ display: 'grid', gap: '12px' }}>
            <label style={{ display: 'grid', gap: '6px', fontSize: '12px', color: '#cbd5dc', fontWeight: 600 }}>
              <span>Enter Administrator Security Passkey or Admin Email:</span>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  required
                  placeholder="Enter administrator passkey..."
                  value={passkey}
                  onChange={(e) => setPasskey(e.target.value)}
                  style={{
                    flex: 1,
                    height: '42px',
                    padding: '0 14px',
                    background: '#090e16',
                    border: '1px solid #2b3947',
                    borderRadius: '6px',
                    color: '#eef2f0',
                    fontFamily: 'monospace',
                    fontSize: '13px',
                    outline: 'none'
                  }}
                />
                <button
                  type="submit"
                  className="button-primary"
                  style={{
                    border: 0,
                    cursor: 'pointer',
                    padding: '0 20px',
                    fontSize: '12px',
                    fontWeight: 700,
                    whiteSpace: 'nowrap'
                  }}
                >
                  <KeyRound size={15} /> Authenticate
                </button>
              </div>
            </label>
            <small style={{ color: '#7a8b98', fontSize: '10px' }}>
              Tip: The assigned creator passkey matches your verified admin credentials.
            </small>
          </form>

          {error && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 80, 80, 0.12)',
                border: '1px solid rgba(255, 80, 80, 0.35)',
                borderRadius: '6px',
                color: '#ff9999',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '10px'
              }}
            >
              <XCircle size={16} style={{ flexShrink: 0, marginTop: '2px' }} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(184, 242, 126, 0.12)',
                border: '1px solid rgba(184, 242, 126, 0.35)',
                borderRadius: '6px',
                color: 'var(--mint)',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <Sparkles size={16} />
              <span>{success}</span>
            </div>
          )}

          <div style={{ textAlign: 'center', color: '#556573', fontSize: '11px', font: '10px var(--mono)' }}>
            — OR SIGN IN WITH REGISTERED CREDENTIALS —
          </div>

          {/* Standard Sign In with Admin Account */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
            <div
              style={{
                padding: '16px',
                background: '#0b121a',
                border: '1px solid #23303c',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccd6dc' }}>
                <KeyRound size={16} color="var(--mint)" />
                <strong style={{ fontSize: '13px' }}>Sign In with Admin Account</strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#8897a2', lineHeight: '1.6' }}>
                Sign in using <code>{ASSIGNED_ADMIN_EMAIL}</code> to access your dashboard.
              </p>
              <button
                type="button"
                className="login-link"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                onClick={onLogin}
              >
                Sign In
              </button>
            </div>

            <div
              style={{
                padding: '16px',
                background: '#0b121a',
                border: '1px solid #23303c',
                borderRadius: '8px',
                display: 'flex',
                flexDirection: 'column',
                gap: '10px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#ccd6dc' }}>
                <Shield size={16} color="#ffa726" />
                <strong style={{ fontSize: '13px' }}>Need Access?</strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#8897a2', lineHeight: '1.6' }}>
                If you are a student or learner, browse the catalog and academy pathways.
              </p>
              <a
                href="#catalog"
                className="nav-cta"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '10px 14px', textAlign: 'center' }}
              >
                Go to Courses <ArrowRight size={13} />
              </a>
            </div>
          </div>

          {account && account.role !== 'ADMIN' && (
            <div
              style={{
                padding: '12px 14px',
                background: 'rgba(255, 154, 154, 0.08)',
                border: '1px solid rgba(255, 154, 154, 0.25)',
                borderRadius: '6px',
                color: '#ffc1c1',
                fontSize: '11px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}
            >
              <ShieldAlert size={16} />
              <span>
                Currently signed in as <strong>{account.displayName}</strong> ({account.email}) with role: <em>{account.role}</em>. Access denied. Only <code>{ASSIGNED_ADMIN_EMAIL}</code> holds administrative authority.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

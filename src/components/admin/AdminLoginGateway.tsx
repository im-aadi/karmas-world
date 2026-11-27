import { ArrowRight, KeyRound, Lock, Shield, Sparkles, UserCheck } from 'lucide-react'
import type { LearnerAccount } from '../../data/account'

type Props = {
  account: LearnerAccount | null
  onLogin: () => void
  onRegister: () => void
  onEnterAdmin: (adminUser: LearnerAccount) => void
}

export function AdminLoginGateway({ account, onLogin, onRegister, onEnterAdmin }: Props) {
  const handleCreatorQuickAccess = () => {
    const creatorAdmin: LearnerAccount = {
      id: 'admin-aditya-kumar',
      displayName: 'Aditya Kumar (Admin)',
      email: 'adityakumar748847@gmail.com',
      role: 'ADMIN',
      mfaEnabled: true,
    }
    onEnterAdmin(creatorAdmin)
  }

  return (
    <section className="wrap" style={{ padding: '64px 0 96px', maxWidth: '720px', margin: '0 auto' }}>
      <div style={{ textAlign: 'center', marginBottom: '32px' }}>
        <div className="eyebrow" style={{ justifyContent: 'center', marginBottom: '12px' }}>
          <span className="eyebrow-line" /> SECURITY OPERATIONS & CONTROL CONSOLE
        </div>
        <div
          style={{
            width: '64px',
            height: '64px',
            margin: '0 auto 18px',
            borderRadius: '16px',
            background: 'rgba(184, 242, 126, 0.1)',
            border: '1px solid rgba(184, 242, 126, 0.35)',
            display: 'grid',
            placeItems: 'center',
            color: 'var(--mint)'
          }}
        >
          <Lock size={30} />
        </div>
        <h2 style={{ fontSize: '36px', letterSpacing: '-0.04em', margin: '0 0 12px' }}>
          Administrator <span className="accent-word">Authentication</span>
        </h2>
        <p style={{ color: '#9aa8b4', fontSize: '14px', lineHeight: '1.7', margin: '0' }}>
          The Karma’s World Admin Console allows administrators to inspect platform telemetry, manage courses, moderate community discussions, and assign user security roles.
        </p>
      </div>

      <div
        style={{
          background: '#101823',
          border: '1px solid #202c37',
          borderRadius: '12px',
          padding: '28px',
          boxShadow: '0 12px 48px rgba(0, 0, 0, 0.35)'
        }}
      >
        <div style={{ display: 'grid', gap: '18px' }}>
          {/* Creator One-Click Access Card */}
          <div
            style={{
              padding: '18px 20px',
              background: 'rgba(184, 242, 126, 0.08)',
              border: '1px solid rgba(184, 242, 126, 0.28)',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '16px',
              flexWrap: 'wrap'
            }}
          >
            <div>
              <span style={{ font: '9px var(--mono)', color: 'var(--mint)', letterSpacing: '0.1em' }}>
                CREATOR & OWNER ACCESS
              </span>
              <h4 style={{ margin: '4px 0 2px', fontSize: '15px', color: '#eef2f0' }}>
                Aditya Kumar (adityakumar748847@gmail.com)
              </h4>
              <p style={{ margin: 0, fontSize: '11px', color: '#a0b1aa' }}>
                Instant administrator session bypass with full owner permissions.
              </p>
            </div>
            <button
              type="button"
              className="button-primary"
              style={{ border: 0, cursor: 'pointer', padding: '10px 16px', fontSize: '12px' }}
              onClick={handleCreatorQuickAccess}
            >
              <Sparkles size={14} /> Enter as Aditya Kumar (Admin)
            </button>
          </div>

          <div style={{ textAlign: 'center', color: '#687784', fontSize: '11px', font: '10px var(--mono)' }}>
            — OR AUTHENTICATE WITH CREDENTIALS —
          </div>

          {/* Standard Login / Register Action Cards */}
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
                <strong style={{ fontSize: '13px' }}>Existing Admin</strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#8897a2', lineHeight: '1.6' }}>
                Sign in with your registered administrator email and password.
              </p>
              <button
                type="button"
                className="login-link"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto' }}
                onClick={onLogin}
              >
                Sign In to Admin
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
                <UserCheck size={16} color="var(--blue)" />
                <strong style={{ fontSize: '13px' }}>Create Account</strong>
              </div>
              <p style={{ margin: 0, fontSize: '11px', color: '#8897a2', lineHeight: '1.6' }}>
                Register a new account. Creating an account with creator email grants admin automatically.
              </p>
              <button
                type="button"
                className="nav-cta"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', padding: '10px 14px' }}
                onClick={onRegister}
              >
                Create Account <ArrowRight size={13} />
              </button>
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
              <Shield size={16} />
              <span>
                Currently signed in as <strong>{account.displayName}</strong> ({account.email}) with role: <em>{account.role}</em>. An administrator role is required to view this panel.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}

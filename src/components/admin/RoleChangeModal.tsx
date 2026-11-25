import { useState } from 'react'
import { AlertCircle, ShieldAlert, ShieldCheck, UserCheck, X } from 'lucide-react'
import { updateUserRole, type AdminUserSummary } from '../../data/adminClient'

interface RoleChangeModalProps {
  user: AdminUserSummary
  csrfToken?: string
  onClose: () => void
  onRoleUpdated: (userId: string, newRole: 'LEARNER' | 'ADMIN') => void
}

export function RoleChangeModal({
  user,
  csrfToken,
  onClose,
  onRoleUpdated,
}: RoleChangeModalProps) {
  const [targetRole, setTargetRole] = useState<'LEARNER' | 'ADMIN'>(
    user.role === 'ADMIN' ? 'LEARNER' : 'ADMIN'
  )
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleConfirm() {
    setSubmitting(true)
    setError(null)
    try {
      await updateUserRole(user.id, targetRole, csrfToken)
      onRoleUpdated(user.id, targetRole)
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Could not change account role.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="modal-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div
        className="modal-container role-change-modal"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div className="modal-title-wrap">
            <span className="modal-tag">
              <UserCheck size={14} /> ACCESS CONTROL & PERMISSIONS
            </span>
            <h2 className="modal-title">Modify Account Role</h2>
          </div>
          <button
            className="modal-close-btn"
            onClick={onClose}
            aria-label="Close role change modal"
          >
            <X size={20} />
          </button>
        </div>

        <div className="modal-body">
          {error && (
            <div className="error-banner">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <div className="user-role-summary-card">
            <div className="user-field">
              <span className="field-label">Account Name</span>
              <strong className="field-value">{user.displayName}</strong>
            </div>
            <div className="user-field">
              <span className="field-label">Email Address</span>
              <strong className="field-value">{user.email}</strong>
            </div>
            <div className="user-field">
              <span className="field-label">Current Role</span>
              <span className={`role-badge badge-${user.role.toLowerCase()}`}>
                {user.role}
              </span>
            </div>
          </div>

          <div className="form-group" style={{ marginTop: '18px' }}>
            <label htmlFor="select-role">Select New Account Role</label>
            <select
              id="select-role"
              className="select-input"
              value={targetRole}
              onChange={(e) => setTargetRole(e.target.value as 'LEARNER' | 'ADMIN')}
            >
              <option value="LEARNER">LEARNER (Standard Learning Access)</option>
              <option value="ADMIN">ADMIN (Full Platform Administration)</option>
            </select>
          </div>

          {targetRole === 'ADMIN' ? (
            <div className="role-warning-box admin-warning">
              <ShieldAlert size={18} />
              <div>
                <strong>Elevating to Platform Administrator</strong>
                <p>
                  This grants privileged access to inspect learner accounts, publish or delete
                  courses, moderate forum discussions, and view system security event telemetry.
                </p>
              </div>
            </div>
          ) : (
            <div className="role-warning-box learner-notice">
              <ShieldCheck size={18} />
              <div>
                <strong>Reverting to Learner Role</strong>
                <p>
                  This account will retain all earned XP, ranks, and badges, but will no longer have
                  access to administrative routes or moderation queues.
                </p>
              </div>
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="button-secondary"
            onClick={onClose}
            disabled={submitting}
          >
            Cancel
          </button>
          <button
            type="button"
            className="button-primary"
            onClick={handleConfirm}
            disabled={submitting || targetRole === user.role}
          >
            {submitting ? 'Updating...' : `Confirm Role Change to ${targetRole}`}
          </button>
        </div>
      </div>
    </div>
  )
}

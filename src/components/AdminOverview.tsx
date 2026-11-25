import { AdminDashboard } from './admin/AdminDashboard'

export function AdminOverview({ csrfToken }: { csrfToken: string }) {
  return <AdminDashboard csrfToken={csrfToken} />
}

import { CommunityHub } from './community/CommunityHub'

type Props = {
  accountId?: string | null
  role?: 'LEARNER' | 'ADMIN' | null
  csrfToken?: string
  onSignIn?: () => void
}

export function CommunityCorner(props: Props) {
  return <CommunityHub {...props} />
}

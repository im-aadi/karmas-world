export type FeedbackCategory = 'bug' | 'feature' | 'course' | 'improvement' | 'general'

export interface UserFeedback {
  id: string
  category: FeedbackCategory
  title: string
  message: string
  name?: string
  email?: string
  rating?: number
  timestamp: string
  status: 'Received' | 'Under Review' | 'In Development' | 'Resolved'
}

export interface RoadmapItem {
  id: string
  title: string
  category: FeedbackCategory
  description: string
  status: 'Completed' | 'In Progress' | 'Planned'
  votes: number
}

const STORAGE_KEY = 'karma_user_feedback_v1'

export const defaultRoadmapItems: RoadmapItem[] = [
  {
    id: 'rd-01',
    title: 'Comprehensive 20-Domain Cybersecurity Curriculum',
    category: 'course',
    description: 'Expanded from 3 initial courses to 20 structured domains (120+ lessons) spanning ethical hacking, Linux, cryptography, SOC, and forensics.',
    status: 'Completed',
    votes: 142
  },
  {
    id: 'rd-02',
    title: 'Mobile Viewport & Touch Ergonomics',
    category: 'improvement',
    description: 'Fixed layout cutoff, sidebar overflow, and horizontal navigation blowouts for smartphone and tablet learners.',
    status: 'Completed',
    votes: 98
  },
  {
    id: 'rd-03',
    title: 'Creator Contact & Community Feedback Portal',
    category: 'feature',
    description: 'Direct channel for learners to report bugs, suggest courses, and contact the creator directly.',
    status: 'Completed',
    votes: 85
  },
  {
    id: 'rd-04',
    title: 'Interactive CLI Sandbox (Wireshark & Nmap Syntax)',
    category: 'feature',
    description: 'In-browser packet analysis and port scanner simulator with simulated PCAP inspection.',
    status: 'In Progress',
    votes: 119
  },
  {
    id: 'rd-05',
    title: 'Assembly & Reverse Engineering Binary Playground',
    category: 'course',
    description: 'Interactive x86/x64 decompilation viewer with step-by-step register state visualization.',
    status: 'In Progress',
    votes: 76
  },
  {
    id: 'rd-06',
    title: 'Live Multiplayer Red vs Blue CTF Arena',
    category: 'feature',
    description: 'Timed team-based defensive hardening and offensive intrusion scenarios with live scoreboards.',
    status: 'Planned',
    votes: 210
  }
]

export function getSavedFeedbacks(): UserFeedback[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    return JSON.parse(raw) as UserFeedback[]
  } catch {
    return []
  }
}

export async function submitUserFeedback(payload: {
  category: FeedbackCategory
  title: string
  message: string
  name?: string
  email?: string
  rating?: number
}): Promise<UserFeedback> {
  const id = `KW-FB-${Math.random().toString(36).substring(2, 8).toUpperCase()}`
  const newFeedback: UserFeedback = {
    id,
    category: payload.category,
    title: payload.title.trim(),
    message: payload.message.trim(),
    name: payload.name?.trim() || undefined,
    email: payload.email?.trim() || undefined,
    rating: payload.rating,
    timestamp: new Date().toISOString(),
    status: 'Received'
  }

  // Save to local storage for persistence across reloads
  if (typeof window !== 'undefined') {
    try {
      const existing = getSavedFeedbacks()
      localStorage.setItem(STORAGE_KEY, JSON.stringify([newFeedback, ...existing]))
    } catch {
      // Ignore localStorage errors
    }
  }

  // Attempt to submit to backend if running
  try {
    await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newFeedback)
    })
  } catch {
    // If backend is unreachable (e.g. static host), local ticket is preserved
  }

  return newFeedback
}

/**
 * Karma's World - Shared Models, Enums, and Constants
 * Philosophy: Learn. Practice. Explore. Master Cybersecurity.
 */

// User and Auth Roles
export type UserRole = 'LEARNER' | 'ADMIN';

// Cybersecurity Learning Difficulty Levels
export type DifficultyLevel = 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED';

// The 20 Core Cybersecurity Learning Categories
export const CYBERSECURITY_CATEGORIES = [
  'computer-fundamentals',
  'computer-networking',
  'linux-fundamentals',
  'windows-fundamentals',
  'python-for-cybersecurity',
  'programming-fundamentals',
  'cryptography',
  'ethical-hacking',
  'penetration-testing',
  'web-application-security',
  'owasp-top-10',
  'osint',
  'digital-forensics',
  'malware-analysis',
  'soc-operations',
  'siem-tools',
  'incident-response',
  'cloud-security',
  'network-security',
  'threat-intelligence',
] as const;

export type CybersecurityCategory = typeof CYBERSECURITY_CATEGORIES[number];

export interface CategoryInfo {
  id: CybersecurityCategory;
  name: string;
  description: string;
  level: DifficultyLevel;
  iconName: string;
}

export const CATEGORY_DETAILS: Record<CybersecurityCategory, CategoryInfo> = {
  'computer-fundamentals': {
    id: 'computer-fundamentals',
    name: 'Computer Fundamentals',
    description: 'Hardware, operating systems, memory architectures, and binary arithmetic.',
    level: 'BEGINNER',
    iconName: 'Cpu',
  },
  'computer-networking': {
    id: 'computer-networking',
    name: 'Computer Networking',
    description: 'OSI model, TCP/IP, routing, switching, subnets, and packet flow.',
    level: 'BEGINNER',
    iconName: 'Network',
  },
  'linux-fundamentals': {
    id: 'linux-fundamentals',
    name: 'Linux Fundamentals',
    description: 'CLI navigation, file permissions, processes, shell scripting, and system auditing.',
    level: 'BEGINNER',
    iconName: 'Terminal',
  },
  'windows-fundamentals': {
    id: 'windows-fundamentals',
    name: 'Windows Fundamentals',
    description: 'Windows architecture, PowerShell, Event Viewer, Registry, and Active Directory basics.',
    level: 'BEGINNER',
    iconName: 'LayoutGrid',
  },
  'python-for-cybersecurity': {
    id: 'python-for-cybersecurity',
    name: 'Python for Cybersecurity',
    description: 'Socket programming, port scanners, packet crafting, and automation scripts.',
    level: 'BEGINNER',
    iconName: 'Code',
  },
  'programming-fundamentals': {
    id: 'programming-fundamentals',
    name: 'Programming Fundamentals',
    description: 'Variables, data structures, algorithms, and logic for security professionals.',
    level: 'BEGINNER',
    iconName: 'Binary',
  },
  'cryptography': {
    id: 'cryptography',
    name: 'Cryptography',
    description: 'Symmetric & asymmetric encryption, hashing, digital signatures, and PKI.',
    level: 'INTERMEDIATE',
    iconName: 'KeyRound',
  },
  'ethical-hacking': {
    id: 'ethical-hacking',
    name: 'Ethical Hacking',
    description: 'Methodologies, recon, vulnerability assessment, and responsible disclosure.',
    level: 'INTERMEDIATE',
    iconName: 'ShieldAlert',
  },
  'penetration-testing': {
    id: 'penetration-testing',
    name: 'Penetration Testing',
    description: 'Network, web, and system penetration testing techniques and reporting.',
    level: 'INTERMEDIATE',
    iconName: 'Crosshair',
  },
  'web-application-security': {
    id: 'web-application-security',
    name: 'Web Application Security',
    description: 'Client-side & server-side web vulnerabilities, HTTP headers, and API security.',
    level: 'INTERMEDIATE',
    iconName: 'Globe',
  },
  'owasp-top-10': {
    id: 'owasp-top-10',
    name: 'OWASP Top 10',
    description: 'In-depth coverage of injection, broken auth, SSRF, security misconfigurations, and defenses.',
    level: 'INTERMEDIATE',
    iconName: 'AlertTriangle',
  },
  'osint': {
    id: 'osint',
    name: 'OSINT (Open Source Intelligence)',
    description: 'Lawful public domain investigations, DNS recon, metadata analysis, and digital footprinting.',
    level: 'BEGINNER',
    iconName: 'Search',
  },
  'digital-forensics': {
    id: 'digital-forensics',
    name: 'Digital Forensics',
    description: 'Artifact analysis, disk imaging, memory analysis, and chain of custody.',
    level: 'ADVANCED',
    iconName: 'FileSearch',
  },
  'malware-analysis': {
    id: 'malware-analysis',
    name: 'Malware Analysis',
    description: 'Static & dynamic analysis, disassembly, sandbox inspection, and behavior profiling.',
    level: 'ADVANCED',
    iconName: 'Bug',
  },
  'soc-operations': {
    id: 'soc-operations',
    name: 'SOC Operations',
    description: 'Triage, tier-1/tier-2 playbooks, log aggregation, and threat hunting workflows.',
    level: 'INTERMEDIATE',
    iconName: 'Eye',
  },
  'siem-tools': {
    id: 'siem-tools',
    name: 'SIEM Tools',
    description: 'Elasticsearch, Splunk query basics, correlation rules, and alert tuning.',
    level: 'INTERMEDIATE',
    iconName: 'Server',
  },
  'incident-response': {
    id: 'incident-response',
    name: 'Incident Response',
    description: 'Preparation, detection, containment, eradication, recovery, and post-incident review.',
    level: 'ADVANCED',
    iconName: 'Flame',
  },
  'cloud-security': {
    id: 'cloud-security',
    name: 'Cloud Security',
    description: 'IAM policies, shared responsibility model, container hardening, and cloud audit logs.',
    level: 'INTERMEDIATE',
    iconName: 'Cloud',
  },
  'network-security': {
    id: 'network-security',
    name: 'Network Security',
    description: 'Firewalls, IDS/IPS, VPNs, zero-trust architectures, and network segmentation.',
    level: 'INTERMEDIATE',
    iconName: 'ShieldCheck',
  },
  'threat-intelligence': {
    id: 'threat-intelligence',
    name: 'Threat Intelligence',
    description: 'MITRE ATT&CK, Cyber Kill Chain, IOC ingestion, and threat actor profiling.',
    level: 'ADVANCED',
    iconName: 'Compass',
  },
};

// Course & Lesson Interfaces
export interface Lesson {
  id: string;
  courseId: string;
  title: string;
  slug: string;
  order: number;
  content: string;
  xpReward: number;
}

export interface Course {
  id: string;
  title: string;
  slug: string;
  description: string;
  category: CybersecurityCategory;
  difficulty: DifficultyLevel;
  prerequisites: string[];
  learningObjectives: string[];
  xpReward: number;
  lessonsCount: number;
}

// Gamification Interfaces
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpValue: number;
}

export interface UserStats {
  xp: number;
  level: number;
  streakDays: number;
  completedLessonsCount: number;
}

// Practical Lab Interfaces
export type LabType =
  | 'linux-cli'
  | 'packet-analysis'
  | 'sqli-sandbox'
  | 'cryptography'
  | 'digital-forensics'
  | 'osint-recon';

export interface LabTask {
  id: string;
  title: string;
  instruction: string;
  hint: string;
  points: number;
  flagFormat?: string;
}

export interface Lab {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: CybersecurityCategory;
  difficulty: DifficultyLevel;
  duration: string;
  xpReward: number;
  type: LabType;
  objectives: string[];
  prerequisites: string[];
  instructions: string;
  tasks: LabTask[];
}

export type LabAttemptStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED';

export interface LabAttempt {
  id: string;
  userId: string;
  labId: string;
  completedTasks: string[];
  xpAwarded: number;
  status: LabAttemptStatus;
  startedAt: string;
  completedAt?: string | null;
}

// Gamification Systems, Ranks, and Level Progression
export interface RankInfo {
  level: number;
  title: string;
  minXp: number;
  badge: string;
  description: string;
}

export const CYBER_RANKS: RankInfo[] = [
  { level: 1, title: 'Cadet', minXp: 0, badge: 'Shield', description: 'Starting cybersecurity fundamentals and exploration.' },
  { level: 2, title: 'Scout', minXp: 500, badge: 'Compass', description: 'Acquiring hands-on CLI, networking, and security concepts.' },
  { level: 3, title: 'Defender', minXp: 1200, badge: 'ShieldCheck', description: 'Defending systems, analyzing traffic, and identifying vulnerabilities.' },
  { level: 4, title: 'Sentinel', minXp: 2200, badge: 'Zap', description: 'Mastering authentication, encryption, and proactive threat detection.' },
  { level: 5, title: 'Guardian', minXp: 3500, badge: 'Flame', description: 'Conducting in-depth incident investigations and secure code reviews.' },
  { level: 6, title: 'Specialist', minXp: 5200, badge: 'Trophy', description: 'Advanced offensive and defensive security operations.' },
  { level: 7, title: 'Architect', minXp: 7300, badge: 'Cpu', description: 'Enterprise threat modeling and resilient system design.' },
  { level: 8, title: 'Master', minXp: 10000, badge: 'Crown', description: 'Complete cybersecurity mastery across technical domains.' },
];

export interface UserLevelProgress {
  level: number;
  rankTitle: string;
  badge: string;
  currentXp: number;
  minXpForCurrentLevel: number;
  nextLevelXp: number | null;
  progressPercent: number;
  xpToNextLevel: number;
}

export function calculateUserLevel(totalXp: number): UserLevelProgress {
  const xp = Math.max(0, totalXp);
  const defaultRank: RankInfo = {
    level: 1,
    title: 'Cadet',
    minXp: 0,
    badge: 'Shield',
    description: 'Starting cybersecurity fundamentals and exploration.',
  };
  let currentRank: RankInfo = CYBER_RANKS[0] ?? defaultRank;

  for (let i = CYBER_RANKS.length - 1; i >= 0; i--) {
    const r = CYBER_RANKS[i];
    if (r && xp >= r.minXp) {
      currentRank = r;
      break;
    }
  }

  const nextRank = CYBER_RANKS.find((r) => r.level === currentRank.level + 1);

  if (!nextRank) {
    return {
      level: currentRank.level,
      rankTitle: currentRank.title,
      badge: currentRank.badge,
      currentXp: xp,
      minXpForCurrentLevel: currentRank.minXp,
      nextLevelXp: null,
      progressPercent: 100,
      xpToNextLevel: 0,
    };
  }

  const levelSpan = nextRank.minXp - currentRank.minXp;
  const progressInLevel = xp - currentRank.minXp;
  const progressPercent = Math.min(100, Math.max(0, Math.round((progressInLevel / levelSpan) * 100)));
  const xpToNextLevel = Math.max(0, nextRank.minXp - xp);

  return {
    level: currentRank.level,
    rankTitle: currentRank.title,
    badge: currentRank.badge,
    currentXp: xp,
    minXpForCurrentLevel: currentRank.minXp,
    nextLevelXp: nextRank.minXp,
    progressPercent,
    xpToNextLevel,
  };
}

export type ChallengeType = 'COMPLETE_LESSONS' | 'COMPLETE_LABS' | 'SOLVE_FLAGS' | 'STREAK_DAYS';

export interface WeeklyChallenge {
  id: string;
  slug: string;
  title: string;
  description: string;
  category: string;
  targetCount: number;
  type: ChallengeType;
  xpReward: number;
  badgeIcon: string;
  startsAt: string;
  expiresAt: string;
}

export interface LearnerChallengeProgress {
  challenge: WeeklyChallenge;
  currentCount: number;
  isCompleted: boolean;
  isClaimed: boolean;
}

export interface XPTransactionItem {
  id: string;
  amount: number;
  source: string;
  description: string;
  createdAt: string;
}

export interface GamificationStats {
  totalXp: number;
  levelProgress: UserLevelProgress;
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
    isActiveToday: boolean;
  };
  achievements: {
    unlockedCount: number;
    totalCount: number;
  };
  weeklyChallenges: LearnerChallengeProgress[];
  recentTransactions: XPTransactionItem[];
}




// Phase 8: Quiz & Assessment Engine Types
export interface QuizOptionItem {
  id: string;
  text: string;
  orderIndex: number;
  isCorrect?: boolean; // Only present in results/review
}

export interface QuizQuestionItem {
  id: string;
  prompt: string;
  codeSnippet?: string | null;
  orderIndex: number;
  points: number;
  options: QuizOptionItem[];
  explanation?: string; // Only present in results/review
  userSelectedOptionId?: string | null;
}

export interface QuizSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  categorySlug: CybersecurityCategory;
  difficulty: DifficultyLevel;
  timeLimitMins: number;
  passingScore: number;
  xpReward: number;
  totalQuestions: number;
  totalPoints: number;
  bestAttempt?: {
    score: number;
    maxScore: number;
    percentage: number;
    passed: boolean;
    completedAt: string;
  } | null;
}

export interface QuizDetail extends QuizSummary {
  questions: QuizQuestionItem[];
}

export interface SubmitQuizPayload {
  answers: Record<string, string>; // { [questionId]: optionId }
  timeSpentSecs: number;
}

export interface QuestionReviewItem {
  questionId: string;
  prompt: string;
  codeSnippet?: string | null;
  explanation: string;
  selectedOptionId: string | null;
  correctOptionId: string;
  isCorrect: boolean;
  pointsEarned: number;
  maxPoints: number;
  options: Array<{
    id: string;
    text: string;
    isCorrect: boolean;
  }>;
}

export interface QuizResultResponse {
  quizId: string;
  slug: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  passingScore: number;
  xpAwarded: number;
  timeSpentSecs: number;
  review: QuestionReviewItem[];
}

export interface QuizAttemptRecord {
  id: string;
  quizId: string;
  score: number;
  maxScore: number;
  percentage: number;
  passed: boolean;
  timeSpentSecs: number;
  xpAwarded: number;
  completedAt: string;
}

// Phase 9: Community Forums & Knowledge Base Interfaces
export interface ForumCategoryItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  iconName: string;
  orderIndex: number;
  threadsCount: number;
}

export interface ForumThreadItem {
  id: string;
  slug: string;
  title: string;
  preview: string;
  categorySlug: string;
  categoryName?: string;
  authorName: string;
  authorRank?: string;
  upvotesCount: number;
  repliesCount: number;
  viewsCount: number;
  isPinned: boolean;
  isLocked: boolean;
  status: 'PENDING' | 'APPROVED' | 'HIDDEN';
  createdAt: string;
  updatedAt: string;
}

export interface ForumReplyItem {
  id: string;
  threadId: string;
  authorName: string;
  authorRank?: string;
  content: string;
  upvotesCount: number;
  isAcceptedAnswer: boolean;
  createdAt: string;
  isOwn?: boolean;
  hasVoted?: boolean;
}

export interface ForumThreadDetail extends ForumThreadItem {
  content: string;
  replies: ForumReplyItem[];
  isOwn?: boolean;
  hasVoted?: boolean;
}

export interface CreateThreadPayload {
  title: string;
  content: string;
  categorySlug: string;
}

export interface CreateReplyPayload {
  content: string;
}

export interface KnowledgeArticleSummary {
  id: string;
  slug: string;
  title: string;
  summary: string;
  categorySlug: string;
  tags: string[];
  difficulty: DifficultyLevel;
  readTimeMinutes: number;
  authorName: string;
  viewsCount: number;
  helpfulVotesCount: number;
  isFeatured: boolean;
  publishedAt: string;
}

export interface KnowledgeArticleDetail extends KnowledgeArticleSummary {
  content: string;
  hasVotedHelpful?: boolean;
  relatedArticles?: KnowledgeArticleSummary[];
}

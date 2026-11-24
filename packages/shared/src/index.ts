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


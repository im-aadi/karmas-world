export type LearningPath = {
  number: string
  title: string
  description: string
  level: string
  color: 'mint' | 'blue' | 'violet'
  icon: string
}

export const learningPaths: LearningPath[] = [
  {
    number: '01',
    title: 'Cybersecurity foundations',
    description: 'Build a strong base in digital safety, computer architecture, threats, and security thinking.',
    level: 'BEGINNER',
    color: 'mint',
    icon: '◈',
  },
  {
    number: '02',
    title: 'Network defense',
    description: 'Understand how devices communicate, inspect packets with Wireshark, and notice unusual activity.',
    level: 'BEGINNER → INTERMEDIATE',
    color: 'blue',
    icon: '⌁',
  },
  {
    number: '03',
    title: 'Web security',
    description: 'Explore common web risks, OWASP Top 10 vulnerabilities, and safe server-side validation practices.',
    level: 'INTERMEDIATE',
    color: 'violet',
    icon: '⌘',
  },
  {
    number: '04',
    title: 'Applied cryptography & cloud',
    description: 'Master AES-GCM, Diffie-Hellman key exchange, PKI certificates, and AWS/Azure/GCP IAM least privilege.',
    level: 'INTERMEDIATE',
    color: 'mint',
    icon: '🔒',
  },
  {
    number: '05',
    title: 'SOC operations & detection',
    description: 'Investigate enterprise incidents, triage false positives, author Sigma rules, and build SIEM queries.',
    level: 'INTERMEDIATE → ADVANCED',
    color: 'blue',
    icon: '⚡',
  },
  {
    number: '06',
    title: 'Forensics & malware analysis',
    description: 'Conduct bit-stream disk imaging, analyze volatile RAM with Volatility, and deconstruct Portable Executable binaries.',
    level: 'ADVANCED → EXPERT',
    color: 'violet',
    icon: '☣',
  },
]

export type LearningPath = {
  number: string
  title: string
  description: string
  level: string
  color: 'mint' | 'blue' | 'violet'
  icon: string
}

export const learningPaths: LearningPath[] = [
  { number: '01', title: 'Cybersecurity foundations', description: 'Build a strong base in digital safety, threats, and security thinking.', level: 'BEGINNER', color: 'mint', icon: '◈' },
  { number: '02', title: 'Network defense', description: 'Understand how networks work and learn to spot suspicious activity.', level: 'BEGINNER → INTERMEDIATE', color: 'blue', icon: '⌁' },
  { number: '03', title: 'Web security', description: 'Explore common web risks through safe, guided practice environments.', level: 'INTERMEDIATE', color: 'violet', icon: '⌘' },
]

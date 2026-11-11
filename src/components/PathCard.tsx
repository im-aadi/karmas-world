import { ArrowUpRight } from 'lucide-react'
import type { LearningPath } from '../data/paths'

export function PathCard({ path }: { path: LearningPath }) {
  return <a className={`path-card ${path.color}`} href="#academy">
    <div className="card-top"><span className="path-number">PATH / {path.number}</span><span className="path-icon" aria-hidden="true">{path.icon}</span></div>
    <h3>{path.title}</h3><p>{path.description}</p>
    <div className="card-bottom"><span>{path.level}</span><span>EXPLORE PATH <ArrowUpRight size={15} /></span></div>
  </a>
}

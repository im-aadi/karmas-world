import { useMemo, useState } from 'react'
import { ArrowRight, BookOpenCheck, Search } from 'lucide-react'
import { courses } from '../data/courses'
import { glossaryTerms, type GlossaryCategory } from '../data/glossary'
import '../styles/glossary.css'

type CategoryFilter = 'ALL' | GlossaryCategory
type Props = { onOpenLesson: (courseId: string, lessonIndex: number) => void }

const categories: CategoryFilter[] = ['ALL', 'FOUNDATIONS', 'NETWORKS', 'WEB SECURITY']

export function Glossary({ onOpenLesson }: Props) {
  const [query, setQuery] = useState('')
  const [category, setCategory] = useState<CategoryFilter>('ALL')
  const visibleTerms = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()
    return glossaryTerms.filter(item => {
      const matchesCategory = category === 'ALL' || item.category === category
      const searchable = `${item.term} ${item.category} ${item.definition} ${item.example}`.toLocaleLowerCase()
      return matchesCategory && (!normalizedQuery || searchable.includes(normalizedQuery))
    })
  }, [category, query])

  return <section id="glossary" className="glossary-section">
    <div className="wrap">
      <div className="glossary-heading">
        <div><div className="eyebrow"><span className="eyebrow-line" /> PHASE 21 / CYBERSECURITY GLOSSARY</div><h2>Small words.<br /><span>Big picture.</span></h2></div>
        <p>Look up a term in plain language, see how it shows up in everyday life, then open the lesson that explains it.</p>
      </div>
      <div className="glossary-tools">
        <label className="glossary-search"><Search size={17} /><span className="sr-only">Search glossary terms</span><input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Search terms like phishing or DNS" /></label>
        <div className="glossary-filters" role="group" aria-label="Filter glossary by topic">
          {categories.map(item => <button key={item} type="button" className={category === item ? 'glossary-filter active' : 'glossary-filter'} aria-pressed={category === item} onClick={() => setCategory(item)}>{item === 'ALL' ? 'All topics' : item === 'NETWORKS' ? 'Networks' : item === 'WEB SECURITY' ? 'Web security' : 'Foundations'}</button>)}
        </div>
        <p className="glossary-count" aria-live="polite">Showing {visibleTerms.length} of {glossaryTerms.length} terms</p>
      </div>
      {visibleTerms.length ? <div className="glossary-grid">
        {visibleTerms.map(item => {
          const course = courses.find(candidate => candidate.id === item.courseId)
          const lesson = course?.lessons[item.lessonIndex]
          return <article className="glossary-card" key={item.term}>
            <div className="glossary-card-meta"><span>{item.category}</span><BookOpenCheck size={16} aria-hidden="true" /></div>
            <h3>{item.term}</h3>
            <p>{item.definition}</p>
            <div className="glossary-example"><span>IN CONTEXT</span><p>{item.example}</p></div>
            {course && lesson && <button className="glossary-lesson-link" type="button" onClick={() => onOpenLesson(item.courseId, item.lessonIndex)}><span>Open lesson: {lesson.title}</span><ArrowRight size={14} /></button>}
          </article>
        })}
      </div> : <div className="glossary-empty"><Search size={20} /><p>No terms match that search. Try another word or choose a different topic.</p></div>}
    </div>
  </section>
}

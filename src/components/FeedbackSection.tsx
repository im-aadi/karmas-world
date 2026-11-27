import { useState } from 'react'
import {
  Bug,
  CheckCircle2,
  ExternalLink,
  Github,
  Heart,
  Lightbulb,
  Linkedin,
  Mail,
  MessageSquare,
  Send,
  Sparkles,
  Star,
  ThumbsUp,
  Wrench
} from 'lucide-react'
import type { LearnerAccount } from '../data/account'
import {
  defaultRoadmapItems,
  getSavedFeedbacks,
  submitUserFeedback,
  type FeedbackCategory,
  type UserFeedback
} from '../data/feedback'
import '../styles/feedback.css'

type Props = {
  account: LearnerAccount | null
}

const CATEGORIES: { id: FeedbackCategory; label: string; icon: typeof Bug; desc: string }[] = [
  { id: 'bug', label: 'Bug / Issue', icon: Bug, desc: 'Broken exercise, glitch, or typo' },
  { id: 'feature', label: 'Feature Idea', icon: Lightbulb, desc: 'Simulator, visualizer, or tool' },
  { id: 'course', label: 'Course Topic', icon: Sparkles, desc: 'Cybersecurity area to add' },
  { id: 'improvement', label: 'Improvement', icon: Wrench, desc: 'UI, responsiveness, or clarity' },
  { id: 'general', label: 'General / Praise', icon: Heart, desc: 'Thoughts, questions, or message' },
]

export function FeedbackSection({ account }: Props) {
  const [category, setCategory] = useState<FeedbackCategory>('feature')
  const [title, setTitle] = useState('')
  const [message, setMessage] = useState('')
  const [name, setName] = useState(account?.displayName || '')
  const [email, setEmail] = useState(account?.email || '')
  const [rating, setRating] = useState<number>(5)
  const [hoverRating, setHoverRating] = useState<number | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [submittedFeedback, setSubmittedFeedback] = useState<UserFeedback | null>(null)
  const [history, setHistory] = useState<UserFeedback[]>(() => getSavedFeedbacks())
  const [roadmaps, setRoadmaps] = useState(defaultRoadmapItems)
  const [votedItems, setVotedItems] = useState<Record<string, boolean>>({})

  const handleVote = (id: string) => {
    if (votedItems[id]) return
    setVotedItems(prev => ({ ...prev, [id]: true }))
    setRoadmaps(prev =>
      prev.map(item => (item.id === id ? { ...item, votes: item.votes + 1 } : item))
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title.trim() || !message.trim()) return

    setIsSubmitting(true)
    try {
      const created = await submitUserFeedback({
        category,
        title,
        message,
        name: name || undefined,
        email: email || undefined,
        rating
      })
      setSubmittedFeedback(created)
      setHistory(prev => [created, ...prev])
      setTitle('')
      setMessage('')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <section id="feedback" className="feedback-section wrap">
      {/* Header */}
      <div className="feedback-header">
        <div className="eyebrow">
          <span className="eyebrow-line" /> COMMUNITY ROADMAP & FEEDBACK
        </div>
        <h2>
          Shape the Future of <span className="accent-word">Karma’s World</span>.
        </h2>
        <p className="feedback-subtitle">
          Found a bug? Have an idea for a hands-on simulator or want a specific cybersecurity topic covered?
          Share your feedback directly below or reach out to creator <strong>Aditya Kumar</strong>.
        </p>
      </div>

      {/* Direct Contact Cards */}
      <div className="feedback-contact-grid">
        <div className="contact-card email-card">
          <div className="contact-card-icon">
            <Mail size={22} />
          </div>
          <div className="contact-card-info">
            <span className="contact-label">DIRECT DEVELOPER EMAIL</span>
            <a
              href="mailto:adityakumar748847@gmail.com?subject=[Karma's%20World%20Feedback]"
              className="contact-value email-value"
            >
              adityakumar748847@gmail.com
            </a>
            <p className="contact-desc">
              Direct inbox of Aditya Kumar. Send questions, vulnerability reports, or collaboration requests.
            </p>
          </div>
          <a
            href="mailto:adityakumar748847@gmail.com?subject=[Karma's%20World%20Feedback]"
            className="contact-action-btn"
          >
            Send Email <ExternalLink size={13} />
          </a>
        </div>

        <div className="contact-card social-card">
          <div className="contact-card-icon">
            <Github size={22} />
          </div>
          <div className="contact-card-info">
            <span className="contact-label">GITHUB ISSUES & CODE</span>
            <a
              href="https://github.com/im-aadi/karmas-world"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-value"
            >
              github.com/im-aadi/karmas-world
            </a>
            <p className="contact-desc">
              Open source repository. File an issue, request features, or view recent commits.
            </p>
          </div>
          <div className="contact-links-row">
            <a
              href="https://github.com/im-aadi"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-action-btn mini"
            >
              <Github size={13} /> GitHub Profile
            </a>
            <a
              href="https://www.linkedin.com/in/aditya-kumar-250131263/"
              target="_blank"
              rel="noopener noreferrer"
              className="contact-action-btn mini linkedin"
            >
              <Linkedin size={13} /> LinkedIn
            </a>
          </div>
        </div>
      </div>

      {/* Main Feedback Form & Roadmap Layout */}
      <div className="feedback-layout">
        {/* Feedback Form */}
        <div className="feedback-form-container">
          <div className="form-card-head">
            <div className="form-title-group">
              <MessageSquare size={18} className="mint-icon" />
              <h3>Submit Your Feedback or Idea</h3>
            </div>
            <span className="form-head-badge">Reviewed by Dev Team</span>
          </div>

          {submittedFeedback && (
            <div className="feedback-success-banner" role="alert">
              <CheckCircle2 size={24} className="success-icon" />
              <div>
                <strong>Thank you! Your feedback has been recorded.</strong>
                <p>
                  Ticket ID: <span className="ticket-id">{submittedFeedback.id}</span> · Status: <em>Received</em>
                </p>
                <small>Aditya Kumar and the team will review this to improve Karma’s World.</small>
              </div>
              <button
                type="button"
                className="close-banner-btn"
                onClick={() => setSubmittedFeedback(null)}
              >
                ✕
              </button>
            </div>
          )}

          <form onSubmit={handleSubmit} className="feedback-form">
            {/* Category selection */}
            <div className="form-group">
              <label className="form-label">Feedback Category</label>
              <div className="category-select-grid" role="radiogroup" aria-label="Feedback Category">
                {CATEGORIES.map(cat => {
                  const Icon = cat.icon
                  const isSelected = category === cat.id
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      role="radio"
                      aria-checked={isSelected}
                      className={`category-select-btn ${isSelected ? 'active' : ''}`}
                      onClick={() => setCategory(cat.id)}
                    >
                      <Icon size={16} />
                      <div className="category-btn-text">
                        <span className="cat-title">{cat.label}</span>
                        <span className="cat-desc">{cat.desc}</span>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Subject / Title */}
            <div className="form-group">
              <label htmlFor="fb-title" className="form-label">
                Subject or Title <span className="req">*</span>
              </label>
              <input
                id="fb-title"
                type="text"
                required
                value={title}
                onChange={e => setTitle(e.target.value)}
                placeholder="e.g., Add an active SQLi sandbox or fix mobile quiz text"
                className="form-input"
              />
            </div>

            {/* Description */}
            <div className="form-group">
              <label htmlFor="fb-message" className="form-label">
                Detailed Feedback / Problem / Suggestion <span className="req">*</span>
              </label>
              <textarea
                id="fb-message"
                required
                rows={4}
                value={message}
                onChange={e => setMessage(e.target.value)}
                placeholder="Describe what you experienced, what could be better, or what new lesson you want to learn..."
                className="form-textarea"
              />
            </div>

            {/* User Meta Row (Name, Email, Rating) */}
            <div className="form-meta-row">
              <div className="form-group flex-1">
                <label htmlFor="fb-name" className="form-label">
                  Your Name / Handle <span className="opt">(optional)</span>
                </label>
                <input
                  id="fb-name"
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Anonymous or your username"
                  className="form-input"
                />
              </div>

              <div className="form-group flex-1">
                <label htmlFor="fb-email" className="form-label">
                  Your Email <span className="opt">(for updates)</span>
                </label>
                <input
                  id="fb-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your-email@example.com"
                  className="form-input"
                />
              </div>
            </div>

            {/* Rating Stars */}
            <div className="form-group rating-group">
              <label className="form-label">Experience Rating</label>
              <div className="star-rating-row">
                {[1, 2, 3, 4, 5].map(star => {
                  const filled = (hoverRating ?? rating) >= star
                  return (
                    <button
                      key={star}
                      type="button"
                      className={`star-btn ${filled ? 'filled' : ''}`}
                      onMouseEnter={() => setHoverRating(star)}
                      onMouseLeave={() => setHoverRating(null)}
                      onClick={() => setRating(star)}
                      aria-label={`${star} star`}
                    >
                      <Star size={18} fill={filled ? '#b8f27e' : 'none'} />
                    </button>
                  )
                })}
                <span className="rating-label">
                  {rating === 5 ? 'Exceptional (5/5)' : rating === 4 ? 'Great (4/5)' : rating === 3 ? 'Good (3/5)' : rating === 2 ? 'Needs Work (2/5)' : 'Poor (1/5)'}
                </span>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !title.trim() || !message.trim()}
              className="button-primary submit-feedback-btn"
            >
              {isSubmitting ? (
                <>Sending Feedback...</>
              ) : (
                <>
                  <Send size={15} /> Send Feedback to Dev Team
                </>
              )}
            </button>
          </form>

          {/* User's recent local tickets */}
          {history.length > 0 && (
            <div className="user-history-box">
              <h4>Your Submitted Feedback & Tickets ({history.length})</h4>
              <div className="history-list">
                {history.slice(0, 4).map(item => (
                  <div key={item.id} className="history-item">
                    <div className="history-item-top">
                      <span className="history-ticket">{item.id}</span>
                      <span className={`status-pill ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                        {item.status}
                      </span>
                    </div>
                    <strong className="history-title">{item.title}</strong>
                    <p className="history-snippet">{item.message}</p>
                    <span className="history-time">
                      {new Date(item.timestamp).toLocaleDateString()} at{' '}
                      {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Development Roadmap & Solved Issues */}
        <div className="roadmap-container">
          <div className="roadmap-card-head">
            <div className="form-title-group">
              <Sparkles size={18} className="mint-icon" />
              <h3>Community Development Roadmap</h3>
            </div>
            <span className="form-head-badge mint">Active Backlog</span>
          </div>
          <p className="roadmap-intro">
            See what we have solved and vote on what features should be developed next in Karma’s World.
          </p>

          <div className="roadmap-cards-list">
            {roadmaps.map(item => {
              const hasVoted = !!votedItems[item.id]
              return (
                <div key={item.id} className="roadmap-item-card">
                  <div className="roadmap-item-header">
                    <span className={`roadmap-status-badge ${item.status.toLowerCase().replace(/\s+/g, '-')}`}>
                      {item.status}
                    </span>
                    <button
                      type="button"
                      className={`upvote-btn ${hasVoted ? 'voted' : ''}`}
                      onClick={() => handleVote(item.id)}
                      title="Vote for this feature"
                    >
                      <ThumbsUp size={13} />
                      <span>{item.votes}</span>
                    </button>
                  </div>
                  <h4 className="roadmap-item-title">{item.title}</h4>
                  <p className="roadmap-item-desc">{item.description}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

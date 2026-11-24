import { useState, useEffect } from 'react'
import {
  Terminal,
  Search,
  Clock,
  Award,
  Lock,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Layers,
  HardDrive,
  Globe,
  Radio,
} from 'lucide-react'
import { fetchLabs, type LabSummary } from '../../data/labClient'
import { LabWorkspace } from './LabWorkspace'

interface LabCatalogProps {
  csrfToken?: string
  onXpEarned?: (amount: number) => void
}

export function LabCatalog({ csrfToken, onXpEarned }: LabCatalogProps) {
  const [labs, setLabs] = useState<LabSummary[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<'ALL' | 'BEGINNER' | 'INTERMEDIATE' | 'ADVANCED'>('ALL')
  const [selectedLabSlug, setSelectedLabSlug] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    async function load() {
      setLoading(true)
      const data = await fetchLabs({
        difficulty: difficultyFilter !== 'ALL' ? difficultyFilter : undefined,
        q: searchQuery || undefined,
      })
      if (active) {
        setLabs(data)
        setLoading(false)
      }
    }
    void load()
    return () => {
      active = false
    }
  }, [difficultyFilter, searchQuery])

  function getLabTypeIcon(type: string) {
    switch (type) {
      case 'linux-cli':
        return <Terminal size={16} className="text-emerald-400" />
      case 'packet-analysis':
        return <Radio size={16} className="text-cyan-400" />
      case 'sqli-sandbox':
        return <Layers size={16} className="text-amber-400" />
      case 'cryptography':
        return <Lock size={16} className="text-purple-400" />
      case 'digital-forensics':
        return <HardDrive size={16} className="text-red-400" />
      case 'osint-recon':
        return <Globe size={16} className="text-blue-400" />
      default:
        return <Terminal size={16} className="text-zinc-400" />
    }
  }

  return (
    <section id="labs" className="lab-catalog-section" aria-labelledby="lab-catalog-title">
      <div className="wrap">
        {/* Section Heading */}
        <div className="academy-heading">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" />
              <span>PHASE 05 / PRACTICAL CYBERSECURITY LABS</span>
            </div>
            <h2 id="lab-catalog-title">
              Hands-on labs in<br />
              <span>contained workspaces.</span>
            </h2>
          </div>
          <p>
            Experience realistic offensive and defensive scenarios safely in your browser. From Linux CLI hunting to
            packet analysis, SQL injection demonstrations, and incident forensics.
          </p>
        </div>

        {/* Safety Disclaimer Banner */}
        <div className="lab-disclaimer">
          <Lock size={15} />
          <span>
            <strong>AUTHORIZED SIMULATED SANDBOX</strong> / Labs run in safe browser-only environments. Never connects to
            external targets or exposes host machines.
          </span>
        </div>

        {/* Search & Filter Controls */}
        <div className="catalog-controls">
          <div className="catalog-search-wrapper">
            <Search size={16} className="catalog-search-icon" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search practical labs (e.g. Linux, Wireshark, SQLi, Forensics)..."
              className="catalog-search-input"
              aria-label="Search practical labs"
            />
          </div>

          <div className="catalog-difficulty-filters">
            {(['ALL', 'BEGINNER', 'INTERMEDIATE', 'ADVANCED'] as const).map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => setDifficultyFilter(lvl)}
                className={`catalog-filter-btn ${difficultyFilter === lvl ? 'active' : ''}`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Labs Grid */}
        <div className="lab-catalog-grid">
          {labs.map((lab) => {
            const isCompleted = lab.attempt.status === 'COMPLETED'
            const inProgress = lab.attempt.completedTasks.length > 0 && !isCompleted

            return (
              <div key={lab.id} className="lab-card">
                <div className="lab-card-top">
                  <div className="lab-type-icon-wrapper">
                    {getLabTypeIcon(lab.type)}
                  </div>
                  <div className="flex gap-1.5 flex-wrap">
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300">
                      {lab.difficulty}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950/80 text-cyan-300 border border-cyan-800/60">
                      {lab.categorySlug}
                    </span>
                  </div>
                </div>

                <h3 className="lab-card-title">{lab.title}</h3>
                <p className="lab-card-description">{lab.description}</p>

                <div className="lab-card-meta">
                  <span className="flex items-center gap-1 font-mono text-zinc-400">
                    <Clock size={13} /> {lab.duration}
                  </span>
                  <span className="flex items-center gap-1 font-mono text-amber-400">
                    <Award size={13} /> +{lab.xpReward + lab.totalPoints} XP
                  </span>
                  <span className="flex items-center gap-1 font-mono text-cyan-400">
                    <ShieldCheck size={13} /> {lab.totalTasks} Tasks
                  </span>
                </div>

                <div className="lab-card-footer">
                  {isCompleted ? (
                    <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold font-mono">
                      <CheckCircle2 size={15} />
                      <span>COMPLETED</span>
                    </div>
                  ) : inProgress ? (
                    <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-mono">
                      <span>In Progress ({lab.attempt.completedTasks.length}/{lab.totalTasks})</span>
                    </div>
                  ) : (
                    <span className="text-xs text-zinc-500 font-mono">Ready to Launch</span>
                  )}

                  <button
                    type="button"
                    onClick={() => setSelectedLabSlug(lab.slug)}
                    className="lab-launch-btn"
                  >
                    <span>{isCompleted ? 'Review Lab' : inProgress ? 'Continue' : 'Launch Lab'}</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {labs.length === 0 && !loading && (
          <div className="text-center py-12 text-zinc-400 font-mono text-sm">
            No cybersecurity labs found matching the selected filters.
          </div>
        )}
      </div>

      {/* Active Lab Workspace Modal */}
      {selectedLabSlug && (
        <LabWorkspace
          labSlug={selectedLabSlug}
          csrfToken={csrfToken}
          onClose={() => setSelectedLabSlug(null)}
          onCompleted={(_slug, xp) => {
            onXpEarned?.(xp)
            // Reload list to update status
            void fetchLabs().then(setLabs)
          }}
        />
      )}
    </section>
  )
}

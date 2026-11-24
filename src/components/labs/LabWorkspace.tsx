import { useState, useEffect, type FormEvent } from 'react'
import {
  X,
  RotateCcw,
  CheckCircle2,
  Lightbulb,
  Award,
  Clock,
  Shield,
  HelpCircle,
  Sparkles,
  Terminal,
} from 'lucide-react'
import type { DetailedLabTask } from '../../data/labs'
import { CURATED_LABS } from '../../data/labs'
import { verifyLabFlag, resetLabWorkspace, startLabAttempt } from '../../data/labClient'
import { LinuxTerminalSim } from './simulators/LinuxTerminalSim'
import { PacketInspectorSim } from './simulators/PacketInspectorSim'
import { SqlInjectionSandbox } from './simulators/SqlInjectionSandbox'
import { CryptoWorkbenchSim } from './simulators/CryptoWorkbenchSim'
import { ForensicsLogSim } from './simulators/ForensicsLogSim'
import { OsintReconSim } from './simulators/OsintReconSim'

interface LabWorkspaceProps {
  labSlug: string
  csrfToken?: string
  onClose: () => void
  onCompleted?: (slug: string, earnedXp: number) => void
}

export function LabWorkspace({ labSlug, csrfToken, onClose, onCompleted }: LabWorkspaceProps) {
  const lab = CURATED_LABS.find((l) => l.slug === labSlug) || CURATED_LABS[0]

  const [activeTab, setActiveTab] = useState<'tasks' | 'scenario'>('tasks')
  const [completedTasks, setCompletedTasks] = useState<string[]>([])
  const [taskInputs, setTaskInputs] = useState<Record<string, string>>({})
  const [revealedHints, setRevealedHints] = useState<Record<string, boolean>>({})
  const [verificationFeedback, setVerificationFeedback] = useState<{
    taskId: string
    success: boolean
    message: string
  } | null>(null)
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({})

  useEffect(() => {
    void startLabAttempt(lab.slug, csrfToken)
    try {
      const stored = localStorage.getItem('kw_local_lab_attempts_v1')
      if (stored) {
        const parsed = JSON.parse(stored)
        if (parsed[lab.slug]?.completedTasks) {
          setCompletedTasks(parsed[lab.slug].completedTasks)
        }
      }
    } catch {
      // Local storage unreadable
    }
  }, [lab.slug, csrfToken])

  async function handleFlagSubmit(e: FormEvent, task: DetailedLabTask) {
    e.preventDefault()
    const entered = (taskInputs[task.id] || '').trim()
    if (!entered) return

    setSubmitting((prev) => ({ ...prev, [task.id]: true }))
    setVerificationFeedback(null)

    try {
      const result = await verifyLabFlag(lab.slug, task.id, entered, csrfToken)
      setVerificationFeedback({
        taskId: task.id,
        success: result.success,
        message: result.message,
      })

      if (result.success && !completedTasks.includes(task.id)) {
        const nextCompleted = [...completedTasks, task.id]
        setCompletedTasks(nextCompleted)
        onCompleted?.(lab.slug, result.pointsEarned || task.points)
      }
    } catch {
      setVerificationFeedback({
        taskId: task.id,
        success: false,
        message: 'Could not connect to validation server. Please try again.',
      })
    } finally {
      setSubmitting((prev) => ({ ...prev, [task.id]: false }))
    }
  }

  async function handleReset() {
    if (confirm('Reset your progress and flag submissions for this lab workspace?')) {
      await resetLabWorkspace(lab.slug, csrfToken)
      setCompletedTasks([])
      setTaskInputs({})
      setVerificationFeedback(null)
    }
  }

  function toggleHint(taskId: string) {
    setRevealedHints((prev) => ({ ...prev, [taskId]: !prev[taskId] }))
  }

  // Calculate earned score
  const earnedXp = lab.tasks
    .filter((t) => completedTasks.includes(t.id))
    .reduce((sum, t) => sum + t.points, 0)
  const isAllDone = completedTasks.length >= lab.tasks.length

  return (
    <div className="lab-workspace-overlay" role="dialog" aria-modal="true" aria-label={`Lab: ${lab.title}`}>
      {/* Workspace Top Header Bar */}
      <header className="workspace-top-bar">
        <div className="flex items-center gap-3">
          <div className="p-1.5 rounded-md bg-cyan-950/80 border border-cyan-800/80 text-cyan-400">
            <Terminal size={18} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-zinc-100">{lab.title}</h2>
              <span className="px-2 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-zinc-300">
                {lab.difficulty}
              </span>
              <span className="hidden sm:inline-block px-2 py-0.5 rounded text-[11px] font-mono bg-cyan-950 text-cyan-300 border border-cyan-800">
                {lab.category}
              </span>
            </div>
            <div className="flex items-center gap-3 text-xs text-zinc-400 mt-0.5">
              <span className="flex items-center gap-1 font-mono">
                <Clock size={12} /> {lab.duration}
              </span>
              <span className="flex items-center gap-1 font-mono text-amber-400">
                <Award size={12} /> {earnedXp} / {lab.xpReward + lab.tasks.reduce((s, t) => s + t.points, 0)} XP
              </span>
              <span className="flex items-center gap-1 font-mono text-emerald-400">
                <CheckCircle2 size={12} /> {completedTasks.length}/{lab.tasks.length} Tasks
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleReset}
            className="workspace-header-btn"
            title="Reset workspace progress"
          >
            <RotateCcw size={14} />
            <span className="hidden sm:inline">Reset</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="workspace-header-btn close-btn"
            aria-label="Close lab workspace"
          >
            <X size={16} />
            <span className="hidden sm:inline">Exit Lab</span>
          </button>
        </div>
      </header>

      {/* Main Workspace Split Body */}
      <div className="workspace-body-split">
        {/* Left Side: Tasks & Scenario Briefing */}
        <aside className="workspace-left-pane">
          <div className="left-pane-tabs">
            <button
              type="button"
              onClick={() => setActiveTab('tasks')}
              className={`pane-tab ${activeTab === 'tasks' ? 'active' : ''}`}
            >
              <span>Practical Tasks ({completedTasks.length}/{lab.tasks.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('scenario')}
              className={`pane-tab ${activeTab === 'scenario' ? 'active' : ''}`}
            >
              <span>Scenario & Objectives</span>
            </button>
          </div>

          <div className="left-pane-content">
            {activeTab === 'tasks' ? (
              <div className="tasks-container">
                {isAllDone && (
                  <div className="p-3 mb-4 rounded-lg bg-emerald-950/80 border border-emerald-500/50 flex items-start gap-2.5">
                    <Sparkles size={18} className="text-emerald-400 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-emerald-300">All Lab Objectives Conquered!</h4>
                      <p className="text-[11px] text-zinc-300 mt-0.5">
                        You successfully discovered all flags and earned full XP rewards for this practical lab.
                      </p>
                    </div>
                  </div>
                )}

                {lab.tasks.map((task, idx) => {
                  const isDone = completedTasks.includes(task.id)
                  const isHintOpen = revealedHints[task.id]
                  const isSubmitting = submitting[task.id]
                  const feedback = verificationFeedback?.taskId === task.id ? verificationFeedback : null

                  return (
                    <div
                      key={task.id}
                      className={`task-card ${isDone ? 'task-completed' : ''}`}
                    >
                      <div className="task-card-header">
                        <div className="flex items-center gap-2">
                          <span className={`task-number-badge ${isDone ? 'done' : ''}`}>
                            {isDone ? '✓' : idx + 1}
                          </span>
                          <h4 className="text-xs font-semibold text-zinc-200">{task.title}</h4>
                        </div>
                        <span className="task-points-badge font-mono text-[11px]">
                          +{task.points} XP
                        </span>
                      </div>

                      <p className="task-instruction text-xs text-zinc-300 mt-2">
                        {task.instruction}
                      </p>

                      {/* Hint Reveal Section */}
                      <div className="task-hint-wrapper">
                        <button
                          type="button"
                          onClick={() => toggleHint(task.id)}
                          className="hint-toggle-btn"
                        >
                          <Lightbulb size={12} className={isHintOpen ? 'text-amber-400' : 'text-zinc-500'} />
                          <span>{isHintOpen ? 'Hide Hint' : 'Need a Hint?'}</span>
                        </button>
                        {isHintOpen && (
                          <div className="hint-box">
                            <span className="text-amber-400 font-semibold mr-1">Hint:</span>
                            {task.hint}
                          </div>
                        )}
                      </div>

                      {/* Flag Submission Form */}
                      <form onSubmit={(e) => handleFlagSubmit(e, task)} className="flag-form mt-3">
                        <div className="flag-input-group">
                          <input
                            type="text"
                            value={taskInputs[task.id] || ''}
                            onChange={(e) =>
                              setTaskInputs((prev) => ({ ...prev, [task.id]: e.target.value }))
                            }
                            placeholder={isDone ? 'Task Solved' : task.flagFormat}
                            disabled={isDone || isSubmitting}
                            className="flag-input font-mono text-xs"
                            spellCheck={false}
                          />
                          <button
                            type="submit"
                            disabled={isDone || isSubmitting || !(taskInputs[task.id] || '').trim()}
                            className="flag-submit-btn"
                          >
                            {isDone ? 'Solved' : isSubmitting ? 'Checking...' : 'Submit Flag'}
                          </button>
                        </div>
                      </form>

                      {/* Instant Feedback Message */}
                      {feedback && (
                        <div
                          className={`task-feedback-banner ${
                            feedback.success ? 'feedback-success' : 'feedback-error'
                          }`}
                        >
                          {feedback.success ? (
                            <CheckCircle2 size={13} className="shrink-0" />
                          ) : (
                            <HelpCircle size={13} className="shrink-0" />
                          )}
                          <span>{feedback.message}</span>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="scenario-container text-xs text-zinc-300 space-y-4">
                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                  <h4 className="font-semibold text-zinc-200 mb-1 flex items-center gap-1.5">
                    <Shield size={14} className="text-cyan-400" />
                    <span>Scenario Briefing</span>
                  </h4>
                  <p className="leading-relaxed text-zinc-400">{lab.scenarioDescription}</p>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                  <h4 className="font-semibold text-zinc-200 mb-1">Target Environment</h4>
                  <p className="font-mono text-cyan-300 text-xs">{lab.targetEnvironment}</p>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                  <h4 className="font-semibold text-zinc-200 mb-2">Learning Objectives</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-zinc-400">
                    {lab.objectives.map((obj: string, i: number) => (
                      <li key={i}>{obj}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-lg">
                  <h4 className="font-semibold text-zinc-200 mb-2">Prerequisites</h4>
                  <ul className="space-y-1.5 list-disc list-inside text-zinc-400">
                    {lab.prerequisites.map((prereq: string, i: number) => (
                      <li key={i}>{prereq}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* Right Side: Active Interactive Simulation */}
        <main className="workspace-right-pane" aria-label="Interactive Simulator Area">
          {lab.type === 'linux-cli' && (
            <LinuxTerminalSim files={lab.simulatedData?.terminalFiles} />
          )}

          {lab.type === 'packet-analysis' && (
            <PacketInspectorSim packets={lab.simulatedData?.packets} />
          )}

          {lab.type === 'sqli-sandbox' && (
            <SqlInjectionSandbox context={lab.simulatedData?.sqlVulnerableContext} />
          )}

          {lab.type === 'cryptography' && (
            <CryptoWorkbenchSim challenge={lab.simulatedData?.cryptoChallenge} />
          )}

          {lab.type === 'digital-forensics' && (
            <ForensicsLogSim logs={lab.simulatedData?.forensicsLogs} />
          )}

          {lab.type === 'osint-recon' && (
            <OsintReconSim osintData={lab.simulatedData?.osintRecords} />
          )}
        </main>
      </div>
    </div>
  )
}

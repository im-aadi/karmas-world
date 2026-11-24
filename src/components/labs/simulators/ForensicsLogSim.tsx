import { useState } from 'react'
import { ShieldAlert, Search, HardDrive } from 'lucide-react'

interface LogEntry {
  id: number
  timestamp: string
  service: string
  message: string
  level: 'INFO' | 'WARN' | 'ALERT'
}

interface ForensicsLogSimProps {
  logs?: LogEntry[]
}

export function ForensicsLogSim({ logs = [] }: ForensicsLogSimProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedLevel, setSelectedLevel] = useState<'ALL' | 'INFO' | 'WARN' | 'ALERT'>('ALL')
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(logs[0] || null)

  const filteredLogs = logs.filter((l) => {
    if (selectedLevel !== 'ALL' && l.level !== selectedLevel) return false
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      l.message.toLowerCase().includes(term) ||
      l.service.toLowerCase().includes(term) ||
      l.timestamp.toLowerCase().includes(term)
    )
  })

  return (
    <div className="forensics-log-container">
      {/* Top Search & Filter Toolbar */}
      <div className="forensics-toolbar">
        <div className="search-box">
          <Search size={14} className="text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search SIEM logs (e.g. 198.51.100.23, shadow.php, cron)..."
            className="forensics-input"
          />
        </div>

        <div className="level-filters">
          {(['ALL', 'INFO', 'WARN', 'ALERT'] as const).map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setSelectedLevel(lvl)}
              className={`lvl-btn ${selectedLevel === lvl ? 'active' : ''} ${lvl.toLowerCase()}`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      {/* Main Split Layout: Timeline Table & Inspector */}
      <div className="forensics-layout">
        {/* Log Entries Table */}
        <div className="log-table-wrapper">
          <table className="log-table">
            <thead>
              <tr>
                <th className="w-16">Level</th>
                <th className="w-40">Timestamp</th>
                <th className="w-28">Service</th>
                <th>Message Payload</th>
              </tr>
            </thead>
            <tbody>
              {filteredLogs.map((log) => {
                const isSelected = selectedLog?.id === log.id
                let badgeClass = 'badge-info'
                if (log.level === 'WARN') badgeClass = 'badge-warn'
                if (log.level === 'ALERT') badgeClass = 'badge-alert'

                return (
                  <tr
                    key={log.id}
                    onClick={() => setSelectedLog(log)}
                    className={`log-row ${isSelected ? 'selected' : ''}`}
                  >
                    <td>
                      <span className={`log-badge ${badgeClass}`}>{log.level}</span>
                    </td>
                    <td className="font-mono text-zinc-400 text-xs">{log.timestamp}</td>
                    <td className="font-mono text-cyan-300 text-xs">{log.service}</td>
                    <td className="font-mono text-xs text-zinc-200 truncate max-w-sm">{log.message}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Selected Log Details & Forensic Analysis Drawer */}
        {selectedLog && (
          <div className="log-inspector">
            <div className="inspector-header">
              <HardDrive size={14} className="text-cyan-400" />
              <span>Event #{selectedLog.id} Forensic Breakdown</span>
            </div>

            <div className="inspector-body">
              <div className="mb-3">
                <span className="text-zinc-500 text-xs block">Source Timestamp:</span>
                <span className="font-mono text-xs text-zinc-200">{selectedLog.timestamp}</span>
              </div>

              <div className="mb-3">
                <span className="text-zinc-500 text-xs block">Service / Daemon:</span>
                <span className="font-mono text-xs text-cyan-300">{selectedLog.service}</span>
              </div>

              <div className="mb-4">
                <span className="text-zinc-500 text-xs block mb-1">Full Raw Log Message:</span>
                <div className="p-3 bg-zinc-950 rounded border border-zinc-800 font-mono text-xs text-zinc-300 whitespace-pre-wrap break-all select-all">
                  {selectedLog.message}
                </div>
              </div>

              {selectedLog.message.includes('KW{') && (
                <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 rounded">
                  <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-1">
                    <ShieldAlert size={14} />
                    <span>Evidence Flag Located in Log Stream!</span>
                  </div>
                  <p className="text-[11px] text-zinc-300">
                    Submit this token to complete your incident response investigation task.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

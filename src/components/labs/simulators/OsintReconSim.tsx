import { useState } from 'react'
import { Globe, Database, FileText } from 'lucide-react'

interface OsintReconSimProps {
  osintData?: {
    domain: string
    records: Array<{ type: string; host: string; value: string; ttl: number }>
    whois: Record<string, string>
  }
}

export function OsintReconSim({ osintData }: OsintReconSimProps) {
  const [activeTab, setActiveTab] = useState<'dns' | 'subdomains' | 'whois'>('dns')
  const [searchTarget, setSearchTarget] = useState(osintData?.domain || 'insecure-corp.karmas.world')
  const [recordFilter, setRecordFilter] = useState<'ALL' | 'A' | 'MX' | 'TXT' | 'NS'>('ALL')

  const domain = osintData?.domain || 'insecure-corp.karmas.world'
  const records = osintData?.records || []
  const whois = osintData?.whois || {}

  const filteredRecords = records.filter((r) => {
    if (recordFilter === 'ALL') return true
    return r.type === recordFilter
  })

  const subdomains = records.filter((r) => r.type === 'A' && r.host !== domain)

  return (
    <div className="osint-recon-container">
      {/* Target Domain Bar */}
      <div className="osint-target-bar">
        <Globe size={16} className="text-cyan-400" />
        <span className="text-xs font-mono text-zinc-400">Target Domain:</span>
        <input
          type="text"
          value={searchTarget}
          onChange={(e) => setSearchTarget(e.target.value)}
          className="osint-input font-mono text-xs"
          placeholder="target domain..."
        />
        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 font-mono">
          PASSIVE RECON ONLY
        </span>
      </div>

      {/* Tabs */}
      <div className="osint-tabs">
        <button
          type="button"
          onClick={() => setActiveTab('dns')}
          className={`osint-tab ${activeTab === 'dns' ? 'active' : ''}`}
        >
          <Database size={14} />
          <span>DNS Records ({records.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('subdomains')}
          className={`osint-tab ${activeTab === 'subdomains' ? 'active' : ''}`}
        >
          <Globe size={14} />
          <span>Subdomain Discovery ({subdomains.length})</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('whois')}
          className={`osint-tab ${activeTab === 'whois' ? 'active' : ''}`}
        >
          <FileText size={14} />
          <span>WHOIS Registration</span>
        </button>
      </div>

      {activeTab === 'dns' && (
        <div className="osint-tab-pane">
          {/* Record type filter pills */}
          <div className="flex gap-2 mb-3">
            {(['ALL', 'A', 'MX', 'TXT', 'NS'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setRecordFilter(t)}
                className={`px-2 py-1 text-xs rounded font-mono ${
                  recordFilter === t
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                    : 'bg-zinc-800 text-zinc-400 hover:text-zinc-200'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          <div className="osint-table-wrapper">
            <table className="osint-table">
              <thead>
                <tr>
                  <th className="w-20">Type</th>
                  <th className="w-64">Hostname</th>
                  <th>Value / Content</th>
                  <th className="w-16">TTL</th>
                </tr>
              </thead>
              <tbody>
                {filteredRecords.map((rec, i) => (
                  <tr key={i}>
                    <td>
                      <span className="px-1.5 py-0.5 rounded text-[11px] font-mono bg-zinc-800 text-cyan-300">
                        {rec.type}
                      </span>
                    </td>
                    <td className="font-mono text-zinc-300 text-xs">{rec.host}</td>
                    <td className="font-mono text-xs text-zinc-200">
                      {rec.value}
                      {rec.value.includes('KW{') && (
                        <span className="ml-2 px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                          FLAG IN RECORD
                        </span>
                      )}
                    </td>
                    <td className="font-mono text-zinc-500 text-xs">{rec.ttl}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'subdomains' && (
        <div className="osint-tab-pane">
          <div className="p-3 mb-3 bg-zinc-900 border border-zinc-800 rounded text-xs text-zinc-400">
            Discovered subdomains via Certificate Transparency log parsing and passive DNS caching.
          </div>
          <div className="grid grid-cols-1 gap-2">
            {subdomains.map((sub, i) => (
              <div key={i} className="p-3 bg-zinc-950 border border-zinc-800 rounded flex justify-between items-center">
                <div>
                  <span className="font-mono text-sm text-cyan-300">{sub.host}</span>
                  <div className="text-xs text-zinc-500 font-mono mt-0.5">IP Address: {sub.value}</div>
                </div>
                {sub.value.includes('KW{') && (
                  <span className="px-2 py-0.5 rounded text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-mono">
                    CAPTURED RECON FLAG
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'whois' && (
        <div className="osint-tab-pane">
          <div className="p-4 bg-zinc-950 border border-zinc-800 rounded font-mono text-xs">
            <h5 className="text-zinc-300 font-semibold mb-3 border-b border-zinc-800 pb-2">
              WHOIS Domain Registration Database
            </h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {Object.entries(whois).map(([key, value]) => (
                <div key={key} className="p-2.5 bg-zinc-900/60 rounded border border-zinc-800/80">
                  <span className="text-zinc-500 block text-[11px] uppercase tracking-wider">{key}</span>
                  <span className="text-zinc-200 select-all font-mono">{value}</span>
                  {value.includes('KW{') && (
                    <div className="mt-1 text-[11px] text-emerald-400 font-semibold">
                      ✓ Security Flag Located in WHOIS!
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

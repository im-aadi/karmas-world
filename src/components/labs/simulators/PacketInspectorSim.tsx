import { useState } from 'react'
import { Filter, Layers, Binary, ShieldAlert, CheckCircle2, Copy } from 'lucide-react'

interface Packet {
  id: number
  time: string
  source: string
  destination: string
  protocol: string
  length: number
  info: string
  details: string
  payload?: string
}

interface PacketInspectorSimProps {
  packets?: Packet[]
}

export function PacketInspectorSim({ packets = [] }: PacketInspectorSimProps) {
  const [filter, setFilter] = useState<'all' | 'http' | 'dns' | 'tcp'>('all')
  const [selectedPacketId, setSelectedPacketId] = useState<number>(packets[0]?.id ?? 1)
  const [copied, setCopied] = useState(false)

  const filteredPackets = packets.filter((p) => {
    if (filter === 'all') return true
    return p.protocol.toLowerCase() === filter
  })

  const selectedPacket = packets.find((p) => p.id === selectedPacketId) || packets[0]

  function copyPayload(text: string) {
    navigator.clipboard?.writeText(text).catch(() => {})
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="packet-inspector-container">
      {/* Top Filter Bar */}
      <div className="packet-filter-bar">
        <Filter size={15} className="text-cyan-400" />
        <span className="text-xs uppercase tracking-wider font-mono text-zinc-400">Display Filter:</span>
        <div className="flex gap-1.5 flex-wrap">
          {(['all', 'http', 'dns', 'tcp'] as const).map((mode) => (
            <button
              key={mode}
              type="button"
              onClick={() => setFilter(mode)}
              className={`px-2.5 py-1 text-xs rounded font-mono transition-colors ${
                filter === mode
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 border border-zinc-700/40'
              }`}
            >
              {mode.toUpperCase()}
            </button>
          ))}
        </div>
        <span className="ml-auto text-xs font-mono text-zinc-500">
          Showing {filteredPackets.length} of {packets.length} packets
        </span>
      </div>

      {/* Packet Stream Table */}
      <div className="packet-table-wrapper">
        <table className="packet-table">
          <thead>
            <tr>
              <th className="w-12 text-center">No.</th>
              <th className="w-20">Time</th>
              <th className="w-28">Source</th>
              <th className="w-28">Destination</th>
              <th className="w-20">Protocol</th>
              <th className="w-16">Length</th>
              <th>Info</th>
            </tr>
          </thead>
          <tbody>
            {filteredPackets.map((pkt) => {
              const isSelected = pkt.id === selectedPacket?.id
              const isHttp = pkt.protocol === 'HTTP'
              const isDns = pkt.protocol === 'DNS'

              let protoColor = 'bg-zinc-800 text-zinc-300'
              if (isHttp) protoColor = 'bg-emerald-950/60 text-emerald-400 border border-emerald-800/40'
              if (isDns) protoColor = 'bg-blue-950/60 text-blue-400 border border-blue-800/40'

              return (
                <tr
                  key={pkt.id}
                  onClick={() => setSelectedPacketId(pkt.id)}
                  className={`cursor-pointer transition-colors ${
                    isSelected ? 'selected-row' : 'hover:bg-zinc-800/40'
                  }`}
                >
                  <td className="text-center font-mono text-zinc-400">{pkt.id}</td>
                  <td className="font-mono text-zinc-400">{pkt.time}</td>
                  <td className="font-mono text-cyan-300">{pkt.source}</td>
                  <td className="font-mono text-amber-300">{pkt.destination}</td>
                  <td>
                    <span className={`px-1.5 py-0.5 rounded text-[11px] font-mono ${protoColor}`}>
                      {pkt.protocol}
                    </span>
                  </td>
                  <td className="font-mono text-zinc-400">{pkt.length}</td>
                  <td className="font-mono text-xs truncate max-w-xs">{pkt.info}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Lower Split Pane: Details & Payload */}
      {selectedPacket && (
        <div className="packet-details-grid">
          {/* Packet Dissection Tree */}
          <div className="packet-dissection-pane">
            <div className="pane-header">
              <Layers size={13} className="text-cyan-400" />
              <span>Packet #{selectedPacket.id} Dissection</span>
            </div>
            <div className="pane-content font-mono text-xs whitespace-pre-wrap text-zinc-300">
              <div className="text-zinc-400 mb-1">
                ▸ Frame {selectedPacket.id}: {selectedPacket.length} bytes on wire ({selectedPacket.length * 8} bits)
              </div>
              <div className="text-zinc-400 mb-1">
                ▸ Ethernet II, Src: 00:0c:29:ab:cd:ef, Dst: 00:0c:29:12:34:56
              </div>
              <div className="text-zinc-400 mb-1">
                ▸ Internet Protocol Version 4, Src: {selectedPacket.source}, Dst: {selectedPacket.destination}
              </div>
              <div className="text-cyan-300 font-semibold mt-2">
                ▾ {selectedPacket.protocol} Layer Details:
              </div>
              <div className="mt-1 pl-3 text-zinc-200 border-l border-cyan-500/30">
                {selectedPacket.details}
              </div>
            </div>
          </div>

          {/* Raw Payload / Stream Inspection */}
          <div className="packet-payload-pane">
            <div className="pane-header flex justify-between items-center">
              <div className="flex items-center gap-1.5">
                <Binary size={13} className="text-amber-400" />
                <span>Payload Data Stream</span>
              </div>
              {selectedPacket.payload && (
                <button
                  type="button"
                  onClick={() => copyPayload(selectedPacket.payload || '')}
                  className="flex items-center gap-1 text-[11px] text-zinc-400 hover:text-cyan-300"
                >
                  {copied ? <CheckCircle2 size={12} className="text-emerald-400" /> : <Copy size={12} />}
                  <span>{copied ? 'Copied' : 'Copy Payload'}</span>
                </button>
              )}
            </div>
            <div className="pane-content font-mono text-xs">
              {selectedPacket.payload ? (
                <div className="p-2.5 rounded bg-zinc-950 border border-zinc-800 text-emerald-400 break-all select-all">
                  {selectedPacket.payload}
                </div>
              ) : (
                <div className="text-zinc-500 italic p-3 text-center">
                  No application layer payload bytes in this control frame.
                </div>
              )}

              {selectedPacket.info.includes('KW{') || selectedPacket.details.includes('KW{') ? (
                <div className="mt-3 p-2 bg-amber-950/40 border border-amber-700/50 rounded flex items-start gap-2">
                  <ShieldAlert size={14} className="text-amber-400 shrink-0 mt-0.5" />
                  <span className="text-[11px] text-amber-200">
                    Flag detected in this network stream! Copy the <code>KW&#123;...&#125;</code> string to the task submission panel.
                  </span>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

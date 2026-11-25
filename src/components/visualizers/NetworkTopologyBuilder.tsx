import { useState } from 'react'
import {
  Network,
  Shield,
  Server,
  Laptop,
  Globe,
  Radio,
  Play,
  RotateCcw,
  CheckCircle2,
  XCircle,
  ArrowRight,
  Filter,
  Sliders,
} from 'lucide-react'

export interface FirewallRule {
  id: string
  priority: number
  protocol: 'TCP' | 'UDP' | 'ICMP' | 'ANY'
  port: number | 'ANY'
  action: 'ALLOW' | 'DROP'
  description: string
  enabled: boolean
}

const DEFAULT_FIREWALL_RULES: FirewallRule[] = [
  { id: 'rule-1', priority: 10, protocol: 'TCP', port: 443, action: 'ALLOW', description: 'Permit secure HTTPS web traffic to DMZ', enabled: true },
  { id: 'rule-2', priority: 20, protocol: 'TCP', port: 80, action: 'ALLOW', description: 'Permit HTTP web traffic', enabled: true },
  { id: 'rule-3', priority: 30, protocol: 'TCP', port: 22, action: 'ALLOW', description: 'Permit SSH from Internal Admin LAN', enabled: true },
  { id: 'rule-4', priority: 40, protocol: 'TCP', port: 445, action: 'DROP', description: 'Block SMB/NetBIOS remote exploit probes', enabled: true },
  { id: 'rule-5', priority: 50, protocol: 'TCP', port: 23, action: 'DROP', description: 'Block unencrypted Telnet cleartext management', enabled: true },
  { id: 'rule-6', priority: 60, protocol: 'ICMP', port: 'ANY', action: 'ALLOW', description: 'Allow ICMP Echo Request diagnostics', enabled: true },
  { id: 'rule-default', priority: 999, protocol: 'ANY', port: 'ANY', action: 'DROP', description: 'Default implicit deny all unsolicited inbound', enabled: true },
]

export function NetworkTopologyBuilder() {
  const [sourceNode, setSourceNode] = useState<'workstation' | 'attacker'>('workstation')
  const [targetNode, setTargetNode] = useState<'webserver' | 'workstation'>('webserver')
  const [trafficType, setTrafficType] = useState<'HTTPS' | 'SSH' | 'SMB' | 'TELNET' | 'PING'>('HTTPS')
  const [firewallRules, setFirewallRules] = useState<FirewallRule[]>(DEFAULT_FIREWALL_RULES)
  const [simulationLog, setSimulationLog] = useState<string[]>([])
  const [finalVerdict, setFinalVerdict] = useState<'IDLE' | 'ALLOWED' | 'DROPPED'>('IDLE')
  const [activeHop, setActiveHop] = useState<number>(-1)
  const [isSimulating, setIsSimulating] = useState(false)

  function toggleRule(id: string) {
    setFirewallRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, enabled: !r.enabled } : r))
    )
  }

  function runSimulation() {
    setIsSimulating(true)
    setSimulationLog([])
    setFinalVerdict('IDLE')
    setActiveHop(0)

    const logs: string[] = []
    const srcLabel = sourceNode === 'workstation' ? 'Internal Workstation (10.0.1.50)' : 'External Threat Actor (203.0.113.88)'
    const dstLabel = targetNode === 'webserver' ? 'DMZ Web Server (172.16.0.10)' : 'Internal Workstation (10.0.1.50)'

    let port: number | 'ANY' = 443
    let proto: 'TCP' | 'UDP' | 'ICMP' = 'TCP'

    if (trafficType === 'HTTPS') { port = 443; proto = 'TCP' }
    else if (trafficType === 'SSH') { port = 22; proto = 'TCP' }
    else if (trafficType === 'SMB') { port = 445; proto = 'TCP' }
    else if (trafficType === 'TELNET') { port = 23; proto = 'TCP' }
    else if (trafficType === 'PING') { port = 'ANY'; proto = 'ICMP' }

    logs.push(`[HOP 1] Transmission initiated from ${srcLabel}. Packet: ${proto} ${port === 'ANY' ? 'Echo Request' : `Port ${port}`}.`)

    setTimeout(() => {
      setActiveHop(1)
      logs.push(`[HOP 2] Local Layer 2 Switch inspects MAC frame. Broadcasts or forwards directly via CAM table port mapping.`)
      setSimulationLog([...logs])
    }, 400)

    setTimeout(() => {
      setActiveHop(2)
      logs.push(`[HOP 3] Gateway Router inspects destination IP address and decrements TTL from 64 to 63. Route selected: Firewall Interface eth0.`)
      setSimulationLog([...logs])
    }, 800)

    setTimeout(() => {
      setActiveHop(3)
      logs.push(`[HOP 4] Stateful Inspection Firewall evaluates incoming packet against active Security Policies:`)

      // Evaluate rules
      let matchedRule: FirewallRule | null = null
      for (const rule of firewallRules) {
        if (!rule.enabled) continue
        const protoMatch = rule.protocol === 'ANY' || rule.protocol === proto
        const portMatch = rule.port === 'ANY' || rule.port === port
        if (protoMatch && portMatch) {
          matchedRule = rule
          break
        }
      }

      if (!matchedRule) {
        matchedRule = firewallRules.find((r) => r.id === 'rule-default') || null
      }

      const isAllowed = matchedRule?.action === 'ALLOW'

      if (isAllowed) {
        logs.push(`  -> MATCH: Rule #${matchedRule?.priority} [${matchedRule?.description}]. Action: ALLOW. State table entry created.`)
        logs.push(`[HOP 5] Packet successfully delivered to ${dstLabel}. Service listener processed request.`)
        setFinalVerdict('ALLOWED')
        setActiveHop(4)
      } else {
        logs.push(`  -> MATCH: Rule #${matchedRule?.priority} [${matchedRule?.description}]. Action: DROP. Packet discarded; TCP RST/ICMP Unreachable generated.`)
        setFinalVerdict('DROPPED')
        setActiveHop(3)
      }

      setSimulationLog([...logs])
      setIsSimulating(false)
    }, 1300)
  }

  function handleReset() {
    setSimulationLog([])
    setFinalVerdict('IDLE')
    setActiveHop(-1)
  }

  return (
    <div className="network-topology-container" id="network-topology">
      <div className="topology-header">
        <div className="topology-title-wrap">
          <span className="section-cyber-tag">
            <Network size={13} /> INTERACTIVE PERIMETER DEFENSE SIMULATOR
          </span>
          <h3>Network Topology & Stateful Packet Flow Builder</h3>
          <p>
            Trace packet journeys across switches, routers, and firewalls. Observe real-time stateful access control decision logic and explore security segmentation.
          </p>
        </div>
      </div>

      <div className="topology-interactive-canvas">
        {/* Node: Source */}
        <div className={`topology-node ${sourceNode === 'workstation' ? 'client' : 'attacker'} ${activeHop === 0 ? 'pulse-active' : ''}`}>
          <div className="node-icon-wrap">
            {sourceNode === 'workstation' ? <Laptop size={22} /> : <Globe size={22} />}
          </div>
          <span className="node-title">
            {sourceNode === 'workstation' ? 'Admin Workstation' : 'External Host'}
          </span>
          <span className="node-ip">
            {sourceNode === 'workstation' ? '10.0.1.50 (LAN)' : '203.0.113.88 (WAN)'}
          </span>
        </div>

        <div className={`topology-link ${activeHop >= 1 ? 'flowing' : ''}`}>
          <span className="link-cable" />
          <ArrowRight size={14} className="link-arrow" />
        </div>

        {/* Node: Switch */}
        <div className={`topology-node switch ${activeHop === 1 ? 'pulse-active' : ''}`}>
          <div className="node-icon-wrap">
            <Radio size={22} />
          </div>
          <span className="node-title">Distribution Switch</span>
          <span className="node-ip">VLAN 10 / Layer 2</span>
        </div>

        <div className={`topology-link ${activeHop >= 2 ? 'flowing' : ''}`}>
          <span className="link-cable" />
          <ArrowRight size={14} className="link-arrow" />
        </div>

        {/* Node: Router */}
        <div className={`topology-node router ${activeHop === 2 ? 'pulse-active' : ''}`}>
          <div className="node-icon-wrap">
            <Network size={22} />
          </div>
          <span className="node-title">Core Gateway</span>
          <span className="node-ip">10.0.1.1 / OSPF</span>
        </div>

        <div className={`topology-link ${activeHop >= 3 ? 'flowing' : ''}`}>
          <span className="link-cable" />
          <ArrowRight size={14} className="link-arrow" />
        </div>

        {/* Node: Firewall */}
        <div className={`topology-node firewall ${activeHop === 3 ? (finalVerdict === 'DROPPED' ? 'pulse-drop' : 'pulse-active') : ''}`}>
          <div className="node-icon-wrap">
            <Shield size={22} />
          </div>
          <span className="node-title">Next-Gen Firewall</span>
          <span className="node-ip">Stateful ACL Engine</span>
        </div>

        <div className={`topology-link ${activeHop >= 4 ? 'flowing' : ''}`}>
          <span className="link-cable" />
          <ArrowRight size={14} className="link-arrow" />
        </div>

        {/* Node: Target */}
        <div className={`topology-node server ${activeHop === 4 ? 'pulse-success' : ''}`}>
          <div className="node-icon-wrap">
            <Server size={22} />
          </div>
          <span className="node-title">DMZ Web Server</span>
          <span className="node-ip">172.16.0.10:443</span>
        </div>
      </div>

      <div className="topology-control-panel">
        <div className="config-card">
          <div className="config-header">
            <Sliders size={15} /> Packet Generator Controls
          </div>
          <div className="config-fields-grid">
            <div className="config-group">
              <label>Origin Node:</label>
              <select
                value={sourceNode}
                onChange={(e) => setSourceNode(e.target.value as 'workstation' | 'attacker')}
                disabled={isSimulating}
              >
                <option value="workstation">Internal Workstation (10.0.1.50)</option>
                <option value="attacker">External Threat Actor (203.0.113.88)</option>
              </select>
            </div>

            <div className="config-group">
              <label>Destination Node:</label>
              <select
                value={targetNode}
                onChange={(e) => setTargetNode(e.target.value as 'webserver' | 'workstation')}
                disabled={isSimulating}
              >
                <option value="webserver">DMZ Web Server (172.16.0.10)</option>
                <option value="workstation">Admin Workstation (10.0.1.50)</option>
              </select>
            </div>

            <div className="config-group">
              <label>Protocol / Payload Type:</label>
              <select
                value={trafficType}
                onChange={(e) => setTrafficType(e.target.value as 'HTTPS' | 'SSH' | 'SMB' | 'TELNET' | 'PING')}
                disabled={isSimulating}
              >
                <option value="HTTPS">HTTPS (TCP Port 443) - Secure Web</option>
                <option value="SSH">SSH (TCP Port 22) - Remote Admin</option>
                <option value="SMB">SMB (TCP Port 445) - File Sharing / EternalBlue</option>
                <option value="TELNET">Telnet (TCP Port 23) - Legacy Unencrypted</option>
                <option value="PING">ICMP Echo Request (Ping Diagnostic)</option>
              </select>
            </div>
          </div>

          <div className="config-actions-row">
            <button className="run-packet-btn" onClick={runSimulation} disabled={isSimulating}>
              <Play size={14} /> {isSimulating ? 'Transmitting & Analyzing…' : 'Transmit Packet & Trace Flow'}
            </button>
            <button className="reset-packet-btn" onClick={handleReset} disabled={isSimulating}>
              <RotateCcw size={14} /> Clear Trace
            </button>
            {finalVerdict === 'ALLOWED' && (
              <span className="verdict-tag allowed">
                <CheckCircle2 size={15} /> PACKET DELIVERED (ALLOWED)
              </span>
            )}
            {finalVerdict === 'DROPPED' && (
              <span className="verdict-tag dropped">
                <XCircle size={15} /> PACKET BLOCKED (DROPPED)
              </span>
            )}
          </div>
        </div>

        {/* Firewall ACL Policy Editor */}
        <div className="firewall-rules-panel">
          <div className="rules-header">
            <span>
              <Filter size={14} /> Active Firewall Security Policies (Toggle to Test)
            </span>
            <span className="rules-count">{firewallRules.filter((r) => r.enabled).length} Enabled</span>
          </div>
          <div className="firewall-rules-table-wrap">
            <table className="firewall-rules-table">
              <thead>
                <tr>
                  <th>Pri</th>
                  <th>Proto</th>
                  <th>Port</th>
                  <th>Action</th>
                  <th>Policy Description</th>
                  <th>State</th>
                </tr>
              </thead>
              <tbody>
                {firewallRules.map((rule) => (
                  <tr key={rule.id} className={!rule.enabled ? 'disabled-rule' : ''}>
                    <td>#{rule.priority}</td>
                    <td>{rule.protocol}</td>
                    <td>{rule.port}</td>
                    <td>
                      <span className={`rule-action-badge ${rule.action.toLowerCase()}`}>
                        {rule.action}
                      </span>
                    </td>
                    <td>{rule.description}</td>
                    <td>
                      <button
                        className={`toggle-rule-btn ${rule.enabled ? 'on' : 'off'}`}
                        onClick={() => toggleRule(rule.id)}
                        disabled={rule.id === 'rule-default'}
                        title={rule.id === 'rule-default' ? 'Default rule cannot be disabled' : 'Toggle rule'}
                      >
                        {rule.enabled ? 'ON' : 'OFF'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Packet Inspection Trace Log */}
      {simulationLog.length > 0 && (
        <div className="topology-trace-terminal">
          <div className="trace-header">
            <span>REAL-TIME PACKET INSPECTION TRACE LOG</span>
            <span className="trace-status">{isSimulating ? 'IN TRANSIT...' : 'COMPLETED'}</span>
          </div>
          <div className="trace-body">
            {simulationLog.map((log, index) => (
              <div key={index} className="trace-log-line">
                {log}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

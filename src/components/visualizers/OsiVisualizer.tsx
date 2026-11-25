import { useState } from 'react'
import {
  Layers,
  ArrowDown,
  ArrowUp,
  ShieldAlert,
  ShieldCheck,
  Play,
  RotateCcw,
  ChevronRight,
  Globe,
  Zap,
} from 'lucide-react'

export interface OsiLayerInfo {
  number: number
  name: string
  tcpIpEquivalent: string
  pdu: string
  protocols: string[]
  description: string
  headerFields: string[]
  securityThreats: string[]
  defenses: string[]
}

const OSI_LAYERS: OsiLayerInfo[] = [
  {
    number: 7,
    name: 'Application',
    tcpIpEquivalent: 'Application Layer',
    pdu: 'Data / Messages',
    protocols: ['HTTP', 'HTTPS', 'DNS', 'SSH', 'SMTP', 'FTP', 'BGP'],
    description: 'Closest to the end-user. Provides network services directly to software applications for communication, identity, and data exchange.',
    headerFields: ['HTTP Request Method', 'Host Header', 'User-Agent', 'DNS Query ID', 'Session Cookies'],
    securityThreats: ['SQL Injection & XSS', 'Cross-Site Request Forgery (CSRF)', 'DDoS HTTP Floods', 'API Authentication Bypasses'],
    defenses: ['Web Application Firewall (WAF)', 'Input Sanitization', 'Content Security Policy (CSP)', 'Strict OAuth/MFA'],
  },
  {
    number: 6,
    name: 'Presentation',
    tcpIpEquivalent: 'Application Layer',
    pdu: 'Formatted Data',
    protocols: ['TLS / SSL', 'ASCII', 'UTF-8', 'JSON', 'XML', 'JPEG'],
    description: 'Translates, encrypts, and compresses data so that applications on different systems can exchange information consistently.',
    headerFields: ['TLS Handshake Type', 'Cipher Suite Selected', 'Compression Algorithm', 'Encoding Format'],
    securityThreats: ['TLS Downgrade Attacks', 'Insecure Object Deserialization', 'Padding Oracle Attacks', 'Cipher Weaknesses'],
    defenses: ['Enforce TLS 1.3 Only', 'Disable Deprecated Ciphers', 'Safe JSON Parsers', 'Certificate Pinning'],
  },
  {
    number: 5,
    name: 'Session',
    tcpIpEquivalent: 'Application Layer',
    pdu: 'Session Data',
    protocols: ['RPC', 'NetBIOS', 'PPTP', 'SOCKS5'],
    description: 'Establishes, coordinates, and terminates conversations and sessions between end applications across remote systems.',
    headerFields: ['Session Identifier', 'Token Nonce', 'Connection Keep-Alive Interval', 'Checkpoint Sync Marks'],
    securityThreats: ['Session Hijacking', 'Session Fixation Attacks', 'Man-in-the-Middle Eavesdropping', 'RPC Buffer Overflows'],
    defenses: ['Cryptographically Random Session Tokens', 'Strict HttpOnly Cookies', 'Mutual TLS Authentication'],
  },
  {
    number: 4,
    name: 'Transport',
    tcpIpEquivalent: 'Transport Layer',
    pdu: 'Segment (TCP) / Datagram (UDP)',
    protocols: ['TCP', 'UDP', 'QUIC', 'SCTP'],
    description: 'Provides end-to-end communication, error recovery, flow control, and port multiplexing between source and destination endpoints.',
    headerFields: ['Source Port (16-bit)', 'Destination Port (16-bit)', 'Sequence Number (32-bit)', 'Acknowledgment Number', 'TCP Flags (SYN, ACK, FIN, RST)', 'Window Size'],
    securityThreats: ['TCP SYN Flooding', 'Port Scanning (Nmap SYN Stealth)', 'TCP Reset Hijacking', 'UDP Amplification Attacks'],
    defenses: ['SYN Cookies', 'Stateful Packet Inspection (SPI)', 'Rate Limiting', 'Connection Timeouts'],
  },
  {
    number: 3,
    name: 'Network',
    tcpIpEquivalent: 'Internet Layer',
    pdu: 'Packet',
    protocols: ['IPv4', 'IPv6', 'ICMP', 'IPSec', 'OSPF'],
    description: 'Handles logical addressing (IP addresses) and path selection (routing) across interconnected heterogeneous networks.',
    headerFields: ['Source IP Address (32/128-bit)', 'Destination IP Address', 'Time-to-Live (TTL)', 'Protocol Number (TCP=6, UDP=17, ICMP=1)', 'IP Header Checksum'],
    securityThreats: ['IP Address Spoofing', 'ICMP Tunneling / Exfiltration', 'Smurf & Ping of Death', 'BGP Route Hijacking'],
    defenses: ['Anti-Spoofing (uRPF)', 'Egress/Ingress IP Filtering', 'IPSec Encryption', 'Strict BGP RPKI Validation'],
  },
  {
    number: 2,
    name: 'Data Link',
    tcpIpEquivalent: 'Network Access Layer',
    pdu: 'Frame',
    protocols: ['Ethernet (802.3)', 'Wi-Fi (802.11)', 'ARP', 'VLAN (802.1Q)', 'PPP'],
    description: 'Handles node-to-node data transfer across local physical links using physical MAC addresses and error detection via Frame Check Sequences.',
    headerFields: ['Destination MAC (48-bit)', 'Source MAC (48-bit)', 'EtherType / Length (0x0800 IPv4, 0x0806 ARP)', 'VLAN Tag', 'Frame Check Sequence (CRC-32)'],
    securityThreats: ['ARP Spoofing / Poisoning', 'MAC Address Flooding (CAM Table Overflow)', 'VLAN Hopping Attacks', 'Wi-Fi Evil Twin Deauth'],
    defenses: ['Dynamic ARP Inspection (DAI)', 'Port Security (Sticky MAC)', '802.1X Network Access Control', 'WPA3 Enterprise Encryption'],
  },
  {
    number: 1,
    name: 'Physical',
    tcpIpEquivalent: 'Network Access Layer',
    pdu: 'Bits (Signals)',
    protocols: ['Cat6 Twisted Pair', 'Fiber Optics', 'Radio RF Spectrum', 'USB', 'DSL'],
    description: 'Transmits raw unstructured bitstreams over a physical transmission medium (electrical voltages, optical light pulses, or radio frequencies).',
    headerFields: ['Preamble & Start Frame Delimiter', 'Voltage Modulation Level', 'Bit Clock Synchronization', 'Signal Frequency Band'],
    securityThreats: ['Physical Cable Tapping & Optical Splicing', 'RF Wireless Jamming', 'Unauthorized Hardware Keyloggers / Drops', 'TEMPEST Eavesdropping'],
    defenses: ['Physical Security & Tamper Seals', 'Conduit Shielding & Fiber Monitoring', 'RF Shielding (Faraday Cages)', '802.1X Port Blocking'],
  },
]

export function OsiVisualizer() {
  const [selectedLayerNumber, setSelectedLayerNumber] = useState<number>(7)
  const [viewMode, setViewMode] = useState<'OSI_7' | 'TCPIP_4'>('OSI_7')
  const [flowDirection, setFlowDirection] = useState<'ENCAPSULATION' | 'DECAPSULATION'>('ENCAPSULATION')
  const [currentStep, setCurrentStep] = useState<number>(1)

  const selectedLayer = OSI_LAYERS.find((l) => l.number === selectedLayerNumber) ?? OSI_LAYERS[0]!

  function handleLayerClick(num: number) {
    setSelectedLayerNumber(num)
  }

  function handleStepAdvance() {
    if (currentStep < 5) setCurrentStep(currentStep + 1)
    else setCurrentStep(1)
  }

  function handleReset() {
    setCurrentStep(1)
  }

  return (
    <div className="osi-visualizer-container" id="osi-visualizer">
      <div className="osi-header">
        <div className="osi-header-titles">
          <span className="section-cyber-tag">
            <Layers size={13} /> INTERACTIVE PROTOCOL SUITE EXPLORER
          </span>
          <h3>OSI 7-Layer & TCP/IP Reference Visualizer</h3>
          <p>
            Explore how data travels through the protocol stack, how headers are encapsulated at each layer, and where security vulnerabilities exist.
          </p>
        </div>
        <div className="osi-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'OSI_7' ? 'active' : ''}`}
            onClick={() => setViewMode('OSI_7')}
          >
            OSI 7-Layer Model
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'TCPIP_4' ? 'active' : ''}`}
            onClick={() => setViewMode('TCPIP_4')}
          >
            TCP/IP 4-Layer Model
          </button>
        </div>
      </div>

      <div className="osi-main-layout">
        {/* Layer Stack Column */}
        <div className="osi-stack-column">
          <div className="stack-column-header">
            <span>LAYER HIERARCHY</span>
            <span>{viewMode === 'OSI_7' ? '7 LAYERS' : '4 LAYERS'}</span>
          </div>

          <div className="osi-layers-list">
            {OSI_LAYERS.map((layer) => {
              const isSelected = selectedLayer.number === layer.number
              return (
                <div
                  key={layer.number}
                  className={`osi-layer-card layer-${layer.number} ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleLayerClick(layer.number)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') handleLayerClick(layer.number)
                  }}
                >
                  <div className="layer-num-badge">L{layer.number}</div>
                  <div className="layer-main-info">
                    <div className="layer-title-row">
                      <span className="layer-name">{layer.name}</span>
                      <span className="layer-pdu-tag">{layer.pdu}</span>
                    </div>
                    <div className="layer-protocols-preview">
                      {layer.protocols.slice(0, 4).join(', ')}
                    </div>
                  </div>
                  {viewMode === 'TCPIP_4' && (
                    <span className="layer-tcpip-label">{layer.tcpIpEquivalent}</span>
                  )}
                  <ChevronRight size={15} className="layer-chevron" />
                </div>
              )
            })}
          </div>
        </div>

        {/* Layer Detail Inspector */}
        <div className="osi-details-column">
          <div className="details-header-card">
            <div className="layer-badge-top">
              <span className="layer-number-big">Layer {selectedLayer.number}</span>
              <span className="layer-name-big">{selectedLayer.name} Layer</span>
              <span className="tcpip-map-tag">Mapped: {selectedLayer.tcpIpEquivalent}</span>
            </div>
            <p className="layer-description-text">{selectedLayer.description}</p>
          </div>

          <div className="details-grid-cards">
            {/* Protocols & Header Card */}
            <div className="inspector-card">
              <div className="inspector-card-title">
                <Globe size={15} /> Key Protocols & Header Fields
              </div>
              <div className="protocols-chip-list">
                {selectedLayer.protocols.map((proto) => (
                  <span key={proto} className="proto-chip">
                    {proto}
                  </span>
                ))}
              </div>
              <div className="header-fields-section">
                <span className="subhead-label">Encapsulated Header Fields:</span>
                <ul className="fields-list">
                  {selectedLayer.headerFields.map((field) => (
                    <li key={field}>{field}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Security Vulnerabilities Card */}
            <div className="inspector-card threats">
              <div className="inspector-card-title threat-title">
                <ShieldAlert size={15} /> Attack Vectors & Threats
              </div>
              <ul className="threats-list">
                {selectedLayer.securityThreats.map((threat) => (
                  <li key={threat}>{threat}</li>
                ))}
              </ul>
            </div>

            {/* Defensive Countermeasures Card */}
            <div className="inspector-card defenses">
              <div className="inspector-card-title defense-title">
                <ShieldCheck size={15} /> Hardening & Defenses
              </div>
              <ul className="defenses-list">
                {selectedLayer.defenses.map((defense) => (
                  <li key={defense}>{defense}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Packet Encapsulation & Decapsulation Interactive Walkthrough */}
      <div className="encapsulation-simulator-card">
        <div className="encapsulation-header">
          <div className="encap-title-wrap">
            <span className="section-cyber-tag">
              <Zap size={12} /> PACKET LIFECYCLE SIMULATOR
            </span>
            <h4>Step-by-Step Data Encapsulation Demonstration</h4>
          </div>
          <div className="encap-controls">
            <div className="direction-toggle">
              <button
                className={`dir-btn ${flowDirection === 'ENCAPSULATION' ? 'active' : ''}`}
                onClick={() => setFlowDirection('ENCAPSULATION')}
              >
                <ArrowDown size={13} /> Encapsulation (Sender)
              </button>
              <button
                className={`dir-btn ${flowDirection === 'DECAPSULATION' ? 'active' : ''}`}
                onClick={() => setFlowDirection('DECAPSULATION')}
              >
                <ArrowUp size={13} /> Decapsulation (Receiver)
              </button>
            </div>
            <button className="encap-step-btn" onClick={handleStepAdvance}>
              <Play size={13} /> Step {currentStep} / 5
            </button>
            <button className="encap-reset-btn" onClick={handleReset} title="Reset simulation">
              <RotateCcw size={13} />
            </button>
          </div>
        </div>

        <div className="encap-visual-container">
          <div className="encap-stage-explanation">
            {currentStep === 1 && (
              <p>
                <strong>Step 1: Application Layer Payload (HTTP GET).</strong> The client web browser creates an application request message: <code>GET /index.html HTTP/1.1</code>.
              </p>
            )}
            {currentStep === 2 && (
              <p>
                <strong>Step 2: Transport Layer Segment (TCP Header Added).</strong> TCP adds source port <code>52104</code>, destination port <code>443</code>, sequence numbers, and SYN/ACK flags for reliable delivery.
              </p>
            )}
            {currentStep === 3 && (
              <p>
                <strong>Step 3: Network Layer Packet (IP Header Added).</strong> IPv4 wraps the segment with Source IP <code>192.168.1.100</code>, Destination IP <code>93.184.216.34</code>, and TTL <code>64</code>.
              </p>
            )}
            {currentStep === 4 && (
              <p>
                <strong>Step 4: Data Link Layer Frame (Ethernet Header & FCS Trailer Added).</strong> Ethernet adds Source MAC <code>00:1A:2B:3C:4D:5E</code>, Gateway MAC <code>E0:D5:5E:22:11:00</code>, and CRC-32 Frame Check Sequence.
              </p>
            )}
            {currentStep === 5 && (
              <p>
                <strong>Step 5: Physical Layer (Bitstream on the wire).</strong> The frame is converted to electrical pulses, radio frequencies (Wi-Fi), or light signals (Fiber) across the physical medium.
              </p>
            )}
          </div>

          <div className="packet-nest-diagram">
            <div className={`packet-box eth-box ${currentStep >= 4 ? 'active' : ''}`}>
              <span className="box-tag">Ethernet Frame Header (MAC)</span>
              <div className={`packet-box ip-box ${currentStep >= 3 ? 'active' : ''}`}>
                <span className="box-tag">IPv4 Header (Source & Dest IP)</span>
                <div className={`packet-box tcp-box ${currentStep >= 2 ? 'active' : ''}`}>
                  <span className="box-tag">TCP Segment Header (Ports & Flags)</span>
                  <div className="packet-box app-box active">
                    <span className="box-tag">Application Data (HTTP GET /)</span>
                    <span className="payload-content">GET /login HTTP/1.1\r\nHost: karmas.world</span>
                  </div>
                </div>
              </div>
              {currentStep >= 4 && <span className="trailer-tag">FCS: CRC-32 Checksum</span>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

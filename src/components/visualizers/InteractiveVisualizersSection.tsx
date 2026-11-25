import { useState } from 'react'
import {
  Layers,
  Network,
  KeyRound,
  Lock,
  Mail,
  Code2,
} from 'lucide-react'
import { OsiVisualizer } from './OsiVisualizer'
import { NetworkTopologyBuilder } from './NetworkTopologyBuilder'
import { CryptoCipherVisualizer } from './CryptoCipherVisualizer'
import { PasswordEntropyChecker } from './PasswordEntropyChecker'
import { PhishingEmailInspector } from './PhishingEmailInspector'
import { SecurityCodeSandbox } from './SecurityCodeSandbox'

export type VisualizerTab =
  | 'OSI_PROTOCOLS'
  | 'NETWORK_TOPOLOGY'
  | 'CRYPTOGRAPHY'
  | 'PASSWORD_ENTROPY'
  | 'PHISHING_INSPECTOR'
  | 'CODE_SANDBOX'

export function InteractiveVisualizersSection() {
  const [activeTab, setActiveTab] = useState<VisualizerTab>('OSI_PROTOCOLS')

  return (
    <section id="visualizers" className="visualizers-section">
      <div className="wrap">
        <div className="visualizers-section-head">
          <div>
            <div className="eyebrow">
              <span className="eyebrow-line" /> INTERACTIVE CYBERSECURITY WORKSHOP
            </div>
            <h2>
              See how security works.<br />
              <span>Explore through simulation.</span>
            </h2>
          </div>
          <p className="visualizers-lead-text">
            Complex network protocols, cryptographic primitives, and perimeter defenses are easiest to master when you can interact with them. Step through packets, test brute-force entropy, and inspect cyber attack vectors in real time.
          </p>
        </div>

        {/* Visualizer Navigation Hub */}
        <div className="visualizer-nav-strip" role="tablist" aria-label="Interactive cybersecurity visualizers">
          <button
            role="tab"
            aria-selected={activeTab === 'OSI_PROTOCOLS'}
            className={`vis-nav-btn ${activeTab === 'OSI_PROTOCOLS' ? 'active' : ''}`}
            onClick={() => setActiveTab('OSI_PROTOCOLS')}
          >
            <Layers size={16} />
            <div className="btn-text">
              <strong>OSI & TCP/IP Layers</strong>
              <span>Encapsulation Walkthrough</span>
            </div>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'NETWORK_TOPOLOGY'}
            className={`vis-nav-btn ${activeTab === 'NETWORK_TOPOLOGY' ? 'active' : ''}`}
            onClick={() => setActiveTab('NETWORK_TOPOLOGY')}
          >
            <Network size={16} />
            <div className="btn-text">
              <strong>Network Topology</strong>
              <span>Firewall Packet Flow</span>
            </div>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'CRYPTOGRAPHY'}
            className={`vis-nav-btn ${activeTab === 'CRYPTOGRAPHY' ? 'active' : ''}`}
            onClick={() => setActiveTab('CRYPTOGRAPHY')}
          >
            <KeyRound size={16} />
            <div className="btn-text">
              <strong>Crypto & Ciphers</strong>
              <span>AES Rounds & Avalanche</span>
            </div>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'PASSWORD_ENTROPY'}
            className={`vis-nav-btn ${activeTab === 'PASSWORD_ENTROPY' ? 'active' : ''}`}
            onClick={() => setActiveTab('PASSWORD_ENTROPY')}
          >
            <Lock size={16} />
            <div className="btn-text">
              <strong>Password Entropy</strong>
              <span>GPU Crack-Time Analyzer</span>
            </div>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'PHISHING_INSPECTOR'}
            className={`vis-nav-btn ${activeTab === 'PHISHING_INSPECTOR' ? 'active' : ''}`}
            onClick={() => setActiveTab('PHISHING_INSPECTOR')}
          >
            <Mail size={16} />
            <div className="btn-text">
              <strong>Phishing Inspector</strong>
              <span>SOC Header & URL Triage</span>
            </div>
          </button>

          <button
            role="tab"
            aria-selected={activeTab === 'CODE_SANDBOX'}
            className={`vis-nav-btn ${activeTab === 'CODE_SANDBOX' ? 'active' : ''}`}
            onClick={() => setActiveTab('CODE_SANDBOX')}
          >
            <Code2 size={16} />
            <div className="btn-text">
              <strong>Security Code Lab</strong>
              <span>Python Automation Sandbox</span>
            </div>
          </button>
        </div>

        {/* Active Visualizer Panel */}
        <div className="active-visualizer-frame">
          {activeTab === 'OSI_PROTOCOLS' && <OsiVisualizer />}
          {activeTab === 'NETWORK_TOPOLOGY' && <NetworkTopologyBuilder />}
          {activeTab === 'CRYPTOGRAPHY' && <CryptoCipherVisualizer />}
          {activeTab === 'PASSWORD_ENTROPY' && <PasswordEntropyChecker />}
          {activeTab === 'PHISHING_INSPECTOR' && <PhishingEmailInspector />}
          {activeTab === 'CODE_SANDBOX' && <SecurityCodeSandbox />}
        </div>
      </div>
    </section>
  )
}

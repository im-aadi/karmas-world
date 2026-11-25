import { describe, expect, it, beforeEach, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { InteractiveVisualizersSection } from '../src/components/visualizers/InteractiveVisualizersSection'
import { OsiVisualizer } from '../src/components/visualizers/OsiVisualizer'
import { NetworkTopologyBuilder } from '../src/components/visualizers/NetworkTopologyBuilder'
import { CryptoCipherVisualizer } from '../src/components/visualizers/CryptoCipherVisualizer'
import { PasswordEntropyChecker, calculatePasswordEntropy } from '../src/components/visualizers/PasswordEntropyChecker'
import { PhishingEmailInspector } from '../src/components/visualizers/PhishingEmailInspector'
import { SecurityCodeSandbox } from '../src/components/visualizers/SecurityCodeSandbox'

describe('Phase 7: Interactive Visualizers & Learning Experiences', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('InteractiveVisualizersSection renders all visualizer tabs and allows tab switching', () => {
    render(<InteractiveVisualizersSection />)

    expect(screen.getByText('OSI & TCP/IP Layers')).toBeInTheDocument()
    expect(screen.getByText('Network Topology')).toBeInTheDocument()
    expect(screen.getByText('Crypto & Ciphers')).toBeInTheDocument()
    expect(screen.getByText('Password Entropy')).toBeInTheDocument()
    expect(screen.getByText('Phishing Inspector')).toBeInTheDocument()
    expect(screen.getByText('Security Code Lab')).toBeInTheDocument()

    // Default tab is OSI
    expect(screen.getByText('OSI 7-Layer & TCP/IP Reference Visualizer')).toBeInTheDocument()

    // Switch to Password Entropy
    fireEvent.click(screen.getByRole('tab', { name: /Password Entropy/i }))
    expect(screen.getByText('Password Entropy & Hardware Crack-Time Analyzer')).toBeInTheDocument()

    // Switch to Phishing Inspector
    fireEvent.click(screen.getByRole('tab', { name: /Phishing Inspector/i }))
    expect(screen.getByText('Interactive Phishing & Email Header Inspector')).toBeInTheDocument()
  })

  it('OsiVisualizer renders 7 layers and steps through encapsulation', () => {
    render(<OsiVisualizer />)

    // Check layer list
    expect(screen.getByText('Application Layer')).toBeInTheDocument()
    expect(screen.getByText('Data / Messages')).toBeInTheDocument()
    expect(screen.getByText('Transport')).toBeInTheDocument()
    expect(screen.getByText('Physical')).toBeInTheDocument()

    // Click on Transport Layer L4
    fireEvent.click(screen.getByText('Transport'))
    expect(screen.getByText('Layer 4')).toBeInTheDocument()

    // Step through encapsulation
    const stepBtn = screen.getByRole('button', { name: /Step 1 \/ 5/i })
    fireEvent.click(stepBtn)
    expect(screen.getByText(/Transport Layer Segment/i)).toBeInTheDocument()
  })

  it('NetworkTopologyBuilder executes firewall packet trace and evaluates ACL rules', async () => {
    render(<NetworkTopologyBuilder />)

    expect(screen.getByText('Admin Workstation')).toBeInTheDocument()
    expect(screen.getByText('Next-Gen Firewall')).toBeInTheDocument()
    expect(screen.getByText('DMZ Web Server')).toBeInTheDocument()

    // Transmit HTTPS packet (allowed by default)
    const runBtn = screen.getByRole('button', { name: /Transmit Packet & Trace Flow/i })
    fireEvent.click(runBtn)

    await waitFor(
      () => {
        expect(screen.getByText(/PACKET DELIVERED \(ALLOWED\)/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Change traffic type to SMB (blocked by default)
    const protocolSelect = screen.getByDisplayValue(/HTTPS/i)
    fireEvent.change(protocolSelect, { target: { value: 'SMB' } })

    fireEvent.click(screen.getByRole('button', { name: /Transmit Packet & Trace Flow/i }))

    await waitFor(
      () => {
        expect(screen.getByText(/PACKET BLOCKED \(DROPPED\)/i)).toBeInTheDocument()
      },
      { timeout: 3000 }
    )
  })

  it('CryptoCipherVisualizer encodes text with Caesar and Vigenere ciphers', () => {
    render(<CryptoCipherVisualizer />)

    expect(screen.getByText('Caesar Shift Cipher')).toBeInTheDocument()
    expect(screen.getByText('Vigenère Polyalphabetic Cipher')).toBeInTheDocument()

    // Switch to AES tab
    fireEvent.click(screen.getByRole('button', { name: 'AES Block Mechanics' }))
    expect(screen.getByText(/Advanced Encryption Standard \(AES\)/i)).toBeInTheDocument()
    expect(screen.getByText('1. SubBytes (S-Box)')).toBeInTheDocument()

    // Switch to Avalanche tab
    fireEvent.click(screen.getByRole('button', { name: 'Hash Avalanche Effect' }))
    expect(screen.getByText(/Strict Avalanche Criterion/i)).toBeInTheDocument()
  })

  it('PasswordEntropyChecker calculates information entropy and flags weak passwords', () => {
    // Unit function test
    const veryWeak = calculatePasswordEntropy('12345')
    expect(veryWeak.rating).toBe('VERY_WEAK')

    const weakAnalysis = calculatePasswordEntropy('password')
    expect(weakAnalysis.rating).toBe('WEAK')
    expect(weakAnalysis.warnings.length).toBeGreaterThan(0)

    const strongAnalysis = calculatePasswordEntropy('CyberDefense$2026!Master')
    expect(strongAnalysis.entropyBits).toBeGreaterThan(60)
    expect(strongAnalysis.poolSize).toBe(95)

    // Component render test
    render(<PasswordEntropyChecker />)
    expect(screen.getByText('Test Password / Passphrase:')).toBeInTheDocument()
    expect(screen.getByText('Standard CPU')).toBeInTheDocument()
    expect(screen.getByText('8x RTX 4090 GPU Cluster')).toBeInTheDocument()
  })

  it('PhishingEmailInspector reveals spoofed headers and evaluates SOC triage decisions', () => {
    const { container } = render(<PhishingEmailInspector />)

    expect(screen.getByText(/Microsoft 365 Urgent Password Expiration Notice/i)).toBeInTheDocument()

    // Inspect headers
    const inspectHeadersBtn = screen.getByRole('button', { name: /Inspect Raw Headers/i })
    fireEvent.click(inspectHeadersBtn)
    expect(screen.getByText('bounce-service@mailgun-relay-bulk.ru')).toBeInTheDocument()

    // Inspect link destination
    const linkElement = container.querySelector('.inspectable-link')!
    fireEvent.click(linkElement)
    expect(screen.getByText(/http:\/\/microsofft-auth-verify\.xyz/i)).toBeInTheDocument()

    // Submit triage decision: Malicious
    const maliciousBtn = screen.getByRole('button', { name: /Malicious \(Quarantine & Block\)/i })
    fireEvent.click(maliciousBtn)
    expect(screen.getByText(/Correct Classification: Verified Malicious Phishing/i)).toBeInTheDocument()
  })

  it('SecurityCodeSandbox selects Python templates and simulates execution', async () => {
    render(<SecurityCodeSandbox />)

    expect(screen.getByText('TCP Port Scanner')).toBeInTheDocument()
    expect(screen.getByText('HTTP Security Headers Auditor')).toBeInTheDocument()

    // Run Port Scanner script
    const runBtn = screen.getByRole('button', { name: /Run Script/i })
    fireEvent.click(runBtn)

    await waitFor(
      () => {
        expect(screen.getByText(/Port 22\/TCP : OPEN/i)).toBeInTheDocument()
      },
      { timeout: 2000 }
    )

    // Switch to Header Auditor
    fireEvent.click(screen.getByText('HTTP Security Headers Auditor'))
    expect(screen.getByText('audit_headers.py')).toBeInTheDocument()
  })
})

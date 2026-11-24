import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { LinuxTerminalSim } from '../src/components/labs/simulators/LinuxTerminalSim'
import { PacketInspectorSim } from '../src/components/labs/simulators/PacketInspectorSim'
import { SqlInjectionSandbox } from '../src/components/labs/simulators/SqlInjectionSandbox'
import { CryptoWorkbenchSim } from '../src/components/labs/simulators/CryptoWorkbenchSim'
import { ForensicsLogSim } from '../src/components/labs/simulators/ForensicsLogSim'
import { OsintReconSim } from '../src/components/labs/simulators/OsintReconSim'
import { CURATED_LABS } from '../src/data/labs'

describe('Interactive Cybersecurity Simulators (Phase 5)', () => {
  it('LinuxTerminalSim executes commands and discovers hidden flag file', () => {
    const files = CURATED_LABS[0].simulatedData.terminalFiles
    render(<LinuxTerminalSim files={files} />)

    const input = screen.getByPlaceholderText(/type command/i)

    // Execute pwd
    fireEvent.change(input, { target: { value: 'pwd' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText('/home/learner')).toBeInTheDocument()

    // Execute cat .secret_vault
    fireEvent.change(input, { target: { value: 'cat .secret_vault' } })
    fireEvent.submit(input.closest('form')!)
    expect(screen.getByText(/KW\{l1nux_b4sh_m4st3r\}/i)).toBeInTheDocument()
  })

  it('PacketInspectorSim displays packet stream, filters by protocol, and shows payload', () => {
    const packets = CURATED_LABS[1].simulatedData.packets
    render(<PacketInspectorSim packets={packets} />)

    expect(screen.getByText(/Showing 11 of 11 packets/i)).toBeInTheDocument()

    // Filter by HTTP
    const httpBtn = screen.getByRole('button', { name: 'HTTP' })
    fireEvent.click(httpBtn)
    expect(screen.getByText(/Showing 2 of 11 packets/i)).toBeInTheDocument()

    // Select Packet #4 containing the plaintext auth credentials
    const packetRow = screen.getByText('POST /api/v1/auth HTTP/1.1 (application/x-www-form-urlencoded)')
    fireEvent.click(packetRow)

    expect(screen.getAllByText(/KW\{pl41nt3xt_p4ss_3xp0s3d\}/i).length).toBeGreaterThanOrEqual(1)
  })

  it('SqlInjectionSandbox demonstrates authentication bypass and UNION extraction', () => {
    const context = CURATED_LABS[2].simulatedData.sqlVulnerableContext
    render(<SqlInjectionSandbox context={context} />)

    // 1. Test UNION extraction in search tab
    const searchInput = screen.getByPlaceholderText(/search category or inject/i)
    fireEvent.change(searchInput, {
      target: { value: "' UNION SELECT id, security_flag, 0, 0 FROM confidential_inventory --" },
    })
    fireEvent.submit(searchInput.closest('form')!)

    expect(screen.getByText(/KW\{un10n_b4s3d_d4t4_3xtr4ct\}/i)).toBeInTheDocument()

    // 2. Test Admin Auth Bypass tab
    const loginTab = screen.getByRole('button', { name: /admin portal login/i })
    fireEvent.click(loginTab)

    const usernameInput = screen.getByPlaceholderText(/admin or admin' OR '1'='1/i)
    fireEvent.change(usernameInput, { target: { value: "admin' OR '1'='1" } })
    fireEvent.submit(usernameInput.closest('form')!)

    expect(screen.getByText(/Authentication Bypassed! Logged in as: admin/i)).toBeInTheDocument()
    expect(screen.getByText(/KW\{sql1_auth_byp4ss_succ3ss\}/i)).toBeInTheDocument()
  })

  it('CryptoWorkbenchSim runs dictionary hash cracking and AES-GCM decryption', async () => {
    const challenge = CURATED_LABS[3].simulatedData.cryptoChallenge
    render(<CryptoWorkbenchSim challenge={challenge} />)

    // Run dictionary attack
    const attackBtn = screen.getByRole('button', { name: /run dictionary attack/i })
    fireEvent.click(attackBtn)

    await waitFor(
      () => {
        expect(screen.getByText(/Hash Successfully Cracked!/i)).toBeInTheDocument()
        expect(screen.getByText('KW{cr4ck_th3_h4sh_sh4256}')).toBeInTheDocument()
      },
      { timeout: 3000 }
    )

    // Decrypt AES-GCM
    const aesTab = screen.getByRole('button', { name: /AES-256-GCM Decryptor/i })
    fireEvent.click(aesTab)

    const keyInput = screen.getByPlaceholderText(/paste revealed encryption key/i)
    fireEvent.change(keyInput, { target: { value: 'karmas-world-aes-master-key-2026' } })
    fireEvent.click(screen.getByRole('button', { name: /decrypt & verify integrity/i }))

    expect(screen.getByText(/Decryption Successful & GCM Tag Validated!/i)).toBeInTheDocument()
    expect(screen.getByText(/KW\{43s_gcm_auth_d3crypt3d\}/i)).toBeInTheDocument()
  })

  it('ForensicsLogSim filters SIEM logs and inspects attacker compromise artifacts', () => {
    const logs = CURATED_LABS[4].simulatedData.forensicsLogs
    render(<ForensicsLogSim logs={logs} />)

    const searchInput = screen.getByPlaceholderText(/search siem logs/i)
    fireEvent.change(searchInput, { target: { value: 'shadow.php' } })

    const logMessage = screen.getByText(/GET \/uploads\/shadow.php\?cmd=whoami/i)
    fireEvent.click(logMessage)
    expect(screen.getByText(/Evidence Flag Located in Log Stream!/i)).toBeInTheDocument()
  })

  it('OsintReconSim searches DNS records, identifies subdomains, and views WHOIS data', () => {
    const osintData = CURATED_LABS[5].simulatedData.osintRecords
    render(<OsintReconSim osintData={osintData} />)

    // Filter TXT records
    const txtBtn = screen.getByRole('button', { name: 'TXT' })
    fireEvent.click(txtBtn)
    expect(screen.getByText(/karma-verification=KW\{dns_txt_v3r1f1c4t10n_k3y\}/i)).toBeInTheDocument()

    // Inspect Subdomains tab
    const subdomainsTab = screen.getByRole('button', { name: /subdomain discovery/i })
    fireEvent.click(subdomainsTab)
    expect(screen.getByText('staging-portal.insecure-corp.karmas.world')).toBeInTheDocument()

    // Inspect WHOIS tab
    const whoisTab = screen.getByRole('button', { name: /whois registration/i })
    fireEvent.click(whoisTab)
    expect(screen.getByText(/security@insecure-corp.karmas.world/i)).toBeInTheDocument()
  })
})

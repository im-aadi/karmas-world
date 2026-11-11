import { FormEvent, useState } from 'react'
import { ArrowRight, Check, CircleHelp, LockKeyhole, Radio, RotateCcw, TerminalSquare } from 'lucide-react'

type LabTab = 'terminal' | 'network' | 'cipher'
const commandHelp = 'Available demo commands: help, whoami, pwd, ls, cat README.md, clear'
const commandResults: Record<string, string> = {
  help: commandHelp,
  whoami: 'learner (simulated account)',
  pwd: '/academy/practice (simulated workspace)',
  ls: 'README.md   notes/   exercises/   [all simulated files]',
  'cat README.md': 'Welcome to the safe practice space. Nothing here connects to your computer or a real network.',
}

function caesar(text: string, shift: number) {
  return [...text].map(character => {
    const code = character.charCodeAt(0)
    const base = code >= 65 && code <= 90 ? 65 : code >= 97 && code <= 122 ? 97 : -1
    if (base < 0) return character
    return String.fromCharCode(((code - base + shift % 26 + 26) % 26) + base)
  }).join('')
}

export function PracticeLab() {
  const [tab, setTab] = useState<LabTab>('terminal')
  const [command, setCommand] = useState('')
  const [output, setOutput] = useState<string[]>(['KARMA PRACTICE SIMULATOR / SESSION 001', 'This teaching terminal is simulated. Try “help”.'])
  const [networkAnswer, setNetworkAnswer] = useState<number | null>(null)
  const [networkChecked, setNetworkChecked] = useState(false)
  const [cipherText, setCipherText] = useState('Meet me at the library')
  const [shift, setShift] = useState(3)
  const [decode, setDecode] = useState(false)

  function submitCommand(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    const entered = command.trim()
    if (!entered) return
    if (entered.toLowerCase() === 'clear') { setOutput([]); setCommand(''); return }
    const response = commandResults[entered]
    setOutput(previous => [...previous, `learner@practice:~$ ${entered}`, response ?? 'That command is not part of this simulation. Type “help” to see available examples.'])
    setCommand('')
  }

  function selectTab(next: LabTab) {
    setTab(next)
    setNetworkAnswer(null)
    setNetworkChecked(false)
  }

  return <section id="practice" className="practice-lab-section">
    <div className="wrap">
      <div className="academy-heading"><div><div className="eyebrow"><span className="eyebrow-line" /> PHASE 04 / SAFE PRACTICE LABS</div><h2>Practice in a<br /><span>contained space.</span></h2></div><p>Try basic concepts in browser-only simulations. These exercises do not run commands on your computer or connect to real systems.</p></div>
      <div className="lab-disclaimer"><LockKeyhole size={15} /><span><strong>SIMULATED ENVIRONMENT</strong> / No real commands, targets, or credentials are used here.</span></div>
      <div className="lab-shell">
        <div className="lab-tabs" role="tablist" aria-label="Practice simulations">
          <button role="tab" aria-selected={tab === 'terminal'} className={tab === 'terminal' ? 'lab-tab active' : 'lab-tab'} onClick={() => selectTab('terminal')}><TerminalSquare size={15} /> Demo terminal</button>
          <button role="tab" aria-selected={tab === 'network'} className={tab === 'network' ? 'lab-tab active' : 'lab-tab'} onClick={() => selectTab('network')}><Radio size={15} /> Network scenario</button>
          <button role="tab" aria-selected={tab === 'cipher'} className={tab === 'cipher' ? 'lab-tab active' : 'lab-tab'} onClick={() => selectTab('cipher')}><LockKeyhole size={15} /> Cipher playground</button>
          <span className="lab-tab-badge">LOCAL SIMULATION</span>
        </div>
        {tab === 'terminal' && <div className="sim-terminal" role="tabpanel"><div className="terminal-output" aria-live="polite">{output.map((line, index) => <div key={`${index}-${line}`} className={line.startsWith('learner@') ? 'terminal-line command-line' : 'terminal-line'}>{line}</div>)}</div><form className="terminal-form" onSubmit={submitCommand}><span aria-hidden="true">$</span><label className="sr-only" htmlFor="sim-command">Enter a demo command</label><input id="sim-command" value={command} onChange={event => setCommand(event.target.value)} placeholder="Try help" autoComplete="off" /><button type="submit" aria-label="Submit simulated command"><ArrowRight size={15} /></button></form><p className="sim-hint">Only fixed examples are shown. This is not a real terminal.</p></div>}
        {tab === 'network' && <div className="network-scenario" role="tabpanel"><div className="scenario-copy"><span className="path-number">SCENARIO / OFFICE NETWORK</span><h3>A device you don’t recognize</h3><p>A fictional office monitor shows a new device joined the guest network. It requested an address and has not reached any internal systems. What is the most careful next step?</p><div className="network-map" aria-label="Diagram: router connected to a laptop, printer, and unknown guest device"><div className="network-node router-node"><Radio size={20} /><span>ROUTER</span></div><div className="network-lines"><i /><i /><i /></div><div className="network-endpoints"><span><TerminalSquare />LAPTOP</span><span><LockKeyhole />PRINTER</span><span className="unknown-node"><CircleHelp />UNKNOWN</span></div></div></div><fieldset className="scenario-options"><legend>Choose a response</legend><label className={networkAnswer === 0 ? 'selected' : ''}><input type="radio" name="network-choice" checked={networkAnswer === 0} onChange={() => { setNetworkAnswer(0); setNetworkChecked(false) }} />Confirm the device owner and review guest-network policy</label><label className={networkAnswer === 1 ? 'selected' : ''}><input type="radio" name="network-choice" checked={networkAnswer === 1} onChange={() => { setNetworkAnswer(1); setNetworkChecked(false) }} />Assume it is malicious and erase all network records</label><label className={networkAnswer === 2 ? 'selected' : ''}><input type="radio" name="network-choice" checked={networkAnswer === 2} onChange={() => { setNetworkAnswer(2); setNetworkChecked(false) }} />Ignore it because it joined the guest network</label>{networkChecked && <p role="status" className="scenario-feedback"><Check size={15} /> Start by gathering context and following the organization’s process. A new device deserves a check, but one event alone does not tell the full story.</p>}<button type="button" className="check-answer" disabled={networkAnswer === null} onClick={() => setNetworkChecked(true)}>Review response <ArrowRight size={14} /></button></fieldset></div>}
        {tab === 'cipher' && <div className="cipher-playground" role="tabpanel"><div className="cipher-copy"><span className="path-number">CLASSICAL CIPHER / EDUCATIONAL TOY</span><h3>Shift the alphabet</h3><p>A Caesar cipher moves each letter by a fixed number of places. It is easy to understand and easy to break, so it must never be used to protect real information.</p><label className="cipher-input-label" htmlFor="cipher-message">Sample text</label><textarea id="cipher-message" value={cipherText} onChange={event => setCipherText(event.target.value)} rows={3} maxLength={180} /></div><div className="cipher-controls"><label className="shift-control" htmlFor="cipher-shift">Shift amount <span>{shift}</span></label><input id="cipher-shift" type="range" min="1" max="25" value={shift} onChange={event => setShift(Number(event.target.value))} /><div className="cipher-mode"><button className={!decode ? 'selected' : ''} onClick={() => setDecode(false)}>Encode</button><button className={decode ? 'selected' : ''} onClick={() => setDecode(true)}>Decode</button></div><div className="cipher-result"><span>{decode ? 'DECODED TEXT' : 'ENCODED TEXT'}</span><output aria-live="polite">{caesar(cipherText, decode ? -shift : shift) || 'Your result appears here'}</output></div><p className="cipher-warning"><RotateCcw size={14} /> Educational example only. Caesar ciphers provide no meaningful security.</p></div></div>}
      </div>
    </div>
  </section>
}

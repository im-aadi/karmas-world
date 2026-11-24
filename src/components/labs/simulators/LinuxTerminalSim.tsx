import { useState, useRef, useEffect, type FormEvent } from 'react'
import { Terminal, CornerDownLeft, RotateCcw, HelpCircle } from 'lucide-react'

interface LinuxTerminalSimProps {
  files?: Record<string, string>
}

export function LinuxTerminalSim({ files = {} }: LinuxTerminalSimProps) {
  const [currentDir, setCurrentDir] = useState('/home/learner')
  const [input, setInput] = useState('')
  const [history, setHistory] = useState<string[]>([
    'KARMA CYBERSECURITY OS v2.4 (Ubuntu 24.04 LTS x86_64)',
    'Simulated contained bash session. Type "help" for supported commands.',
    '----------------------------------------------------------------------',
  ])
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView?.({ behavior: 'smooth' })
  }, [history])

  function handleCommand(e: FormEvent) {
    e.preventDefault()
    const raw = input.trim()
    if (!raw) return

    const newHistory = [...history, `learner@karma-ws:${currentDir}$ ${raw}`]
    const parts = raw.split(' ')
    const cmd = parts[0].toLowerCase()
    const args = parts.slice(1)

    switch (cmd) {
      case 'clear':
        setHistory([])
        setInput('')
        return

      case 'help':
        newHistory.push(
          'Supported commands:',
          '  ls [-la]       - List files in current or target directory',
          '  cd <dir>       - Change directory',
          '  pwd            - Print working directory',
          '  cat <file>     - Display file contents',
          '  grep <p> <f>   - Search for pattern in file',
          '  find <path>    - Search files (e.g. find / -perm -4000)',
          '  whoami / id    - Display user identity',
          '  ps [aux]       - Display active processes',
          '  clear          - Clear terminal screen'
        )
        break

      case 'pwd':
        newHistory.push(currentDir)
        break

      case 'whoami':
        newHistory.push('learner')
        break

      case 'id':
        newHistory.push('uid=1000(learner) gid=1000(learner) groups=1000(learner),27(sudo)')
        break

      case 'ps':
        newHistory.push(
          'PID TTY          TIME CMD',
          '  1 ?        00:00:01 systemd',
          '412 pts/0    00:00:00 bash',
          '1021 ?       00:00:02 sshd',
          '4198 ?       00:00:00 custom_backup (SUID)',
          '5210 pts/0    00:00:00 ps'
        )
        break

      case 'cd': {
        const target = args[0] || '/home/learner'
        if (target === '~' || target === '/home/learner') {
          setCurrentDir('/home/learner')
        } else if (target === '..') {
          if (currentDir === '/home/learner') setCurrentDir('/home')
          else if (currentDir === '/var/log') setCurrentDir('/var')
          else if (currentDir !== '/') setCurrentDir('/')
        } else if (target === '/var/log' || target === 'log' && currentDir === '/var') {
          setCurrentDir('/var/log')
        } else if (target === '/opt' || target === '/etc') {
          setCurrentDir(target)
        } else if (target === '/') {
          setCurrentDir('/')
        } else {
          newHistory.push(`bash: cd: ${target}: No such file or directory`)
        }
        break
      }

      case 'ls': {
        const isAll = args.includes('-la') || args.includes('-a') || args.includes('-al')
        if (currentDir === '/home/learner') {
          if (isAll) {
            newHistory.push(
              'drwxr-xr-x 2 learner learner 4096 Nov 23 03:00 .',
              'drwxr-xr-x 3 root    root    4096 Nov 23 02:45 ..',
              '-rw------- 1 learner learner   78 Nov 23 03:02 .secret_vault',
              '-rw-r--r-- 1 learner learner  112 Nov 23 03:05 notes.txt'
            )
          } else {
            newHistory.push('notes.txt')
          }
        } else if (currentDir === '/var/log') {
          newHistory.push('auth.log  syslog  dpkg.log  nginx/')
        } else if (currentDir === '/opt') {
          newHistory.push('backdoor_audit/')
        } else if (currentDir === '/etc') {
          newHistory.push('passwd  shadow  group  hostname')
        } else {
          newHistory.push('bin   etc   home   opt   root   tmp   usr   var')
        }
        break
      }

      case 'cat': {
        const fileTarget = args[0]
        if (!fileTarget) {
          newHistory.push('cat: missing file operand')
          break
        }

        let fullPath = fileTarget
        if (!fileTarget.startsWith('/')) {
          fullPath = `${currentDir === '/' ? '' : currentDir}/${fileTarget}`
        }

        if (files[fullPath]) {
          newHistory.push(files[fullPath])
        } else if (fullPath === '/etc/shadow') {
          newHistory.push('cat: /etc/shadow: Permission denied')
        } else {
          newHistory.push(`cat: ${fileTarget}: No such file or directory`)
        }
        break
      }

      case 'grep': {
        if (args.length < 2) {
          newHistory.push('grep: usage: grep <pattern> <file>')
          break
        }
        const pattern = args[0].replace(/['"]/g, '')
        const file = args[1]
        let fullPath = file
        if (!file.startsWith('/')) {
          fullPath = `${currentDir === '/' ? '' : currentDir}/${file}`
        }

        const content = files[fullPath]
        if (content) {
          const lines = content.split('\n')
          const matches = lines.filter((l) => l.toLowerCase().includes(pattern.toLowerCase()))
          if (matches.length > 0) {
            newHistory.push(...matches)
          }
        } else {
          newHistory.push(`grep: ${file}: No such file or directory`)
        }
        break
      }

      case 'find': {
        if (args.join(' ').includes('-perm -4000')) {
          newHistory.push(
            '/usr/bin/passwd',
            '/usr/bin/sudo',
            '/usr/bin/chsh',
            '/opt/backdoor_audit/flag.txt',
            '/usr/bin/custom_backup (VULNERABLE SUID BINARY)'
          )
        } else {
          newHistory.push(
            '/home/learner/notes.txt',
            '/home/learner/.secret_vault',
            '/var/log/auth.log',
            '/opt/backdoor_audit/flag.txt'
          )
        }
        break
      }

      default:
        newHistory.push(`bash: ${cmd}: command not found. Type "help" for allowed commands.`)
    }

    setHistory(newHistory)
    setInput('')
  }

  return (
    <div className="terminal-container">
      <div className="terminal-header">
        <div className="terminal-dots">
          <span className="dot dot-red" />
          <span className="dot dot-yellow" />
          <span className="dot dot-green" />
        </div>
        <div className="terminal-title">
          <Terminal size={14} className="inline mr-1" />
          learner@karma-ws: {currentDir}
        </div>
        <button
          type="button"
          onClick={() => setHistory(['Terminal cleared.'])}
          className="terminal-action-btn"
          title="Clear screen"
        >
          <RotateCcw size={13} />
        </button>
      </div>

      <div className="terminal-body" tabIndex={0} aria-label="Simulated Terminal Window">
        {history.map((line, i) => (
          <div key={i} className="terminal-text-line">
            {line}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleCommand} className="terminal-prompt-form">
        <span className="terminal-prompt-label">learner@karma-ws:{currentDir}$</span>
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type command (e.g. ls -la, cat .secret_vault)..."
          className="terminal-input"
          autoFocus
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="terminal-submit-btn" aria-label="Execute command">
          <CornerDownLeft size={14} />
        </button>
      </form>

      <div className="terminal-footer">
        <HelpCircle size={12} className="inline mr-1" />
        Simulated in-browser environment. Commands are safely parsed inside the browser.
      </div>
    </div>
  )
}

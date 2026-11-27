import type { Lesson } from '../courses'

export const advancedCurriculum: Record<string, Lesson[]> = {
  'course-forensics': [
    {
      title: 'Evidence Acquisition & Hash Verification',
      duration: '9 min',
      body: [
        'Digital Forensics is the scientific identification, preservation, examination, and analysis of digital evidence. The foremost legal principle in forensics is the Chain of Custody: meticulous documentation tracking every individual who possessed, collected, transported, and examined the evidence.',
        'During evidence acquisition, the original storage drive must NEVER be booted or analyzed directly. Investigators connect the suspect media to hardware Write Blockers (which intercept and block write commands at the controller layer while allowing read commands) or use bootable Linux forensic environments (CAINE, Paladin) with read-only mounts.',
        'A bit-stream forensic image creates a bit-for-bit duplicate of the physical drive, capturing allocated space, unallocated space, and slack space where deleted files reside. Standard forensic image formats include raw/dd (`.raw`, `.img`) and Expert Witness Format (`.E01`), which embeds case metadata and chunk hashes. Before and immediately after imaging, cryptographic hashes (MD5 and SHA-256) are calculated. If the post-acquisition image hash matches the physical drive hash, evidence integrity is proven admissible in court.'
      ],
      takeaway: 'Hardware write blockers prevent evidence alteration; bit-stream images verified with SHA-256 hashes ensure legal admissibility in court.',
      question: 'Why must forensic investigators calculate cryptographic hashes (e.g., SHA-256) of a physical storage drive before and after imaging?',
      options: [
        'To mathematically prove that the forensic copy is identical and that no evidence was altered or tampered with',
        'To speed up the disk copying process by 50%',
        'To automatically format the suspect hard drive',
        'To decrypt all user passwords stored on the drive'
      ],
      answer: 0,
      explanation: 'Matching cryptographic hashes proves that the bit-stream image is an exact, unaltered bit-for-bit replica of the original physical media, fulfilling the legal requirements of evidence integrity and chain of custody.'
    },
    {
      title: 'File System Analysis (MFT, Inodes)',
      duration: '9 min',
      body: [
        'Operating systems organize data on storage media using filesystems. In Windows NTFS, the central database is the Master File Table ($MFT). Every file and directory possesses at least one 1024-byte record in the $MFT describing its metadata and attributes.',
        'Key $MFT attributes include: `$STANDARD_INFORMATION` ($SI, holding MACB timestamps: Modified, Accessed, Created, MFT-modified) and `$FILE_NAME` ($FN, holding secondary timestamps set by the filesystem). Attackers often alter $SI timestamps using "Timestomping" utilities to hide dropped malware, but they frequently fail to alter $FN timestamps, exposing the manipulation under forensic analysis.',
        'In Linux Ext4 filesystems, files are tracked via Inodes. An inode stores file permissions, owner UID, group GID, file size, data block pointers, and timestamps (atime, mtime, ctime, crtime). When a file is deleted in either filesystem, the operating system simply marks the inode or MFT record as inactive and the storage blocks as unallocated. Forensic data carving tools (Scalpel, PhotoRec) can recover deleted files by scanning unallocated clusters for known file header and footer signatures (Magic Bytes).'
      ],
      takeaway: 'Discrepancies between $STANDARD_INFORMATION and $FILE_NAME timestamps expose Timestomping; data carving recovers deleted files from unallocated clusters.',
      question: 'What anti-forensics technique involves modifying file timestamps to blend malicious tools into legitimate operating system directories?',
      options: [
        'Timestomping',
        'Process Hollowing',
        'DLL Sideloading',
        'Pass-the-Hash'
      ],
      answer: 0,
      explanation: 'Timestomping alters the $STANDARD_INFORMATION file timestamps (MACB) to match legitimate operating system binaries (e.g. 2018 install dates), attempting to deceive chronological forensic triage.'
    },
    {
      title: 'Windows Execution Artifacts (Prefetch, Amcache)',
      duration: '9 min',
      body: [
        'When investigating an intrusion on a Windows endpoint, forensic analysts must answer the fundamental question: "Did this specific program execute?" Windows maintains multiple forensic execution artifacts designed to optimize performance and backward compatibility.',
        'Windows Prefetch files (`C:\\Windows\\Prefetch\\*.pf`) are created to speed up application startup. A prefetch file records: the executable name, the run count, the last 8 execution timestamps, and a list of all files, DLLs, and directories referenced by the binary during its first 10 seconds of execution. Even if an attacker deletes their malware binary from disk, the corresponding `.pf` file remains, proving execution.',
        'Other crucial execution artifacts include: Amcache (`Amcache.hve`, recording application file paths, un-truncated SHA-1 hashes, and compile timestamps), Shimcache (Application Compatibility Cache in the SYSTEM registry hive, recording recent executable executions across system reboots), UserAssist (tracking GUI program executions by user), and Shellbags (proving user folder navigation).'
      ],
      takeaway: 'Windows Prefetch files and Amcache record execution history, run counts, timestamps, and full file hashes even after malware binaries are deleted.',
      question: 'What evidence does a Windows Prefetch file (.pf) provide during a forensic intrusion investigation?',
      options: [
        'It proves a binary executed, recording run counts, execution timestamps, and loaded DLL dependencies',
        'It contains a recording of user keystrokes',
        'It stores Wi-Fi encryption passphrases',
        'It contains full memory dumps of the graphics card'
      ],
      answer: 0,
      explanation: 'Windows Prefetch files prove program execution, capturing the application name, execution count, last run times, and a list of all DLLs and files loaded during execution.'
    },
    {
      title: 'RAM Acquisition & Volatility Basics',
      duration: '10 min',
      body: [
        'Volatile Memory (RAM) holds ephemeral evidence that disappears the instant a machine powers down: running processes, unencrypted network sockets, decrypted BitLocker keys, injected shellcode, plaintext passwords, and unpacked malware running entirely in-memory.',
        'RAM acquisition must occur while the suspect machine is powered on. Responders deploy specialized kernel-level memory capture tools (e.g., WinPmem, DumpIt, or LiME for Linux) or capture hypervisor memory states (`.vmem`) in virtualized environments.',
        'The Volatility 3 framework is the premier open-source tool for volatile memory analysis. Key Volatility plugins include: `windows.pslist` (enumerates active processes via the active process links), `windows.pstree` (visualizes parent-child process relationships), `windows.malfind` (detects injected code, identifying memory segments with PAGE_EXECUTE_READWRITE permissions containing executable PE headers), and `windows.netscan` (identifies active and closed TCP/UDP network connections).'
      ],
      takeaway: 'Volatile memory captures decrypted keys and fileless malware; Volatility\'s `malfind` plugin detects hidden code injections with RWX memory protections.',
      question: 'Which Volatility 3 plugin is specialized for discovering hidden or injected code segments in memory with suspicious PAGE_EXECUTE_READWRITE permissions?',
      options: [
        'windows.malfind',
        'windows.info',
        'windows.crashinfo',
        'windows.filescan'
      ],
      answer: 0,
      explanation: 'The `windows.malfind` plugin scans process memory for memory allocations marked with Read, Write, and Execute (RWX) permissions that contain assembly opcodes or hidden PE headers, flagging code injection.'
    },
    {
      title: 'Network PCAP Reconstruction',
      duration: '8 min',
      body: [
        'Network Forensics captures and inspects network traffic to reconstruct attacker communications, command-and-control (C2) channels, and data exfiltration. The standard capture format is PCAP / PCAPNG, generated by `tcpdump`, Wireshark, or enterprise TAP appliances.',
        'When analyzing a PCAP file in Wireshark or via command line with `tshark`, analysts apply display filters: `http.request.method == "POST"` to find submitted data, `dns.flags.response == 0` for queries, or `tcp.flags.reset == 1` for aborted handshakes. Wireshark\'s "Follow TCP Stream" feature reassembles out-of-order packets into readable bidirectional conversation transcripts.',
        'Forensic reconstruction includes extracting transferred files: Wireshark\'s "Export Objects" (File → Export Objects → HTTP / SMB / IMF) reconstructs files transferred in cleartext across the network, allowing analysts to extract downloaded malware binaries or exfiltrated ZIP archives directly from raw packet streams.'
      ],
      takeaway: 'Following TCP streams and using Export Objects in Wireshark allows analysts to extract transferred files and reconstruct attacker communications.',
      question: 'Which Wireshark feature reconstructs raw packet fragments into the complete file downloaded by a user over HTTP or SMB during a network capture?',
      options: [
        'Export Objects (File → Export Objects)',
        'Capture Filters',
        'Interface Options',
        'Coloring Rules'
      ],
      answer: 0,
      explanation: 'Wireshark\'s Export Objects feature extracts complete reassembled application payloads (files, images, scripts) transmitted over protocols like HTTP, SMB, and IMF directly from packet streams.'
    },
    {
      title: 'Forensic Timeline Building',
      duration: '9 min',
      body: [
        'An incident investigation reaches its climax during Timeline Analysis. Building an integrated chronological timeline allows investigators to reconstruct the exact second-by-second sequence of adversary actions from initial compromise to containment.',
        'Super-timelines aggregate data from all available forensic sources: filesystem MACB timestamps ($MFT), Windows Event Logs, Prefetch executions, Registry modifications, browser history, and network logs. Open-source tools like Plaso (`log2timeline`) extract and normalize hundreds of forensic artifact types into a unified CSV or Elasticsearch timeline.',
        'Timeline analysis exposes adversary dwell time and lateral movement: e.g., viewing an anomalous Event 4624 login at 03:14:22 UTC, followed by a Prefetch execution of `whoami.exe` at 03:14:35, followed by the creation of an unexpected `.zip` file in `C:\\Users\\Public` at 03:16:01, followed by an outbound connection to an unknown IP over port 443 at 03:16:45.'
      ],
      takeaway: 'Super-timelines aggregate MFT, Event Logs, Prefetch, and network telemetry to reconstruct the complete adversary intrusion narrative.',
      question: 'What is a "Super-Timeline" in digital forensics, and what tool is widely recognized for generating them?',
      options: [
        'An aggregated chronological timeline combining filesystem timestamps, event logs, and registry artifacts, generated by Plaso (log2timeline)',
        'A social media timeline of cyber attacks',
        'A hardware countdown timer on the CPU',
        'A network cable testing protocol'
      ],
      answer: 0,
      explanation: 'A super-timeline synthesizes timestamps across every available endpoint and network artifact into one unified chronological narrative, standardized by tools like Plaso/log2timeline.'
    }
  ],

  'course-malware': [
    {
      title: 'PE Header Breakdown & Sections',
      duration: '9 min',
      body: [
        'Malware analysis on Windows begins with understanding the Portable Executable (PE) file format. The PE format (32-bit PE32 and 64-bit PE32+) structures executable files (.exe), dynamic link libraries (.dll), and device drivers (.sys).',
        'A PE file begins with the legacy DOS Header (starting with Magic Bytes `MZ` / `0x4D5A`), containing the `e_lfanew` pointer to the modern PE Header (starting with `PE\\0\\0`). The PE Header contains the File Header (specifying target machine architecture, number of sections, and compile timestamp) and the Optional Header (specifying the AddressOfEntryPoint where execution begins, ImageBase, and Subsystem: GUI vs Console).',
        'Following the headers is the Section Table, defining contiguous memory sections: `.text` (contains executable machine code opcodes, marked executable), `.data` (contains initialized global variables, marked read-write), `.rdata` (read-only data, string constants, and import tables), and `.rsrc` (resources like icons, menus, and embedded binaries). Anomalous sections (e.g., `.UPX0`, `.themida`, or sections marked with both Write and Execute permissions) immediately signal packed or obfuscated malware.'
      ],
      takeaway: 'The PE header structures Windows executables; sections marked with both Write and Execute (W+X) permissions strongly indicate packed malware.',
      question: 'Which two-byte Magic Byte ASCII sequence appears at the very beginning of all Windows Portable Executable (PE) files?',
      options: [
        'MZ (0x4D 0x5A)',
        'PK (0x50 0x4B)',
        '%PDF (0x25 0x50)',
        'ELF (0x7F 0x45)'
      ],
      answer: 0,
      explanation: 'The initial two bytes of any Windows PE file are `MZ` (0x4D 0x5A), named after Mark Zbikowski, one of the original MS-DOS designers.'
    },
    {
      title: 'String Extraction & Entropy Analysis',
      duration: '8 min',
      body: [
        'Static triage assesses a binary without running it. The first triage step is extracting human-readable strings using the Unix `strings` command or Sysinternals `strings.exe`, searching for ASCII and Unicode sequences of 4 or more characters.',
        'Extracted strings reveal high-value intelligence: hardcoded C2 IP addresses, domain names, file paths, registry keys, error messages, and internal function names. For example, finding strings like `cmd.exe /c whoami`, `vssadmin.exe delete shadows`, and `.locked` strongly suggests ransomware.',
        'Entropy Analysis calculates the randomness of data within a file, measured between 0.0 (completely uniform/ordered) and 8.0 (completely random, maximum Shannon entropy). Normal compiled code and text sections typically have an entropy score between 4.0 and 6.5. An entropy score above 7.0 across a PE section indicates that the code is either encrypted or compressed with an executable packer (e.g., UPX, Themida, VMProtect).'
      ],
      takeaway: 'Extracted strings provide immediate clues about binary intent; Shannon entropy above 7.0 signifies encryption or packing.',
      question: 'What does a Shannon entropy score exceeding 7.2 in a binary\'s `.text` code section typically indicate to a malware analyst?',
      options: [
        'The section contents are encrypted or packed with an obfuscation tool',
        'The file is corrupted and will not run on any computer',
        'The program was written in HTML',
        'The binary was compiled before 1995'
      ],
      answer: 0,
      explanation: 'High entropy (approaching 8.0) reflects extreme randomness, which is the mathematical hallmark of encrypted data or compressed code generated by packers.'
    },
    {
      title: 'Import & Export Table Inspection',
      duration: '8 min',
      body: [
        'Windows executables rarely interact with hardware directly; instead, they rely on Windows APIs provided by system DLLs (such as `kernel32.dll`, `user32.dll`, `ntdll.dll`, `ws2_32.dll`). The Import Address Table (IAT) lists the external functions the binary imports at runtime.',
        'Analyzing imported API functions reveals the binary\'s intended capabilities: `WSAStartup`, `connect`, `send` indicate network communication; `CryptEncrypt`, `CryptDeriveKey` indicate encryption routines; `CreateRemoteThread`, `VirtualAllocEx`, `WriteProcessMemory` indicate Process Injection; and `RegSetValueEx` indicates persistence modifications.',
        'Conversely, if an analyst inspects an executable that imports only two or three basic functions (e.g., `LoadLibraryA` and `GetProcAddress`), this is a classic signature of a Packed binary. The small executable is merely a "stub" designed to allocate memory, decrypt the real payload hidden in its resource section, and execute it in memory.'
      ],
      takeaway: 'The Import Address Table (IAT) exposes intended OS capabilities; binaries importing only `LoadLibraryA` and `GetProcAddress` indicate packed payloads.',
      question: 'Which trio of Windows API functions listed in an executable\'s Import Address Table (IAT) strongly indicates Process Injection capabilities?',
      options: [
        'VirtualAllocEx, WriteProcessMemory, and CreateRemoteThread',
        'GetSystemTime, SetCursorPos, and Beep',
        'MessageBoxA, ExitProcess, and DrawText',
        'PrintWindow, CloseHandle, and Sleep'
      ],
      answer: 0,
      explanation: '`VirtualAllocEx` allocates memory in a foreign process, `WriteProcessMemory` writes payload shellcode into that space, and `CreateRemoteThread` spawns a thread to execute it—the classic process injection sequence.'
    },
    {
      title: 'Isolated Sandbox Architecture',
      duration: '8 min',
      body: [
        'Dynamic malware analysis involves executing the sample in a controlled environment to observe its runtime behavior. Because live malware will attempt to compromise its host, execute ransomware, or spread across the LAN, strict isolation is paramount.',
        'A proper analysis sandbox utilizes dedicated, air-gapped hardware or isolated virtual machines with non-persistent snapshots (allowing instantaneous rollback to a pristine state after each detonation). The sandbox virtual network must be configured in Host-Only or Private mode.',
        'To observe network behavior safely without permitting malware to connect to real-world command-and-control servers or participate in DDoS attacks, analysts deploy INetSim or FakeNet-NG. These fake network simulators intercept outbound traffic, mimic standard internet services (DNS, HTTP, HTTPS, SMTP, FTP), return realistic fake responses, and log all network requests for analysis.'
      ],
      takeaway: 'Dynamic analysis requires air-gapped sandboxes with snapshot rollbacks; INetSim simulates internet services to capture C2 requests safely.',
      question: 'What is the purpose of tools like INetSim or FakeNet-NG in a malware analysis sandbox environment?',
      options: [
        'They simulate standard Internet protocols (DNS, HTTP) on an isolated network to safely log malware C2 communications',
        'They accelerate malware execution by overclocking the CPU',
        'They compile the source code into assembly',
        'They delete the malware binary automatically'
      ],
      answer: 0,
      explanation: 'Fake network simulators like INetSim emulate public Internet services inside the isolated lab, tricking malware into believing it has connected to the Internet so it reveals its secondary payloads and C2 commands.'
    },
    {
      title: 'Process & Network Activity Monitoring',
      duration: '9 min',
      body: [
        'During dynamic execution, analysts observe the sample\'s interaction with the operating system in real time using Sysinternals monitoring tools: Process Monitor (ProcMon), Process Explorer (ProcExp), and TCPView.',
        'ProcMon captures all low-level system activity with microsecond precision, recording: Process and Thread Activity, File System Activity (files created, modified, or deleted), and Registry Activity (keys read, written, or queried). Analysts filter ProcMon to isolate the malware process PID, uncovering dropped files and startup registry additions.',
        'RegShot is used to take system snapshots before and after detonation. By comparing the two snapshots, RegShot produces a clear text differential report highlighting every single file and registry modification made during execution.',
        'Many modern malware samples incorporate Anti-Analysis and Anti-VM detection routines (e.g., querying CPUID, checking for VMware/VirtualBox hardware strings, checking screen resolutions, or detecting debugging hooks with `IsDebuggerPresent`). Analysts must patch these checks or use hardened sandboxes to observe true behavior.'
      ],
      takeaway: 'ProcMon and RegShot capture file, process, and registry modifications during execution; malware uses anti-VM checks to evade analysis.',
      question: 'Which tool allows malware analysts to take "before" and "after" snapshots of the filesystem and registry to produce a clear differential report of malware changes?',
      options: [
        'RegShot',
        'Wireshark',
        'Nmap',
        'Hashcat'
      ],
      answer: 0,
      explanation: 'RegShot is a lightweight utility that takes two registry/filesystem snapshots and compares them, generating a text log detailing every modified, added, or deleted key and file.'
    },
    {
      title: 'YARA Rule Authoring for Malware Signatures',
      duration: '9 min',
      body: [
        'Once a malware sample is analyzed, defenders must create detection signatures to detect the malware family across the enterprise. YARA is the industry-standard pattern-matching language designed to identify and classify malware samples based on textual and binary patterns.',
        'A YARA rule consists of three sections: Metadata (`meta:` author, date, description, hash), Strings (`strings:` text strings, hex byte sequences, or regular expressions), and Conditions (`condition:` boolean logic defining when the rule triggers).',
        'For example: `rule Trojan_Backdoor_Example { meta: description = "Detects custom reverse shell" strings: $mz = "MZ" $s1 = "cmd.exe /c powershell -enc" ascii $hex = { 6A 00 68 ?? ?? ?? ?? 50 E8 } condition: $mz at 0 and ($s1 or $hex) and filesize < 500KB }`. YARA integrates into EDR sensors, email gateways, and threat intelligence platforms to automate file scanning.'
      ],
      takeaway: 'YARA rules match strings, hex byte sequences, and binary conditions to create reusable signatures that classify malware families.',
      question: 'In a YARA rule, what section defines the boolean logic and criteria that must be satisfied for a file to trigger a detection match?',
      options: [
        'condition:',
        'meta:',
        'strings:',
        'headers:'
      ],
      answer: 0,
      explanation: 'The `condition:` section contains the boolean expressions (referencing the defined strings, file sizes, or offsets) that determine whether the rule triggers.'
    }
  ],

  'course-incident-response': [
    {
      title: 'Building Incident Response Playbooks',
      duration: '9 min',
      body: [
        'Incident Response (IR) is the structured methodology organizations employ to manage cybersecurity breaches and minimize damage, downtime, and financial loss. The two primary industry frameworks governing IR are NIST SP 800-61 Rev. 2 and the SANS 6-Step Incident Handling Process.',
        'The IR lifecycle comprises six phases: 1. Preparation (establishing the Incident Response Team, authoring playbooks, provisioning forensic tools, configuring logging); 2. Identification (detecting and scoping anomalous activity); 3. Containment (short-term isolation to prevent spread); 4. Eradication (removing malware, backdoors, and compromised accounts); 5. Recovery (safely restoring systems to production); 6. Lessons Learned (post-mortem review and defensive hardening).',
        'Standardized Playbooks document step-by-step procedures for specific incident categories: Ransomware, Business Email Compromise (BEC), Distributed Denial of Service (DDoS), Insider Threat, and Supply Chain Compromise. Having documented playbooks eliminates confusion and panic during high-stress live crises.'
      ],
      takeaway: 'The NIST 800-61 lifecycle (Prepare, Detect, Contain, Eradicate, Recover, Post-Mortem) guides structured breach response via playbooks.',
      question: 'What is the correct chronological sequence of the six phases in the industry-standard Incident Response lifecycle?',
      options: [
        'Preparation → Identification → Containment → Eradication → Recovery → Lessons Learned',
        'Eradication → Recovery → Containment → Identification → Preparation → Lessons Learned',
        'Identification → Preparation → Recovery → Eradication → Containment → Lessons Learned',
        'Containment → Eradication → Recovery → Lessons Learned → Preparation → Identification'
      ],
      answer: 0,
      explanation: 'The canonical sequence begins with Preparation, followed by Identification of the threat, Containment of its spread, Eradication of artifacts, Recovery to normal operations, and finally Lessons Learned.'
    },
    {
      title: 'Initial Scoping & Threat Isolation',
      duration: '8 min',
      body: [
        'When an incident is confirmed, responders must perform Initial Scoping to determine the true breadth and depth of the intrusion. A critical error is scoping too narrowly: isolating a single workstation while failing to recognize that the attacker already harvested domain credentials and pivoted to five other servers.',
        'Scoping establishes: 1. What systems are affected? 2. What user accounts are compromised? 3. What is the attacker\'s current objective (data theft, ransomware staging, espionage)? 4. When did the initial intrusion occur (determining dwell time)?',
        'Threat Isolation prevents the adversary from taking further destructive action (e.g., executing ransomware) or exfiltrating additional data. Modern EDR platforms support Host Isolation, severing all network communication at the OS NDIS driver level while preserving a single encrypted tunnel back to the security console for live forensic investigation.'
      ],
      takeaway: 'Comprehensive scoping identifies all affected accounts and endpoints; EDR host isolation severs network access while maintaining forensic consoles.',
      question: 'Why is EDR software network isolation preferred over physically pulling the network cable during a live endpoint investigation?',
      options: [
        'EDR isolation maintains an active management channel for live forensic memory triage while severing all adversary lateral traffic',
        'Pulling the network cable permanently deletes the hard drive',
        'EDR isolation increases the network speed of the local router',
        'Pulling the network cable alerts the local power company'
      ],
      answer: 0,
      explanation: 'EDR host isolation cuts off all local and Internet network communication while keeping an encrypted management connection open, allowing responders to collect memory and logs remotely.'
    },
    {
      title: 'Short-term vs. Long-term Containment',
      duration: '8 min',
      body: [
        'Containment strategies are divided into Short-term and Long-term measures to mitigate business impact while preserving critical evidence.',
        'Short-term Containment focuses on immediate risk mitigation to stop active harm: network-isolating endpoints, disabling or resetting compromised Active Directory user accounts, blocking malicious C2 domain names and IP addresses at the perimeter firewall, and revoking active OAuth tokens and VPN sessions.',
        'Long-term Containment focuses on hardening the environment while preparing for eradication: applying firewall micro-segmentation around compromised subnets, routing suspicious subnets through sandboxed honeytokens or full-packet inspection TAPs, and building clean replacement infrastructure in parallel. Rushing to eradicate before full containment alerts the attacker, who may deploy destructive ransomware or alternative backdoors.'
      ],
      takeaway: 'Contain the adversary completely before beginning eradication; alerting the attacker prematurely risks retaliatory ransomware detonation.',
      question: 'Why should incident responders avoid prematurely killing known attacker sessions before the full scope of the intrusion is contained?',
      options: [
        'Alerting the adversary can cause them to trigger alternative dormant backdoors or immediately detonate destructive ransomware',
        'It causes the internet service provider to cancel the corporate contract',
        'It reduces the CPU clock speed of the servers',
        'It violates copyright licensing laws'
      ],
      answer: 0,
      explanation: 'If an adversary realizes they are being ejected before all their access paths are severed, they frequently detonate wiper malware or ransomware, or retreat into secondary persistence channels.'
    },
    {
      title: 'Eradicating Persistent Footholds',
      duration: '9 min',
      body: [
        'Eradication permanently removes all components of the adversary\'s presence from the environment. Simply running an antivirus scan is never sufficient to remediate an advanced persistent threat (APT).',
        'Eradication tasks include: 1. Terminating rogue processes; 2. Deleting web shells and dropped backdoor binaries; 3. Removing persistence mechanisms across registry Run keys, scheduled tasks, WMI event subscriptions, systemd units, and rogue cron jobs; 4. Rebuilding compromised operating systems from known-good golden images; 5. Patching the root vulnerability that permitted initial entry.',
        'In Active Directory environments, enterprise eradication requires a double reset of the `krbtgt` account password. The `krbtgt` account encrypts all Kerberos Ticket Granting Tickets (TGTs); resetting it twice invalidates any Golden Tickets forged by the attacker, permanently severing domain-level persistence.'
      ],
      takeaway: 'Eradication removes backdoors, registry Run keys, and WMI subscriptions; an Active Directory double `krbtgt` reset revokes forged Golden Tickets.',
      question: 'What crucial Active Directory remediation step must be performed twice during enterprise breach eradication to invalidate forged Kerberos Golden Tickets?',
      options: [
        'Resetting the password of the `krbtgt` domain service account',
        'Rebooting the local internet router',
        'Formatting the domain controller C: drive',
        'Changing the corporate domain name'
      ],
      answer: 0,
      explanation: 'Golden Tickets are encrypted with the `krbtgt` account key; resetting the `krbtgt` password twice (accounting for Kerberos ticket lifetime history) invalidates all forged tickets across the domain.'
    },
    {
      title: 'Safe System Restoration & Monitoring',
      duration: '8 min',
      body: [
        'Recovery is the process of safely restoring affected systems back into production operations. Rushing recovery without verification risks reintroducing latent backdoors or unpatched vulnerabilities.',
        'Recovery best practices mandate restoring systems from verified, clean backups taken prior to the known compromise date, or deploying freshly built golden images. All system and administrative credentials must be reset globally before restoring network connectivity.',
        'Once systems are restored, Enhanced Monitoring is instituted for 30 to 90 days. SOC teams configure high-sensitivity alerting on the restored assets, watching for anomalous connection attempts, beaconing, or reactivation of known threat actor indicators of compromise (IOCs).'
      ],
      takeaway: 'Restore systems from verified pre-compromise backups or clean golden images, accompanied by global credential resets and 30-90 days of heightened monitoring.',
      question: 'Why should systems be restored from backups created prior to the confirmed initial compromise date rather than the most recent nightly backup?',
      options: [
        'Recent backups likely contain the attacker\'s dormant backdoors, web shells, and persistence mechanisms',
        'Older backups take less hard drive space',
        'Recent backups are automatically encrypted by the operating system',
        'Older backups run faster on the network'
      ],
      answer: 0,
      explanation: 'If a threat actor maintained dwell time for weeks, recent backups contain the attacker\'s hidden backdoors and compromised accounts, which would immediately reinfect the restored environment.'
    },
    {
      title: 'Post-Mortem Analysis & Executive Reporting',
      duration: '8 min',
      body: [
        'The final, most enduring phase of Incident Response is the Lessons Learned (Post-Mortem) meeting. Held within two weeks of incident closure, this meeting brings together engineering, IT, legal, communications, and executive leadership.',
        'The post-mortem answers critical retrospective questions: What happened, and at what exact times? How well did the staff and playbooks perform? Were log sources sufficient, or were there blind spots? What indicators should be added to detection engineering? What security controls would have prevented the breach entirely?',
        'The team produces a comprehensive Post-Incident Report, which serves two audiences: A technical breakdown for engineering to implement architectural improvements, and an Executive Summary detailing business impact, regulatory notifications (GDPR 72-hour notifications, SEC disclosures), and cyber insurance recovery.'
      ],
      takeaway: 'Post-mortem meetings review what happened, identify telemetry blind spots, and drive systemic architectural hardening across the enterprise.',
      question: 'What is the primary purpose of holding a formal "Lessons Learned" meeting following the resolution of a major security breach?',
      options: [
        'To identify process failures and technical blind spots to prevent similar future incidents from succeeding',
        'To assign blame and fire the junior IT technician',
        'To delete all incident logs from company records',
        'To celebrate without writing any documentation'
      ],
      answer: 0,
      explanation: 'The lessons learned meeting conducts a blameless, objective review to evaluate how the defense performed, close logging gaps, update playbooks, and implement controls preventing recurrence.'
    }
  ],

  'course-threat-intel': [
    {
      title: 'Strategic, Operational & Tactical Intelligence',
      duration: '8 min',
      body: [
        'Cyber Threat Intelligence (CTI) is evidence-based knowledge about adversaries, including their motivations, capabilities, infrastructure, and Tactics, Techniques, and Procedures (TTPs). CTI operates at three distinct organizational tiers: Strategic, Operational, and Tactical.',
        'Strategic CTI is tailored for C-suite executives and board directors. It focuses on broad business risks, geopolitical threat trends, financial impacts, and adversary motivations (e.g., nation-state espionage vs. cybercriminal extortion), informing long-term security investments and risk governance.',
        'Operational CTI focuses on specific adversary campaigns and capabilities. It tracks threat actor groups (APTs), anticipated targets, and campaign timing, assisting SOC managers and threat hunters. Tactical CTI focuses on technical TTPs and Indicators of Compromise (IOCs: file hashes, malicious IPs, C2 domains) ingested directly by automated firewalls, SIEMs, and EDR systems.'
      ],
      takeaway: 'CTI operates at Strategic (executive risk), Operational (campaigns/actors), and Tactical (IOCs/TTPs) tiers to inform defense.',
      question: 'Which tier of Cyber Threat Intelligence (CTI) is authored for executive leadership to understand geopolitical risk and guide security budget allocations?',
      options: [
        'Strategic Threat Intelligence',
        'Tactical Threat Intelligence',
        'Technical Log Intelligence',
        'Microarchitectural Intelligence'
      ],
      answer: 0,
      explanation: 'Strategic CTI synthesizes high-level trends, geopolitical adversary intentions, and financial exposure for non-technical executives and board members.'
    },
    {
      title: 'MITRE ATT&CK Enterprise Matrix Navigation',
      duration: '9 min',
      body: [
        'The MITRE ATT&CK (Adversarial Tactics, Techniques, and Common Knowledge) framework is the globally accepted standard taxonomy documenting real-world cyber adversary behavior based on empirical observations.',
        'The Enterprise Matrix is structured into 14 sequential Tactics representing the adversary\'s operational goals: Initial Access, Execution, Persistence, Privilege Escalation, Defense Evasion, Credential Access, Discovery, Lateral Movement, Collection, Command and Control, Exfiltration, and Impact.',
        'Under each Tactic are dozens of concrete Techniques and Sub-techniques: for example, under Tactic "Defense Evasion" sits Technique T1070 (Indicator Removal on Host) and Sub-technique T1070.001 (Clear Windows Event Logs using `wevtutil cl`). Security teams map their detection rules and telemetry coverage against ATT&CK to identify defensive blind spots.'
      ],
      takeaway: 'MITRE ATT&CK organizes real-world adversary behavior into 14 tactical objectives and hundreds of granular techniques.',
      question: 'Under the MITRE ATT&CK framework, what is the distinction between a "Tactic" and a "Technique"?',
      options: [
        'A Tactic is the adversary\'s goal (the "Why"); a Technique is the specific action they take to achieve it (the "How")',
        'A Tactic is a software program; a Technique is a hardware cable',
        'Tactics apply only to Windows; Techniques apply only to Linux',
        'Tactics are created by the FBI; Techniques are created by Microsoft'
      ],
      answer: 0,
      explanation: 'In MITRE ATT&CK, Tactics describe the adversary\'s operational objective (e.g. Credential Access), whereas Techniques detail the specific mechanism used to achieve that goal (e.g. OS Credential Dumping: LSASS).'
    },
    {
      title: 'The Pyramid of Pain & IOC Longevity',
      duration: '8 min',
      body: [
        'Created by David Bianco, the Pyramid of Pain illustrates the amount of difficulty and cost a defender causes an adversary when detecting and blocking their intrusion mechanisms across six progressive tiers.',
        'At the base are Hash Values (trivial for attackers to change by modifying a single byte) → IP Addresses (cheap and easy to change via proxies and cloud IPs) → Domain Names (simple to re-register using Domain Generation Algorithms) → Network/Host Artifacts (annoying to change: custom user-agents, URI patterns) → Tools (challenging to replace: requires finding or building new malware) → and at the apex: Tactics, Techniques, and Procedures (TTPs).',
        'Blocking TTPs causes MAXIMAL pain. An adversary forced to abandon their fundamental technique (such as Pass-the-Hash or Kerberoasting) must undergo extensive, expensive re-training and re-tooling, often forcing them to abandon the campaign entirely.'
      ],
      takeaway: 'The Pyramid of Pain shows that blocking TTPs causes maximal adversary disruption compared to fleeting indicators like file hashes and IPs.',
      question: 'According to David Bianco\'s Pyramid of Pain, which indicator type sits at the very apex, causing the highest cost and difficulty for an adversary when detected and denied?',
      options: [
        'Tactics, Techniques, and Procedures (TTPs)',
        'MD5 Hash Values',
        'IP Addresses',
        'Domain Names'
      ],
      answer: 0,
      explanation: 'TTPs sit at the top of the Pyramid of Pain because changing how an adversary operates requires extensive research, training, and operational restructuring, inflicting maximum pain on the attacker.'
    },
    {
      title: 'The Diamond Model of Intrusion Analysis',
      duration: '8 min',
      body: [
        'The Diamond Model of Intrusion Analysis provides a structured mathematical framework for analyzing cybersecurity events. It establishes that every malicious event is composed of four core interconnected vertices: Adversary, Capability, Infrastructure, and Victim.',
        'The Adversary (threat actor) uses a Capability (malware, exploits, toolsets) over Infrastructure (C2 servers, compromised relays, IP netblocks) against a Victim (target organization, network, email account). These nodes are linked via two underlying socio-technical threads: Technology and Socio-political motivation.',
        'The Diamond Model enables analytical pivoting: discovering a single malicious C2 domain (Infrastructure) allows an analyst to pivot to the Victim who connected to it, identify the dropped binary (Capability), and uncover other domains registered with the same infrastructure email, ultimately mapping the full Adversary campaign.'
      ],
      takeaway: 'The Diamond Model connects Adversary, Capability, Infrastructure, and Victim, enabling systematic investigative pivoting across campaign nodes.',
      question: 'What are the four core vertices that comprise the Diamond Model of Intrusion Analysis?',
      options: [
        'Adversary, Capability, Infrastructure, and Victim',
        'CPU, Memory, Hard Drive, and Network',
        'Confidentiality, Integrity, Availability, and Non-repudiation',
        'Preparation, Detection, Containment, and Eradication'
      ],
      answer: 0,
      explanation: 'The Diamond Model maps every malicious intrusion event to the relationship between the Adversary, the Capability (tools/malware), the Infrastructure (C2/hosting), and the Victim.'
    },
    {
      title: 'Threat Actor Group Profiling (APTs)',
      duration: '9 min',
      body: [
        'Advanced Persistent Threats (APTs) are well-funded, highly skilled threat actor groups—typically nation-state sponsored or state-affiliated cybercrime syndicates—that conduct prolonged, targeted cyber operations against critical infrastructure, government, and commercial sectors.',
        'Cybersecurity research firms track and profile these groups using distinct naming conventions: CrowdStrike uses animal monikers (Cozy Bear / Fancy Bear for Russia, Panda for China, Kitten for Iran, Chollima for North Korea); Microsoft uses weather/element monikers (Midnight Blizzard, Volt Typhoon); and Mandiant uses APT numbers (APT28, APT29, APT41).',
        'Profiling threat actors involves mapping their habitual diamond models: preferred initial access vectors (spear-phishing, zero-day VPN exploits), unique toolchains (Cobalt Strike, custom backdoors), working hours (aligned with specific country timezones), and target victim verticals. Recognizing actor signatures allows defenders to predict the adversary\'s next move and deploy tailored countermeasures.'
      ],
      takeaway: 'Threat actor profiling tracks APT motivations, working hours, toolchains, and victim profiles to predict and neutralize campaigns.',
      question: 'In threat intelligence naming taxonomies, which nation-state adversary group origin does the "Bear" moniker (e.g., Fancy Bear, Cozy Bear) designate in CrowdStrike\'s taxonomy?',
      options: [
        'Russia',
        'China',
        'North Korea',
        'Iran'
      ],
      answer: 0,
      explanation: 'CrowdStrike assigns animal names based on national origin: Bear represents Russia, Panda represents China, Chollima represents North Korea, and Kitten represents Iran.'
    },
    {
      title: 'STIX 2.1 & TAXII Feed Ingestion',
      duration: '8 min',
      body: [
        'To operationalize threat intelligence at machine speed, organizations require standardized formats and transport protocols. OASIS established STIX and TAXII as the international standards for sharing structured cyber threat intelligence.',
        'Structured Threat Information Expression (STIX 2.1) is a standardized JSON schema defining threat intelligence objects (STIX Domain Objects: `threat-actor`, `malware`, `vulnerability`, `indicator`, `attack-pattern`, `identity`) and the relationships connecting them (STIX Relationship Objects: e.g., `indicator --indicates--> malware`).',
        'Trusted Automated eXchange of Intelligence Information (TAXII 2.1) is the RESTful application protocol over HTTPS used to exchange STIX data between organizations, ISACs (Information Sharing and Analysis Centers), and automated defense systems. Firewalls and SIEMs poll TAXII servers to ingest verified threat indicators automatically in real time.'
      ],
      takeaway: 'STIX 2.1 structures threat data in standardized JSON; TAXII transports STIX feeds over HTTPS for automated ingestion into SIEMs and firewalls.',
      question: 'What is the relationship between STIX and TAXII in cyber threat intelligence sharing?',
      options: [
        'STIX defines the structured JSON data format; TAXII is the RESTful transport protocol used to exchange STIX data',
        'STIX is for hardware; TAXII is for software',
        'STIX runs on Linux; TAXII runs only on Windows',
        'STIX deletes logs; TAXII restores backups'
      ],
      answer: 0,
      explanation: 'STIX provides the standardized schema defining the "what" (threat intelligence objects in JSON), while TAXII provides the "how" (the secure REST API transport mechanism to share that data).'
    }
  ]
}

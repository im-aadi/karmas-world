import type { Lesson } from '../courses'

export const beginnerCurriculum: Record<string, Lesson[]> = {
  'course-comp-fund': [
    {
      title: 'CPU Registers & Clock Cycles',
      duration: '7 min',
      body: [
        'The Central Processing Unit (CPU) is the computation engine of a computer. At its core, the CPU operates in a continuous hardware rhythm governed by a crystal oscillator clock: the Fetch-Decode-Execute cycle. During fetch, the CPU retrieves an instruction from memory at the memory address pointed to by the Instruction Pointer register (EIP in 32-bit x86, RIP in 64-bit x86_64).',
        'Registers are microscopic, ultrafast internal storage cells directly on the CPU die. General-purpose registers such as RAX (accumulator for calculations and return values), RBX (base register), RCX (counter for loops), and RDX (data register for I/O) hold immediate operands. Special-purpose registers govern control flow: RSP (Stack Pointer) points to the current top of the execution call stack, while RBP (Base/Frame Pointer) anchors the local function frame.',
        'From a cybersecurity perspective, understanding CPU registers is critical for analyzing binary vulnerabilities and memory exploitation. For instance, when an attacker overwrites the return address stored on the stack, the CPU fetches that malicious address into the Instruction Pointer (RIP) upon function return, enabling arbitrary control flow redirection.'
      ],
      takeaway: 'Control of the Instruction Pointer (RIP/EIP) means control of machine execution; safeguarding register boundaries is the bedrock of binary security.',
      question: 'Which CPU register holds the address of the next machine code instruction to be executed by the processor?',
      options: [
        'RSP (Stack Pointer)',
        'RIP / EIP (Instruction Pointer)',
        'RAX (Accumulator Register)',
        'RFLAGS (Status Flag Register)'
      ],
      answer: 1,
      explanation: 'The Instruction Pointer (EIP in 32-bit, RIP in 64-bit) points directly to the memory address of the next opcode the processor will fetch and execute.'
    },
    {
      title: 'Memory Hierarchy & Cache',
      duration: '8 min',
      body: [
        'Modern computers utilize a tiered memory hierarchy to balance access speed against capacity and manufacturing cost. At the fastest and most expensive tier are CPU registers (< 1 nanosecond latency), followed by on-chip hardware caches: Level 1 (L1, split into instruction and data cache), Level 2 (L2), and shared Level 3 (L3). Main system memory (DRAM) is substantially slower (~50-100 nanoseconds), while secondary persistent storage (NVMe SSDs and HDDs) is orders of magnitude slower.',
        'Caches rely on the principles of spatial locality (accessing data near recently accessed addresses) and temporal locality (re-accessing data that was recently used). When the CPU requests memory, the cache controller checks L1, L2, and L3 (a cache hit). If not found, a cache miss occurs, forcing an expensive fetch from DRAM.',
        'Hardware memory caching gave rise to modern speculative execution and side-channel vulnerabilities, such as Meltdown and Spectre. Because cache access time is measurable, adversaries can execute precise timing attacks (e.g., Flush+Reload) to deduce secret cryptographic keys or kernel memory contents based on whether data resides in the L1/L3 cache.'
      ],
      takeaway: 'Memory latency differences across cache tiers can leak sensitive data through microarchitectural timing side-channels.',
      question: 'Why are microarchitectural vulnerabilities like Spectre and Meltdown possible despite software boundary checks?',
      options: [
        'They exploit measurable timing differences caused by CPU speculative execution and caching',
        'They disable the motherboard crystal clock oscillator',
        'They physically overwrite the NVMe SSD controller firmware',
        'They require physical access to plug a hardware sniffer directly into DRAM'
      ],
      answer: 0,
      explanation: 'Spectre and Meltdown exploit speculative execution and measurable timing differences between CPU cache hits and misses to leak unauthorized memory contents across process boundaries.'
    },
    {
      title: 'Bus Systems & Peripheral I/O',
      duration: '7 min',
      body: [
        'To interact with external hardware, graphic cards, storage controllers, and network adapters, processors rely on system bus architectures such as PCIe (Peripheral Component Interconnect Express) and USB (Universal Serial Bus). Direct Memory Access (DMA) allows high-throughput peripherals—such as network interface cards and GPUs—to read and write system RAM directly without burdening the CPU with every byte.',
        'While DMA delivers massive performance gains, it introduces significant hardware attack surfaces. Malicious Thunderbolt, PCIe, or FireWire devices can execute Direct Memory Access (DMA) attacks, reading kernel memory, dumping BitLocker encryption keys, or injecting shellcode directly into RAM while bypassing operating system login screens.',
        'To mitigate DMA attacks, modern systems implement an IOMMU (Input-Output Memory Management Unit, known as Intel VT-d or AMD-Vi). The IOMMU translates device-visible virtual addresses into physical addresses, restricting peripherals to designated, isolated memory buffers and preventing unauthorized access to sensitive kernel spaces.'
      ],
      takeaway: 'Direct Memory Access (DMA) allows peripherals to bypass OS memory checks; hardware IOMMU protection is essential to prevent rogue device exploits.',
      question: 'Which hardware security feature isolates peripheral device memory access to prevent DMA attacks from unauthorized PCIe or Thunderbolt peripherals?',
      options: [
        'IOMMU (Intel VT-d / AMD-Vi)',
        'BIOS Clock Multiplier',
        'SATA Drive Controller',
        'GPU Shader Pipeline'
      ],
      answer: 0,
      explanation: 'The Input-Output Memory Management Unit (IOMMU) translates and restricts device memory requests, ensuring peripherals cannot read or write physical RAM outside their allocated memory regions.'
    },
    {
      title: 'Process Scheduling & Kernel Modes',
      duration: '8 min',
      body: [
        'Modern microprocessors enforce hardware privilege separation using CPU rings. Ring 0 (Kernel Mode) has unfettered, direct access to physical memory, CPU control registers (CR0, CR3, CR4), and hardware instructions. Ring 3 (User Mode) is restricted: applications execute in sandboxed, unprivileged address spaces and cannot directly access physical hardware or other processes\' memory.',
        'The operating system scheduler manages multitasking by allocating CPU time slices to active processes and threads. Preemptive scheduling uses hardware timer interrupts to pause a running process, execute a context switch (saving current registers into a task structure and loading the next process\'s registers), and switch threads seamlessly hundreds of times per second.',
        'Security privilege escalation attacks occur when a threat actor running code in Ring 3 exploits a vulnerability in a device driver or the operating system kernel to execute code in Ring 0. Achieving Ring 0 execution grants the adversary total control over the host, neutralizing antivirus, EDR hooks, and access controls.'
      ],
      takeaway: 'The hardware Ring 0 / Ring 3 boundary shields the core operating system; kernel exploits breach this boundary to grant absolute host compromise.',
      question: 'What hardware privilege level do standard user applications run in to prevent them from directly corrupting hardware or kernel memory?',
      options: [
        'Ring 0 (Supervisor Mode)',
        'Ring 1 (Device Driver Space)',
        'Ring 3 (User Mode)',
        'Ring -1 (Hypervisor Root)'
      ],
      answer: 2,
      explanation: 'Standard applications run in Ring 3 (User Mode), where the CPU blocks privileged instructions and prevents direct access to physical hardware or foreign process memory.'
    },
    {
      title: 'Virtual Memory & Page Tables',
      duration: '9 min',
      body: [
        'Processes in modern operating systems do not interact with raw physical RAM. Instead, each process is granted a private, contiguous virtual address space managed by the Memory Management Unit (MMU) through Page Tables. Memory is organized into fixed-size chunks called pages (typically 4 KB).',
        'When a process references an address, the MMU traverses multi-level page tables (PML4, PDPT, Page Directory, Page Table in x86_64) to translate the virtual page into a physical frame in DRAM. The page table entry also defines memory protection flags: Read (R), Write (W), and Execute (X/NX).',
        'Modern defensive mitigations such as Data Execution Prevention (DEP / W^X) mark memory pages as either Writable OR Executable, but never both. This prevents classic stack buffer overflow attacks from executing injected shellcode directly on the stack, forcing attackers to use Return-Oriented Programming (ROP) instead.'
      ],
      takeaway: 'Virtual memory isolates processes and enforces W^X permissions (DEP), preventing arbitrary code execution on data pages.',
      question: 'What security mitigation leverages page table permission bits to prevent shellcode from executing on the program stack?',
      options: [
        'DEP / NX (Data Execution Prevention / No-Execute bit)',
        'ASLR (Address Space Layout Randomization)',
        'Stack Canaries',
        'TCP SYN Cookies'
      ],
      answer: 0,
      explanation: 'The NX (No-Execute) bit / Data Execution Prevention marks the stack and heap pages as non-executable, causing the CPU to raise an access violation trap if execution is attempted there.'
    },
    {
      title: 'System Calls & File Descriptors',
      duration: '8 min',
      body: [
        'Because user applications run in Ring 3, they cannot directly write to disk, send network packets, or spawn processes. Instead, they must invoke System Calls (syscalls). A syscall triggers a controlled software interrupt or hardware instruction (e.g., `syscall` in x86_64, `sysenter`, or `int 0x80`) that transitions execution into the Ring 0 kernel handler with specified parameters.',
        'In UNIX-like operating systems, almost all I/O is abstracted through File Descriptors (integers indexing an open file table in kernel memory). Standard streams are assigned 0 (stdin), 1 (stdout), and 2 (stderr). Network sockets, pipes, and block devices are similarly manipulated using read(), write(), and ioctl() system calls.',
        'Defenders monitor and constrain system calls using technologies such as Linux `seccomp` (Secure Computing mode) and eBPF (extended Berkeley Packet Filter). By whitelisting only essential syscalls for containerized microservices, organizations effectively prevent compromised applications from spawning shells or mounting lateral movement calls.'
      ],
      takeaway: 'System calls are the monitored gateway between unprivileged user code and kernel privileges; constraining syscalls with seccomp minimizes attack surfaces.',
      question: 'Which Linux kernel feature allows developers and defenders to filter and block unauthorized system calls made by a process?',
      options: [
        'Seccomp (Secure Computing Mode)',
        'Cron scheduler',
        'Sudoers file',
        'GRUB bootloader'
      ],
      answer: 0,
      explanation: 'Seccomp (Secure Computing mode) filters the system calls a process can issue, instantly killing or blocking any process attempting restricted kernel calls.'
    }
  ],

  'course-networking': [
    {
      title: 'OSI 7 Layers Explained',
      duration: '8 min',
      body: [
        'The Open Systems Interconnection (OSI) 7-Layer Reference Model standardizes network communication into distinct logical layers. Layer 1 (Physical) transmits raw bits across physical media (copper, fiber, radio). Layer 2 (Data Link) handles node-to-node framing using MAC addresses and switches. Layer 3 (Network) handles logical addressing and packet routing across networks using IPv4 and IPv6.',
        'Layer 4 (Transport) manages host-to-host communication, reliability, and port multiplexing via TCP and UDP. Layer 5 (Session) establishes and terminates connection dialogues. Layer 6 (Presentation) handles data formatting, compression, and encryption/decryption (such as TLS/SSL). Layer 7 (Application) interfaces directly with end-user software through protocols like HTTP, SSH, SMTP, and DNS.',
        'Security analysts map attacks and defenses to OSI layers: ARP spoofing occurs at Layer 2; IP spoofing and DDoS attacks target Layer 3; SYN floods and port scanning occur at Layer 4; while SQL injection, Cross-Site Scripting, and API abuse target Layer 7.'
      ],
      takeaway: 'Defense in depth requires security controls at every layer: 802.1X at Layer 2, IPsec at Layer 3, firewalls at Layer 4, and WAFs at Layer 7.',
      question: 'At which layer of the OSI model does a Web Application Firewall (WAF) inspect HTTP headers and JSON request payloads?',
      options: [
        'Layer 2 (Data Link)',
        'Layer 3 (Network)',
        'Layer 4 (Transport)',
        'Layer 7 (Application)'
      ],
      answer: 3,
      explanation: 'Layer 7 (Application Layer) is where high-level application protocols like HTTP, HTTPS, and API payloads operate, requiring a Layer 7 WAF for content inspection.'
    },
    {
      title: 'TCP/IP Protocol Suite',
      duration: '7 min',
      body: [
        'While the OSI model is a 7-layer theoretical standard, the real-world Internet operates on the pragmatic 4-layer TCP/IP suite: Network Access (Link), Internet, Transport, and Application. Data transmission relies on encapsulation: as data moves down the stack, each layer prepends its own protocol header.',
        'At the Application layer, data (e.g., an HTTP GET request) is generated. The Transport layer encapsulates this into a TCP Segment, adding source and destination ports. The Internet layer encapsulates the segment into an IP Packet, adding source and destination IP addresses. Finally, the Link layer wraps the packet into an Ethernet Frame, adding MAC addresses and a CRC checksum.',
        'When diagnosing network attacks or examining PCAP captures, security analysts deconstruct packet headers layer by layer to identify anomalies, such as mismatched MTUs, forged TTL values, or covert channels concealed in protocol header reserved bits.'
      ],
      takeaway: 'Packet encapsulation wraps data with headers at each stage; protocol inspection requires parsing headers in reverse order (decapsulation).',
      question: 'What is the correct order of data encapsulation as information travels DOWN the TCP/IP stack from sender to wire?',
      options: [
        'Data → Segment (TCP) → Packet (IP) → Frame (Ethernet) → Bits',
        'Bits → Frame → Packet → Segment → Data',
        'Packet → Segment → Frame → Data',
        'Data → Frame → Segment → Packet'
      ],
      answer: 0,
      explanation: 'Encapsulation proceeds downwards: application Data is segment-wrapped by TCP (Transport), packet-wrapped by IP (Internet), frame-wrapped by Ethernet (Link), and converted into Bits on the wire.'
    },
    {
      title: 'Ethernet Framing & MAC Addressing',
      duration: '7 min',
      body: [
        'Ethernet operates at Layer 2 of the OSI model. Ethernet frames package network packets with a 14-byte header consisting of: 6-byte Destination MAC, 6-byte Source MAC, and a 2-byte EtherType field (e.g., 0x0800 for IPv4, 0x0806 for ARP, 0x86DD for IPv6). At the tail of every frame is a 4-byte Frame Check Sequence (FCS) using CRC-32 to detect transmission errors.',
        'A Media Access Control (MAC) address is a globally unique 48-bit identifier burned into network interfaces. The first 24 bits represent the Organizationally Unique Identifier (OUI) assigned to hardware manufacturers (e.g., Intel, Cisco, Apple), while the last 24 bits are device specific.',
        'Because Ethernet was designed without cryptographic authentication, local LANs are susceptible to MAC Spoofing and ARP Cache Poisoning. Attackers send forged ARP responses to map the default gateway IP to their own MAC address, inserting themselves into the middle of all local traffic.'
      ],
      takeaway: 'Layer 2 Ethernet lacks cryptographic identity verification; switch port security and Dynamic ARP Inspection (DAI) are necessary to block ARP and MAC spoofing.',
      question: 'Which EtherType value in an Ethernet II frame header indicates that the encapsulated payload is an IPv4 packet?',
      options: [
        '0x0800',
        '0x0806',
        '0x86DD',
        '0x8100'
      ],
      answer: 0,
      explanation: 'EtherType 0x0800 indicates an IPv4 packet. 0x0806 is used for ARP, and 0x86DD is used for IPv6.'
    },
    {
      title: 'IPv4 Subnetting & CIDR',
      duration: '9 min',
      body: [
        'An IPv4 address is a 32-bit number typically represented in dot-decimal format (four 8-bit octets, such as 192.168.1.1). Subnetting divides a large network into smaller, isolated broadcast domains. Classless Inter-Domain Routing (CIDR) notation expresses the subnet mask as a prefix length (e.g., /24 represents 24 network bits and 8 host bits, yielding 256 total IP addresses, of which 254 are assignable).',
        'RFC 1918 reserves three dedicated private IP address ranges for internal enterprise and home networks: 10.0.0.0/8 (Class A, over 16 million addresses), 172.16.0.0/12 (Class B, ~1 million addresses), and 192.168.0.0/16 (Class C, 65,536 addresses). These private addresses are non-routable on the public Internet and rely on Network Address Translation (NAT) to communicate externally.',
        'Proper network subnetting is a foundational defensive architecture. Segmenting sensitive assets (e.g., database clusters, management consoles) into isolated VLANs and subnets with strict firewall rules prevents an attacker who compromises an endpoint from immediately scanning and accessing backend production systems.'
      ],
      takeaway: 'Proper CIDR subnetting and VLAN segmentation contain lateral threat movement between enterprise security zones.',
      question: 'How many usable host IP addresses are available in an IPv4 subnet configured with a /26 CIDR prefix?',
      options: [
        '62 usable hosts (64 total - 2 reserved for network & broadcast)',
        '126 usable hosts',
        '254 usable hosts',
        '30 usable hosts'
      ],
      answer: 0,
      explanation: 'A /26 mask leaves 6 host bits ($2^6 = 64$). Subtracting 2 reserved addresses (the network address .0 and broadcast address .63) yields 62 assignable host addresses.'
    },
    {
      title: 'DNS Resolution Flow',
      duration: '8 min',
      body: [
        'The Domain Name System (DNS) is the distributed phonebook of the Internet, translating human-friendly domain names (e.g., example.com) into IP addresses (e.g., 93.184.216.34). When a client queries a domain, resolution follows a strict hierarchy: Local Cache → Recursive Resolver (ISP or 1.1.1.1) → Root Nameservers (\'.\') → TLD Nameservers (\'.com\') → Authoritative Nameservers.',
        'DNS queries traditionally transmit in plaintext over UDP port 53. Because UDP is connectionless and unencrypted, attackers can execute DNS Cache Poisoning (Kaminsky attacks) or spoof forged DNS responses, steering victims to phishing replicas.',
        'Modern security controls include DNSSEC (Domain Name System Security Extensions), which signs DNS records cryptographically with public keys, and encrypted DNS protocols like DoH (DNS over HTTPS on TCP 443) and DoT (DNS over TLS on TCP 853), protecting user query privacy from local network eavesdroppers.'
      ],
      takeaway: 'DNS resolution is a primary reconnaissance and C2 vector; DNSSEC ensures record integrity while DNS logging detects domain generation algorithms (DGAs).',
      question: 'Which cryptographic standard signs DNS records using digital signatures to prevent DNS spoofing and cache poisoning?',
      options: [
        'DNSSEC (DNS Security Extensions)',
        'DHCP Snooping',
        'NAT Traversal',
        'BGP Anycast'
      ],
      answer: 0,
      explanation: 'DNSSEC adds cryptographic signatures to DNS records using public key cryptography, enabling resolvers to verify that responses originate from authoritative servers and have not been altered in transit.'
    },
    {
      title: 'TCP 3-Way Handshake & Teardown',
      duration: '8 min',
      body: [
        'The Transmission Control Protocol (TCP) provides reliable, ordered, error-checked data delivery. Before transmitting application data, client and server establish a stateful connection via the 3-Way Handshake: Client sends SYN (Synchronize with Initial Sequence Number ISN) → Server replies with SYN-ACK (acknowledging client ISN and offering its own) → Client returns ACK. Once established, data flow begins.',
        'TCP ensures reliability through sequence numbers, acknowledgments, and dynamic sliding window flow control. If a packet is dropped, the receiver informs the sender through missing ACK numbers, triggering retransmission. Connection teardown occurs gracefully using FIN and ACK flags, or abruptly using the RST (Reset) flag.',
        'In cybersecurity, understanding TCP flags is fundamental for traffic analysis and defense. In a SYN Flood attack, an attacker exhausts server connection states by sending millions of SYN packets without ever completing the handshake. Defenses like TCP SYN Cookies allow servers to avoid allocating state until the final ACK arrives.'
      ],
      takeaway: 'The SYN → SYN-ACK → ACK handshake establishes TCP state; SYN flood attacks target connection queues, mitigated by SYN cookies.',
      question: 'In a classic TCP SYN Flood denial-of-service attack, what specific step of the 3-way handshake does the attacker deliberately withhold?',
      options: [
        'The final ACK response',
        'The initial SYN packet',
        'The DNS lookup request',
        'The FIN connection termination'
      ],
      answer: 0,
      explanation: 'In a SYN flood, the attacker sends numerous SYN packets from spoofed IPs and never sends the completing ACK, leaving the victim server\'s half-open connection table exhausted.'
    }
  ],

  'course-linux-fund': [
    {
      title: 'Filesystem Hierarchy Standard (FHS)',
      duration: '7 min',
      body: [
        'The Linux Filesystem Hierarchy Standard (FHS) dictates the organizational structure of directories starting from the root directory (`/`). Unlike Windows drive letters (C:, D:), Linux organizes all devices, disks, and partitions into a single unified virtual filesystem tree.',
        'Key security directories include `/etc/` (system-wide configuration files including `/etc/passwd` and `/etc/shadow`), `/var/log/` (system and service audit logs such as `auth.log` and `syslog`), `/bin/` and `/sbin/` (essential system binaries), `/tmp/` (world-writable temporary directory with sticky bit), and `/proc/` and `/sys/` (pseudo-filesystems exposing kernel metrics and live process information).',
        'Security auditors prioritize monitoring changes in `/etc/`, `/opt/`, and user cron directories (`/var/spool/cron/crontabs/`), as adversaries frequently place persistence mechanisms and backdoor binaries in `/tmp/` or `/dev/shm/` because these paths are typically writable by any unprivileged user.'
      ],
      takeaway: 'Knowing directory responsibilities under the FHS enables defenders to pinpoint abnormal files, unauthorized cron jobs, and rogue binaries.',
      question: 'Which Linux directory is a pseudo-filesystem containing real-time kernel data structures and running process information rather than files on disk?',
      options: [
        '/proc',
        '/etc',
        '/var/log',
        '/usr/bin'
      ],
      answer: 0,
      explanation: '/proc is a virtual, in-memory filesystem generated on the fly by the Linux kernel, providing interfaces to process memory, hardware status, and kernel configurations.'
    },
    {
      title: 'File Permissions (chmod, chown, umask)',
      duration: '8 min',
      body: [
        'Linux enforces POSIX discretionary access control (DAC) on every file and directory. Permissions are split into three entities: User/Owner (u), Group (g), and Others (o). Each entity can hold three standard permissions: Read (r=4), Write (w=2), and Execute (x=1), represented in octal notation (e.g., 755 = rwxr-xr-x, 644 = rw-r--r--).',
        'Special permission bits alter standard behavior: SUID (Setuid, octal 4000) causes an executable to run with the privileges of the file owner (often root) rather than the launching user. SGID (Setgid, octal 2000) runs with group privileges or inherits parent folder group IDs. The Sticky Bit (octal 1000, shown as `t`) prevents users from deleting or renaming files owned by others in shared directories like `/tmp`.',
        'Default permissions on newly created files are governed by the `umask`. For instance, a umask of `022` subtracts group and other write permissions, creating files with `644` and directories with `755`. Misconfigured SUID binaries (such as leaving `/bin/bash` or `/usr/bin/find` with SUID root) represent one of the most common local privilege escalation vectors in Linux penetration testing.'
      ],
      takeaway: 'SUID binaries execute with file owner privileges; auditing SUID files (`find / -perm -4000`) is critical for preventing root privilege escalation.',
      question: 'What special permission bit allows unprivileged users to execute a binary with the permissions of the file\'s owner (such as root for /usr/bin/passwd)?',
      options: [
        'SUID (Set User ID)',
        'SGID (Set Group ID)',
        'Sticky Bit',
        'Executable bit'
      ],
      answer: 0,
      explanation: 'The SUID (Set User ID) bit grants the executing process the permissions of the binary owner rather than the user who ran the command.'
    },
    {
      title: 'Searching & Text Processing',
      duration: '8 min',
      body: [
        'The command line is a cybersecurity professional\'s primary investigative environment. Proficient log analysis requires mastering Unix pipelines (`|`) and text processing utilities: `grep` (search regular expressions), `awk` (pattern scanning and column manipulation), `sed` (stream editor for inline replacements), `cut`, `sort`, and `uniq`.',
        'For example, to find the top 10 unique external IP addresses attempting SSH password brute-force in an authentication log: `grep "Failed password" /var/log/auth.log | awk \'{print $(NF-3)}\' | sort | uniq -c | sort -nr | head -10`. This single piped command parses gigabytes of logs in seconds.',
        'File discovery uses `find`. For threat hunting: `find / -perm -4000 -type f 2>/dev/null` discovers all SUID binaries on the filesystem, while `find / -mtime -2 -type f` locates files modified within the last 48 hours to identify newly dropped attacker backdoors.'
      ],
      takeaway: 'Chaining grep, awk, sort, and uniq into command pipelines allows security teams to extract actionable threat intelligence from raw logs.',
      question: 'Which command will find all executable files across the root filesystem that have the SUID bit set while suppressing error messages?',
      options: [
        'find / -perm -4000 -type f 2>/dev/null',
        'grep -r "SUID" /var/log',
        'ls -la /root',
        'chmod +s /bin/*'
      ],
      answer: 0,
      explanation: '`find / -perm -4000 -type f 2>/dev/null` queries the root directory for regular files matching octal permission 4000 (SUID) and redirects stderr output to /dev/null.'
    },
    {
      title: 'Process Lifecycle & Signals (kill, ps, top)',
      duration: '7 min',
      body: [
        'Every program executing in Linux runs as a process with a unique Process ID (PID) and a Parent Process ID (PPID). The first process spawned by the kernel is PID 1 (`systemd` or `init`), from which all child processes branch into an execution tree. The process table can be viewed using `ps aux` or `top` / `htop`.',
        'Processes communicate and receive control commands through POSIX Signals. Common signals include SIGINT (Signal 2, triggered by Ctrl+C), SIGTERM (Signal 15, requesting a graceful shutdown and cleanup), and SIGKILL (Signal 9, an uncatchable immediate termination enforced directly by the kernel).',
        'During malware investigations, incident responders inspect anomalous parent-child relationships using `ps -ef --forest`. A web server worker process (`www-data` running nginx or apache) that spawns `sh`, `bash`, or `python` is an immediate indicator of a successful remote code execution exploit or web shell activation.'
      ],
      takeaway: 'Parent-child process trees reveal attack context: web servers spawning shell binaries (`sh`, `bash`) indicate remote code execution.',
      question: 'Which signal number corresponds to SIGKILL, immediately terminating a rogue process without allowing it to intercept or ignore the signal?',
      options: [
        'Signal 9',
        'Signal 15 (SIGTERM)',
        'Signal 2 (SIGINT)',
        'Signal 1 (SIGHUP)'
      ],
      answer: 0,
      explanation: 'Signal 9 (SIGKILL) is enforced directly by the Linux kernel and cannot be caught, handled, or ignored by the target process, terminating it immediately.'
    },
    {
      title: 'Systemd Units & Journald Logs',
      duration: '8 min',
      body: [
        'Most modern Linux distributions utilize `systemd` as their system and service manager. Services, sockets, timers, and mounts are defined in `.service` unit files located in `/lib/systemd/system/` (vendor defaults) and `/etc/systemd/system/` (administrator configurations). Services are controlled via `systemctl` (start, stop, restart, enable, status).',
        'Systemd integrates a unified binary logging daemon called `systemd-journald`. Unlike traditional flat text files in `/var/log`, `journalctl` indexes log entries with metadata (boot ID, unit name, PID, user UID), allowing rapid querying: `journalctl -u ssh.service --since "1 hour ago"` or `journalctl -p err -b` for errors in the current boot.',
        'Threat actors frequently establish persistence by creating malicious custom systemd unit files or timer units in `/etc/systemd/system/` that execute reverse shells whenever the host boots. Auditing enabled services via `systemctl list-unit-files --state=enabled` is a critical baseline task.'
      ],
      takeaway: 'Systemd service unit files in `/etc/systemd/system/` are primary persistence targets; monitor new unit creations and query journalctl for anomalies.',
      question: 'What command queries the journald logging daemon for log entries specifically belonging to the OpenSSH service over the last 30 minutes?',
      options: [
        'journalctl -u ssh --since "30 min ago"',
        'cat /var/log/ssh.log',
        'systemctl status all',
        'tail -f /proc/kmsg'
      ],
      answer: 0,
      explanation: '`journalctl -u ssh --since "30 min ago"` uses journald\'s indexed metadata to retrieve logs specifically for the SSH systemd service unit within the specified time window.'
    },
    {
      title: 'Basic Bash Scripting',
      duration: '8 min',
      body: [
        'Bash scripting automates administrative tasks, incident response triage, and security scanning. A script begins with a shebang (`#!/bin/bash`) informing the shell interpreter of the execution environment. Scripts support variables, exit codes (`$?`), conditional statements (`if [ ... ]; then ... fi`), and loops (`for`, `while`).',
        'Defensive Bash scripting requires strict error handling to avoid unintended side effects. Best practices include setting `-e` (exit immediately on error), `-u` (treat unset variables as an error), and `-o pipefail` (catch pipeline failures): `set -euo pipefail`. Double-quoting variables (`"$VAR"`) prevents command injection and whitespace word-splitting bugs.',
        'Security teams create automated triage scripts that collect volatile forensic evidence upon alert: dumping active network sockets (`ss -tulpn`), listing logged-in users (`who`, `last`), capturing open files (`lsof`), and hashing modified binaries with `sha256sum`.'
      ],
      takeaway: 'Using `set -euo pipefail` and quoting variables protects Bash automation scripts against subtle execution errors and injection flaws.',
      question: 'What shell flag instructs a Bash script to terminate immediately if any command inside it returns a non-zero failure exit code?',
      options: [
        'set -e',
        'set +x',
        'chmod 777',
        'export PATH'
      ],
      answer: 0,
      explanation: '`set -e` (or `set -o errexit`) causes Bash to abort execution immediately when any pipeline or command fails, preventing errors from cascading into dangerous unintended states.'
    }
  ],

  'course-windows-fund': [
    {
      title: 'User Mode vs. Kernel Mode',
      duration: '8 min',
      body: [
        'Windows operating system architecture strictly isolates executing code into User Mode and Kernel Mode. User Mode houses standard software, services, and subsystems (Win32, POSIX), running in isolated virtual address spaces. User Mode processes cannot directly touch physical hardware or modify memory belonging to the OS kernel.',
        'Kernel Mode houses the Windows Executive (memory manager, process manager, security reference monitor), the microkernel (thread scheduling, interrupt dispatching), and the Hardware Abstraction Layer (HAL). It also runs third-party kernel-mode device drivers (such as graphics drivers and antivirus filter drivers).',
        'In cybersecurity, kernel-mode execution is the ultimate prize for attackers. Sophisticated adversaries use Bring Your Own Vulnerable Driver (BYOVD) attacks: they sign a legitimate, previously signed commercial driver that contains a known memory corruption vulnerability, load it into Windows, and exploit it to disable Microsoft Defender and EDR sensor hooks directly in kernel memory.'
      ],
      takeaway: 'Kernel Mode houses core Windows executive components; BYOVD attacks exploit vulnerable signed drivers to blind EDR telemetry in Ring 0.',
      question: 'What is a "Bring Your Own Vulnerable Driver" (BYOVD) attack in Windows environments?',
      options: [
        'An attacker drops a legitimately signed driver with a known flaw to gain Ring 0 kernel execution',
        'An attacker plugs an unformatted USB drive into a server port',
        'An attacker changes their screen resolution in user display settings',
        'An attacker runs a standard batch script without administrator privileges'
      ],
      answer: 0,
      explanation: 'BYOVD attacks bypass Windows Driver Signature Enforcement by loading an older, legitimately signed driver that contains a known vulnerability, which is then exploited to execute kernel code.'
    },
    {
      title: 'The Windows Registry Hives',
      duration: '8 min',
      body: [
        'The Windows Registry is a centralized, hierarchical database that stores operating system settings, hardware configurations, user profiles, and installed application preferences. It is divided into root keys called hives, notably HKEY_LOCAL_MACHINE (HKLM, machine-wide settings), HKEY_CURRENT_USER (HKCU, logged-in user profile), HKEY_CLASSES_ROOT (HKCR, file associations), and HKEY_USERS (HKU).',
        'At the file system level, registry data is stored in binary files in `C:\\Windows\\System32\\config\\` (SYSTEM, SOFTWARE, SAM, SECURITY) and in user directories (`NTUSER.DAT`). The SAM (Security Account Manager) hive stores local user credentials and password hashes (NTLM), protected from unauthorized reading by the OS while running.',
        'Threat actors heavily utilize registry Run keys (`HKLM\\Software\\Microsoft\\Windows\\CurrentVersion\\Run`) for persistence. Defenders monitor these keys using Sysmon (Event ID 12/13) to detect unauthorized startup payloads.'
      ],
      takeaway: 'The Windows Registry stores system configuration and auto-start keys; monitoring Run keys is vital for discovering malware persistence.',
      question: 'Which Windows Registry hive holds the Security Account Manager (SAM) database containing local user NTLM password hashes?',
      options: [
        'HKEY_LOCAL_MACHINE (HKLM\\SAM)',
        'HKEY_CURRENT_USER (HKCU)',
        'HKEY_CLASSES_ROOT (HKCR)',
        'HKEY_CURRENT_CONFIG'
      ],
      answer: 0,
      explanation: 'The SAM database is mounted under the HKEY_LOCAL_MACHINE (HKLM) hive at HKLM\\SAM, stored on disk in C:\\Windows\\System32\\config\\SAM.'
    },
    {
      title: 'NTFS Permissions & DACLs',
      duration: '8 min',
      body: [
        'The New Technology File System (NTFS) provides robust file-level security via Access Control Lists (ACLs). Every file and folder has a Security Descriptor containing an Owner Security Identifier (SID) and two ACLs: a Discretionary Access Control List (DACL) and a System Access Control List (SACL).',
        'The DACL specifies which users or groups are granted or denied permissions (e.g., Read, Write, Modify, Full Control). If a DACL contains no Access Control Entries (ACEs), access is denied to everyone. The SACL, conversely, configures audit logging, generating Windows Security Event logs when designated users access or modify the object.',
        'Permission inheritance can introduce vulnerabilities. For example, if a program is installed into `C:\\Program Files` with weak folder DACLs (allowing unprivileged users write access), an attacker can replace an application DLL with a malicious payload (DLL Hijacking) that executes with SYSTEM privileges when the service restarts.'
      ],
      takeaway: 'DACLs govern access while SACLs govern auditing; misconfigured write permissions on executable directories invite DLL hijacking attacks.',
      question: 'What is the role of a System Access Control List (SACL) on an NTFS file object?',
      options: [
        'It defines security audit generation rules when users access or modify the file',
        'It sets the wallpaper for the logged-in user profile',
        'It determines whether the file is compressed or encrypted with BitLocker',
        'It defines the network IP address allowed to download the file'
      ],
      answer: 0,
      explanation: 'SACLs instruct the Windows Security Reference Monitor to write audit records into the Security Event Log when specified access attempts occur.'
    },
    {
      title: 'Windows Event Viewer & Key Event IDs',
      duration: '8 min',
      body: [
        'The Windows Event Log subsystem records events across Application, Security, System, and specialized operational channels (e.g., PowerShell, Sysmon). The Security log is the primary resource for threat detection and forensic investigation.',
        'Essential Security Event IDs include: Event 4624 (Successful Account Logon, noting Logon Type such as Type 2 Interactive, Type 3 Network, Type 10 RDP), Event 4625 (Failed Logon Attempt, essential for brute-force detection), Event 4672 (Special Privileges Assigned to New Logon, such as SeDebugPrivilege), Event 4688 (New Process Created, revealing command-line arguments), and Event 4720 (User Account Created).',
        'Correlating these Event IDs enables detection of lateral movement and privilege escalation. For example, an Event 4624 with Logon Type 3 followed immediately by an Event 7045 (New Service Installed) frequently signals PsExec or lateral command execution across the network.'
      ],
      takeaway: 'Mastering Windows Event IDs (4624, 4625, 4688, 7045) allows defenders to reconstruct intruder timelines from initial logon to service execution.',
      question: 'Which Windows Security Event ID signifies a failed user authentication attempt, crucial for detecting password spraying and brute-force attacks?',
      options: [
        'Event ID 4625',
        'Event ID 4624',
        'Event ID 7045',
        'Event ID 1102'
      ],
      answer: 0,
      explanation: 'Event ID 4625 is generated whenever an account fails to log on, recording the target username, source workstation, and failure sub-status code.'
    },
    {
      title: 'PowerShell Fundamentals for Security',
      duration: '8 min',
      body: [
        'PowerShell is an object-oriented automation engine built on .NET. Unlike text-based Linux shells, PowerShell passes structured .NET objects through its pipeline (`|`), allowing administrators and defenders to query object properties directly: `Get-Process | Where-Object { $_.CPU -gt 50 } | Select-Object Name, Id, Path`.',
        'PowerShell cmdlets are indispensable for incident response: `Get-WinEvent` queries event logs rapidly; `Get-Service` inspects background services; `Get-CimInstance Win32_StartupCommand` lists persistence items; and `Test-NetConnection` checks network connectivity and ports.',
        'Because attackers weaponize PowerShell for "Living off the Land" (LotL) execution, modern defenses require enabling Script Block Logging (Event ID 4104), Module Logging (Event ID 4103), and Constrained Language Mode (CLM) paired with AppLocker or Windows Defender Application Control (WDAC).'
      ],
      takeaway: 'PowerShell operates on .NET objects; Script Block Logging (Event ID 4104) captures de-obfuscated commands executed in memory.',
      question: 'Which Windows Event ID captures full de-obfuscated PowerShell script block contents at runtime when Script Block Logging is enabled?',
      options: [
        'Event ID 4104',
        'Event ID 4624',
        'Event ID 1000',
        'Event ID 7045'
      ],
      answer: 0,
      explanation: 'PowerShell Script Block Logging writes Event ID 4104 to Microsoft-Windows-PowerShell/Operational, recording the full code block as it is executed by the engine.'
    },
    {
      title: 'Local Security Policy & SAM',
      duration: '7 min',
      body: [
        'The Local Security Policy (`secpol.msc`) defines the baseline security posture for standalone Windows workstations and servers (or via Group Policy Objects - GPOs in Active Directory). It enforces Password Policies (complexity, minimum length, history), Account Lockout thresholds, User Rights Assignments, and Audit Policies.',
        'User Rights Assignment governs dangerous OS privileges. Critical privileges include `SeDebugPrivilege` (allows debugging processes, often abused by Mimikatz to read LSASS memory), `SeImpersonatePrivilege` (allows token impersonation, abused by RottenPotato/PrintSpoofer), and `SeBackupPrivilege` (allows copying protected files, including the SAM and SYSTEM hives).',
        'Protecting local credentials requires disabling legacy LM and NTLMv1 protocols, enforcing NTLMv2 or Kerberos, implementing Credential Guard (virtualization-based security isolating LSASS in a secure VSM container), and applying the Local Administrator Password Solution (LAPS) to ensure unique administrator passwords across all domain endpoints.'
      ],
      takeaway: 'User Rights Assignments control sensitive privileges; `SeDebugPrivilege` and `SeImpersonatePrivilege` are primary targets for credential theft and privilege escalation.',
      question: 'Which Windows privilege is frequently targeted by credential-dumping tools like Mimikatz because it allows a process to inspect foreign memory like LSASS?',
      options: [
        'SeDebugPrivilege',
        'SeShutdownPrivilege',
        'SeTimeZonePrivilege',
        'SeChangeNotifyPrivilege'
      ],
      answer: 0,
      explanation: '`SeDebugPrivilege` grants a user the ability to attach to and debug arbitrary processes, which attackers leverage to dump plaintext credentials and NTLM hashes from LSASS.exe.'
    }
  ],

  'course-python-cyber': [
    {
      title: 'Socket Basics & TCP Clients',
      duration: '7 min',
      body: [
        'Python provides raw networking capabilities through the built-in `socket` module, interfacing directly with the operating system\'s Berkeley Sockets API. Creating a network connection requires defining the address family (`AF_INET` for IPv4, `AF_INET6` for IPv6) and the socket type (`SOCK_STREAM` for reliable TCP, `SOCK_DGRAM` for connectionless UDP).',
        'A simple TCP client initiates communication by creating a socket, connecting to a remote host and port (`s.connect((host, port))`), transmitting bytes (`s.sendall(b"GET / HTTP/1.1\\r\\nHost: example.com\\r\\n\\r\\n")`), and reading the returned buffer (`s.recv(4096)`).',
        'Understanding socket fundamentals allows security practitioners to build lightweight banner-grabbing tools that connect to unknown open ports, capture initial service banners (e.g., `SSH-2.0-OpenSSH_8.9p1 Ubuntu-3ubuntu0.1`), and identify service versions during authorized network audits without relying on heavy third-party scanners.'
      ],
      takeaway: 'Python socket programming allows security analysts to craft raw TCP/UDP requests, probe network interfaces, and extract service banners.',
      question: 'Which Python socket configuration specifies an IPv4 TCP stream connection?',
      options: [
        'socket.socket(socket.AF_INET, socket.SOCK_STREAM)',
        'socket.socket(socket.AF_INET6, socket.SOCK_DGRAM)',
        'socket.socket(socket.RAW, socket.IP)',
        'socket.connect(80, "tcp")'
      ],
      answer: 0,
      explanation: '`socket.AF_INET` designates the IPv4 address family, and `socket.SOCK_STREAM` designates a connection-oriented, reliable TCP byte stream.'
    },
    {
      title: 'Building a Multi-threaded Port Scanner',
      duration: '9 min',
      body: [
        'A port scanner probes an IP address across a range of TCP or UDP ports to determine which services are listening. In a basic single-threaded scanner, testing ports sequentially from 1 to 1024 with a 1-second timeout would take over 15 minutes. To achieve real-world utility, concurrency is essential.',
        'Python handles concurrency through the `threading` or `concurrent.futures` modules. Using `ThreadPoolExecutor(max_workers=50)` allows 50 ports to be probed simultaneously. Each worker attempts a socket connection: if `s.connect_ex((target, port))` returns `0`, the port is open and listening; any non-zero code indicates a closed, rejected, or filtered port.',
        'Proper scanner design includes setting explicit timeouts (`s.settimeout(0.5)`) to prevent threads from hanging indefinitely on dropped packets, closing socket descriptors cleanly in `finally` blocks, and respecting rate limits to prevent crashing legacy embedded services or triggering network threshold alarms.'
      ],
      takeaway: '`connect_ex()` returns 0 on successful TCP handshakes; thread pools scale port scanning throughput safely with explicit socket timeouts.',
      question: 'What does a return value of 0 from Python\'s `socket.connect_ex((host, port))` method signify?',
      options: [
        'The port is open and the TCP connection succeeded',
        'The port is closed or filtered by a firewall',
        'The host IP address does not exist',
        'The socket ran out of memory'
      ],
      answer: 0,
      explanation: 'Unlike `connect()`, which raises an exception on failure, `connect_ex()` returns a C-style error code where 0 indicates success (open port).'
    },
    {
      title: 'HTTP Requests & Header Inspection',
      duration: '8 min',
      body: [
        'Web security automation relies heavily on HTTP client libraries, predominantly the third-party `requests` library or standard `urllib`. Automating HTTP interactions allows security engineers to audit security headers, test authentication endpoints, and interact with REST APIs programmatically.',
        'Inspecting HTTP response headers is a rapid method for assessing web hardening. Essential defensive headers include `Strict-Transport-Security` (HSTS), `Content-Security-Policy` (CSP), `X-Content-Type-Options: nosniff`, and `X-Frame-Options: DENY`. Missing headers indicate potential exposures to clickjacking, MIME-sniffing, or insecure HTTP downgrades.',
        'Python scripts can automate header audits across hundreds of enterprise web assets in minutes: fetching endpoints with `requests.get(url, timeout=5, allow_redirects=True)`, parsing `response.headers`, flagging cookies that lack `Secure` or `HttpOnly` flags, and generating structured compliance reports.'
      ],
      takeaway: 'Automating HTTP audits with Python enables continuous verification of critical security response headers and cookie security flags across enterprise web fleets.',
      question: 'Which HTTP response header tells modern browsers to strictly reject loading pages within iframes, effectively neutralizing Clickjacking attacks?',
      options: [
        'X-Frame-Options: DENY',
        'Content-Type: text/html',
        'Server: Apache/2.4',
        'Cache-Control: no-cache'
      ],
      answer: 0,
      explanation: '`X-Frame-Options: DENY` (and CSP `frame-ancestors \'none\'`) forbids any external or internal website from framing the target page, preventing clickjacking/UI redressing.'
    },
    {
      title: 'Regular Expressions for Security',
      duration: '8 min',
      body: [
        'Regular expressions (regex) allow precise pattern matching within unstructured text streams. The Python `re` module provides functions like `re.search()`, `re.findall()`, and `re.sub()` to parse log files, firewall telemetry, and packet payloads.',
        'Common cybersecurity regex patterns include: IPv4 addresses (`r"\\b(?:\\d{1,3}\\.){3}\\d{1,3}\\b"`), SHA-256 hashes (`r"\\b[a-fA-F0-9]{64}\\b"`), CVE identifiers (`r"CVE-\\d{4}-\\d{4,7}"`), and email addresses. Security analysts use regex to ingest massive web access logs and extract all requests containing SQL injection keywords (`UNION`, `SELECT`, `--`) or path traversal sequences (`../`).',
        'However, regex can introduce security risks. Regular Expression Denial of Service (ReDoS) occurs when an application evaluates an untrusted string against an inefficiently written regex with nested quantifiers (e.g., `(a+)+$`). This triggers catastrophic backtracking, causing CPU utilization to spike to 100% and halting service availability.'
      ],
      takeaway: 'Regex extracts IOCs (IPs, hashes, CVEs) from logs; avoid nested quantifiers to eliminate Catastrophic Backtracking (ReDoS) vulnerabilities.',
      question: 'What vulnerability occurs when a server hangs at 100% CPU utilization while evaluating user input against an inefficient regular expression with nested quantifiers?',
      options: [
        'ReDoS (Regular Expression Denial of Service)',
        'SQL Injection',
        'Buffer Overflow',
        'Cross-Site Scripting'
      ],
      answer: 0,
      explanation: 'Catastrophic backtracking in regular expressions with overlapping nested quantifiers leads to exponential execution time when processing non-matching inputs, causing ReDoS.'
    },
    {
      title: 'JSON and CSV Report Generation',
      duration: '7 min',
      body: [
        'Security tools must generate structured, machine-readable output to integrate into SIEMs, dashboards, and automated ticketing systems. Python includes standard libraries `json` and `csv` to serialize findings into standardized formats.',
        'JSON (JavaScript Object Notation) is ideal for hierarchical security telemetry, such as vulnerability scan results containing host IPs, open ports, and nested CVE arrays: `json.dumps(scan_results, indent=2)`. CSV (Comma-Separated Values) is optimal for flat tabular data, such as asset inventories or user permission matrices: using `csv.DictWriter`.',
        'Adopting standardized schemas (such as the Open Cybersecurity Schema Framework - OCSF or SARIF for code scanning) ensures that Python scripts can pass security alerts directly into Splunk, Microsoft Sentinel, or GitHub Security alerts without manual reformatting.'
      ],
      takeaway: 'Serializing security findings into JSON or CSV enables seamless integration with SIEMs, SOC dashboards, and automated incident ticketing.',
      question: 'Which Python standard module is used to serialize in-memory security dictionary objects into structured JSON strings?',
      options: [
        'json',
        'pickle',
        'sys',
        'hashlib'
      ],
      answer: 0,
      explanation: 'The standard `json` module provides `json.dump()` and `json.dumps()` for safely serializing Python data structures into standardized JSON format without security risks like pickle deserialization.'
    },
    {
      title: 'Automated File Hash Verification',
      duration: '8 min',
      body: [
        'Cryptographic hashes (MD5, SHA-1, SHA-256) serve as unique digital fingerprints for files. Security professionals calculate hashes to verify software download integrity, detect unauthorized file modifications on servers, and query threat intelligence databases (such as VirusTotal) to check whether a binary is known malware.',
        'Python calculates hashes via the `hashlib` module: `hasher = hashlib.sha256()`. Because malware binaries or forensic disk images can be gigabytes in size, loading the entire file into RAM at once with `.read()` can crash the script. Instead, best practice is to read files in binary chunks: `while chunk := f.read(65536): hasher.update(chunk)`.',
        'Building an automated integrity baseline script involves hashing all executables in `/bin/` or `C:\\Windows\\System32\\`, storing the hashes in a secure database, and periodically re-scanning to detect unauthorized system file replacements or rootkit drops.'
      ],
      takeaway: 'Always hash large files in chunks (e.g. 64 KB) using SHA-256 to verify file integrity and prevent out-of-memory errors.',
      question: 'Why should Python scripts hash large files in fixed-size chunks (e.g., 64KB) rather than using a single `file.read()` call?',
      options: [
        'To prevent exhausting system RAM when hashing multi-gigabyte files',
        'Because SHA-256 cannot process more than 1 megabyte at a time',
        'To make the resulting hash string twice as secure',
        'Because the operating system deletes files if read all at once'
      ],
      answer: 0,
      explanation: 'Reading files in stream chunks avoids allocating gigabytes of memory simultaneously, allowing files of any size to be hashed with minimal constant memory footprint.'
    }
  ],

  'course-programming-fund': [
    {
      title: 'Primitive Types & Memory Layout',
      duration: '8 min',
      body: [
        'Computer programming languages represent data using primitive types: integers (signed and unsigned, 8-bit to 64-bit), floating-point numbers (IEEE 754), characters, and booleans. At the hardware level, everything is stored as binary bits grouped into bytes (8 bits).',
        'Endianness determines the byte order in multi-byte data types. In Little-Endian architecture (standard x86 and x64), the least significant byte is stored at the lowest memory address. In Big-Endian architecture (network byte order), the most significant byte is stored first. For example, the 32-bit hex value `0x12345678` is stored in RAM on x86 as `78 56 34 12`.',
        'Integer overflow vulnerabilities occur when arithmetic operations exceed the maximum capacity of a type. For example, incrementing an 8-bit unsigned integer holding `255` (`0xFF`) wraps around to `0`. If an integer overflow occurs during memory allocation calculations (e.g., `malloc(num_items * item_size)`), the program allocates an undersized buffer, resulting in heap-based buffer overflows.'
      ],
      takeaway: 'Little-endian machines store the least significant byte first; unchecked integer arithmetic can wrap around and cause undersized memory allocations.',
      question: 'How is the 32-bit hexadecimal integer `0xAABBCCDD` stored in memory on a Little-Endian (x86_64) processor?',
      options: [
        'DD CC BB AA',
        'AA BB CC DD',
        'AA DD BB CC',
        '00 AA BB CC'
      ],
      answer: 0,
      explanation: 'Little-Endian stores the least significant byte (0xDD) at the lowest memory address, followed sequentially by 0xCC, 0xBB, and 0xAA.'
    },
    {
      title: 'Hash Tables & Fast Lookups',
      duration: '8 min',
      body: [
        'A Hash Table (known as a dictionary in Python, map in Go, object/Map in JavaScript) is an associative array that maps keys to values. It achieves average-case $O(1)$ constant-time lookup, insertion, and deletion by passing the key through a hash function that computes an index into an array of buckets.',
        'When two distinct keys produce the same bucket index, a hash collision occurs. Collisions are handled via Chaining (storing colliding items in a linked list or tree inside the bucket) or Open Addressing (probing for the next vacant bucket).',
        'Hash tables present an attack vector called Hash Collision DoS (HashDoS). If an adversary sends thousands of HTTP POST parameters crafted to collide under a web server\'s hash function, the hash table degrades from $O(1)$ to $O(n)$ linear complexity. Processing the request spikes CPU to 100%, causing service starvation. Modern languages mitigate this using randomized SIPHash keys initialized per process.'
      ],
      takeaway: 'Hash tables deliver average $O(1)$ lookups; modern runtimes use randomized hashing (SipHash) to protect against HashDoS collision attacks.',
      question: 'What happens to a hash table\'s operational time complexity when an adversary forces catastrophic hash collisions on all inserted keys?',
      options: [
        'It degrades from O(1) constant time to O(n) linear search time',
        'It speeds up to O(0) instantaneous time',
        'The hash table automatically deletes the keys',
        'It permanently corrupts the motherboard BIOS'
      ],
      answer: 0,
      explanation: 'When all keys collide into the same bucket, the hash table reduces to a single linked list, causing lookups and insertions to degrade from O(1) to O(n) linear time, driving high CPU consumption.'
    },
    {
      title: 'Recursion & Stack Frames',
      duration: '8 min',
      body: [
        'Recursion is a programming technique where a function solves a problem by calling itself with smaller sub-problems until reaching a base condition. Every function call allocates a new Stack Frame on the program\'s call stack in memory.',
        'A stack frame holds function arguments, local variables, the saved frame pointer (EBP/RBP), and the crucial Return Address (pointing to the calling instruction). The stack grows downward toward lower memory addresses on x86 architectures. When a function finishes, the frame is popped and control jumps back to the saved return address.',
        'If a recursive function lacks a valid base case or processes deeply nested untrusted input (such as an XML document with 10,000 nested tags), the call stack consumes all allocated memory, triggering a Stack Overflow exception and crashing the process.'
      ],
      takeaway: 'Every function call consumes stack frame memory; missing base cases or deep input recursion trigger Stack Overflow crashes.',
      question: 'What critical value stored in a function\'s stack frame tells the CPU where to resume execution after the function finishes?',
      options: [
        'The Return Address',
        'The Global Variable Pointer',
        'The Heap Free List',
        'The MAC Address'
      ],
      answer: 0,
      explanation: 'The Return Address is pushed onto the stack during the `call` instruction and read by the `ret` instruction to return execution flow to the caller.'
    },
    {
      title: 'Input Validation & Type Constraints',
      duration: '8 min',
      body: [
        'Input validation is the first line of defense in software security. It verifies that data received across a trust boundary (from users, network sockets, query parameters, or file uploads) conforms strictly to expected formats, lengths, types, and value ranges before processing.',
        'Validation strategies fall into two categories: Whitelisting (allowlisting) and Blacklisting (blocklisting). Whitelisting defines what IS permitted (e.g., "alphanumeric characters, max length 20") and rejects everything else. Blacklisting attempts to filter out known bad patterns (e.g., removing "<script>" or "\' OR \'1\'=\'1"). Blacklists consistently fail because attackers bypass them using alternative encodings, casing, or new attack vectors.',
        'Modern development mandates type safety, schema validation (using libraries like Zod, Pydantic, or JSON Schema), and canonicalization (normalizing encodings, paths, and character sets before validating).'
      ],
      takeaway: 'Always choose strict allowlisting over blocklisting; validate data types, ranges, and formats immediately at trust boundaries.',
      question: 'Why is whitelisting (allowlisting) input validation vastly superior to blacklisting (blocklisting)?',
      options: [
        'Whitelisting accepts only explicitly approved formats, blocking all unknown or bypass variants by default',
        'Blacklisting is prohibited by the RFC standards',
        'Whitelisting makes programs run 10 times faster',
        'Blacklisting requires hardware dongles to function'
      ],
      answer: 0,
      explanation: 'Whitelisting establishes a strict positive security model, ensuring that unexpected characters, alternate encodings, and novel payloads are rejected automatically.'
    },
    {
      title: 'Safe Exception Handling',
      duration: '7 min',
      body: [
        'Exceptions handle anomalous conditions at runtime (e.g., file not found, network timeout, division by zero) without abruptly terminating the entire application. Structured exception handling employs `try / catch / finally` blocks (or `try / except / finally` in Python).',
        'Insecure exception handling poses severe security risks. Verbose error messages displaying full stack traces, database table schemas, framework versions, or internal file paths leak valuable intelligence to attackers (OWASP Security Misconfiguration). Conversely, catching exceptions blindly with empty catch blocks (`except: pass`) swallows critical failures, leaving systems in inconsistent, vulnerable states.',
        'Secure coding requires catching specific exception types, logging detailed technical diagnostics into protected internal server logs, and returning sanitized, generic error responses (e.g., "An unexpected error occurred. Request ID: 48f9") to end users.'
      ],
      takeaway: 'Log detailed stack traces securely on the server; return generic, sanitized error messages to users to prevent information leakage.',
      question: 'Why is displaying full database or framework stack traces directly to end users considered a dangerous security vulnerability?',
      options: [
        'It exposes internal architecture, database schemas, and library versions to adversaries',
        'It drains the client computer battery',
        'It deletes the database logs automatically',
        'It violates international copyright treaties'
      ],
      answer: 0,
      explanation: 'Stack traces reveal internal database queries, backend file structures, software versions, and code paths, giving attackers exact blueprints to construct targeted exploits.'
    },
    {
      title: 'Memory Safety Principles',
      duration: '8 min',
      body: [
        'Memory safety bugs represent approximately 70% of all critical zero-day vulnerabilities in low-level languages like C and C++. In these languages, developers manage physical memory manually using pointers, `malloc()`, and `free()`. Failure to handle boundaries correctly introduces catastrophic vulnerabilities.',
        'Primary memory safety flaws include: Buffer Overflows (writing data beyond an array\'s boundary), Use-After-Free (accessing heap memory after it was released, allowing attackers to hijack function pointers), Double Free (freeing the same pointer twice, corrupting heap allocator metadata), and Null Pointer Dereference (crashing the process or triggering privilege escalation).',
        'Modern software engineering emphasizes using memory-safe languages (Rust, Go, Python, Java) which enforce strict compile-time or runtime bounds checking and ownership models, eliminating entire classes of memory corruption exploits by design.'
      ],
      takeaway: 'Manual memory management in C/C++ causes buffer overflows and use-after-free flaws; memory-safe languages prevent these exploits at compile time.',
      question: 'Which vulnerability occurs when a program attempts to access or execute an object in heap memory after that memory block has already been deallocated?',
      options: [
        'Use-After-Free (UAF)',
        'SQL Injection',
        'Cross-Site Scripting',
        'Path Traversal'
      ],
      answer: 0,
      explanation: 'Use-After-Free (UAF) occurs when memory is accessed via a dangling pointer after being freed, allowing attackers to allocate new data in that space and hijack execution control flow.'
    }
  ],

  'course-osint': [
    {
      title: 'Search Engine Dorking & Operators',
      duration: '7 min',
      body: [
        'Open Source Intelligence (OSINT) involves collecting, analyzing, and synthesizing publicly accessible data into actionable intelligence. Search Engine Dorking (Google Dorking) leverages advanced search operators to uncover sensitive data indexed by search engine web crawlers.',
        'Key Google dork operators include: `site:` (restricts search to a specific domain), `filetype:` (filters for specific extensions like pdf, xlsx, env, log, sql), `inurl:` (matches strings in URL paths), `intitle:` (matches page titles), and `cache:` (retrieves cached snapshots of web pages).',
        'Security auditors use dorking to discover exposed credentials and sensitive configuration files before attackers do: e.g., `site:example.com filetype:env "DB_PASSWORD"` or `site:example.com inurl:admin intitle:"login"`. Remediation involves configuring `robots.txt`, applying strict authentication controls, and submitting URL removal requests to search engines.'
      ],
      takeaway: 'Search engine operators (`site:`, `filetype:`, `inurl:`) uncover exposed credentials and staging files indexed inadvertently on public websites.',
      question: 'Which Google search operator restricts results to a specific file format, such as exposed configuration or database backup files?',
      options: [
        'filetype:',
        'site:',
        'link:',
        'cache:'
      ],
      answer: 0,
      explanation: 'The `filetype:` (or `ext:`) operator limits search results exclusively to documents matching that file extension, such as `filetype:sql` or `filetype:log`.'
    },
    {
      title: 'Image & Document Metadata Extraction (EXIF)',
      duration: '8 min',
      body: [
        'Every digital file holds metadata—data about data. Photographs captured by smartphones and digital cameras embed Exchangeable Image File Format (EXIF) metadata, which can include the camera make and model, timestamp, exposure settings, software version, and precise GPS latitude and longitude coordinates.',
        'Documents (PDFs, Microsoft Office documents) embed metadata revealing the author\'s full name, corporate username, internal file paths (`C:\\Users\\alice\\Documents\\`), printer models, and editing revision history. Tools like `exiftool` extract this metadata instantly: `exiftool photo.jpg`.',
        'From an intelligence standpoint, metadata can expose physical locations of personnel, corporate naming conventions, internal software versions, and usernames for credential stuffing. Organizations must sanitize and strip metadata from all files before publishing them to public portals.'
      ],
      takeaway: 'EXIF metadata embedded in photos can reveal precise GPS coordinates and camera hardware; strip metadata prior to publishing public assets.',
      question: 'Which standard utility is widely used in forensics and OSINT investigations to read, write, and strip EXIF metadata from media and document files?',
      options: [
        'exiftool',
        'nmap',
        'wireshark',
        'hydra'
      ],
      answer: 0,
      explanation: '`exiftool` is the premier cross-platform command-line utility for reading, analyzing, and stripping EXIF, IPTC, and XMP metadata from image, audio, video, and document files.'
    },
    {
      title: 'Domain WHOIS & DNS Historical Records',
      duration: '8 min',
      body: [
        'Domain names require registration through an accredited registrar. WHOIS is a public query and response protocol (RFC 3912) that stores administrative details about domain ownership, including registrar name, creation date, expiration date, name servers, and administrative/technical contact emails.',
        'While modern privacy protections (such as GDPR and privacy proxy services) redact personal registrant names in current WHOIS queries, historical WHOIS databases (e.g., DomainTools, SecurityTrails) maintain historical archives. An organization that enabled privacy proxy in 2023 may have left full employee names, phone numbers, and physical office addresses visible in records from 2018.',
        'DNS historical records similarly reveal retired IP addresses, old mail servers, and forgotten development subdomains (e.g., `dev-vpn.example.com` or `staging-db.example.com`). These legacy assets often run unpatched software and lack modern multi-factor authentication, serving as prime entry points for penetration testers.'
      ],
      takeaway: 'Historical WHOIS and DNS archives expose legacy IP addresses, unpatched staging portals, and unredacted owner contact data.',
      question: 'Why are historical WHOIS databases valuable to security researchers even when current WHOIS records use privacy redaction services?',
      options: [
        'They preserve past records recorded before the domain owner activated privacy redaction',
        'They decrypt private SSL certificates automatically',
        'They grant direct SSH access to the domain web server',
        'They bypass corporate firewall inspections'
      ],
      answer: 0,
      explanation: 'Historical WHOIS databases maintain snapshots of domain records across years, frequently revealing personal names, emails, and phone numbers captured prior to enabling privacy proxies.'
    },
    {
      title: 'Social Media Intelligence (SOCMINT)',
      duration: '7 min',
      body: [
        'Social Media Intelligence (SOCMINT) is the sub-discipline of OSINT focused on gathering information from social networks, professional platforms (LinkedIn), forums, code repositories (GitHub), and messaging channels.',
        'Adversaries analyze corporate employees on LinkedIn to map organizational charts, identify internal security technologies (e.g., an employee listing "Experienced in Palo Alto Firewalls and CrowdStrike EDR"), and identify high-value targets (such as finance directors or system administrators) for spear-phishing campaigns.',
        'GitHub and public code repositories are treasure troves of inadvertent data leaks. Developers frequently commit hardcoded API keys, private RSA keys, and database connection strings into public repositories. Automated scanners (e.g., Trufflehog, GitGuardian) continuously monitor public commits to detect and revoke exposed secrets.'
      ],
      takeaway: 'Employees sharing technological tools and organizational hierarchies on social media give attackers intelligence to craft targeted spear-phishing attacks.',
      question: 'What type of inadvertent data exposure is most commonly uncovered on public code repository platforms like GitHub during OSINT reconnaissance?',
      options: [
        'Hardcoded API keys, cloud access tokens, and database passwords committed in code',
        'Physical motherboard serial numbers',
        'Laser printer toner status alerts',
        'Wi-Fi router MAC address stickers'
      ],
      answer: 0,
      explanation: 'Developers frequently make the mistake of hardcoding credentials, API secret keys, and database passwords directly into source code, which is then pushed to public GitHub repositories.'
    },
    {
      title: 'Mapping Exposed Assets with Shodan & Censys',
      duration: '8 min',
      body: [
        'Traditional search engines like Google index HTML web pages; specialized search engines like Shodan, Censys, and ZoomEye index the Internet of Things (IoT) and Internet-connected devices. They continuously scan the entire IPv4 address space, grabbing banners across hundreds of service ports.',
        'Shodan allows queries by IP, port, organization, country, and software banner string. Queries like `org:"Target Corporation" port:3389` reveal internet-exposed Remote Desktop Protocol (RDP) servers, while `product:"Apache httpd" version:"2.4.49"` locates servers vulnerable to known remote path traversal exploits.',
        'Defenders use Shodan and Censys for External Attack Surface Management (EASM). By regularly querying their own corporate IP ranges and ASNs (Autonomous System Numbers), organizations discover shadow IT, misconfigured database ports (e.g., open Elasticsearch or MongoDB on port 27017 without passwords), and forgotten testing servers.'
      ],
      takeaway: 'Shodan and Censys index internet-connected devices and service banners; organizations use them for attack surface management to discover shadow IT.',
      question: 'How do specialized search engines like Shodan differ from traditional search engines like Google?',
      options: [
        'Shodan scans IP addresses and captures service port banners; Google crawls and indexes web page text',
        'Shodan only indexes files stored on dark web onion networks',
        'Shodan requires physical satellite connections to operate',
        'Shodan is restricted exclusively to government military agencies'
      ],
      answer: 0,
      explanation: 'Google crawls and indexes web application text and content, whereas Shodan scans IP addresses across all ports, indexing device banners, protocol responses, and hardware interfaces.'
    },
    {
      title: 'Investigative Ethics & OPSEC',
      duration: '8 min',
      body: [
        'Open Source Intelligence must be conducted lawfully and ethically. Passive reconnaissance collects information that is already publicly available without sending probing packets directly to the target\'s systems. Active reconnaissance (such as running Nmap scans or directory fuzzers) interacts directly with the target\'s servers, creating logs and crossing into legal scoping boundaries that require explicit written authorization.',
        'Operational Security (OPSEC) protects the investigator\'s own identity, location, and intentions during research. If an investigator visits a target\'s personal website or LinkedIn profile from their real corporate IP and authenticated account, the target\'s web logs or LinkedIn notifications reveal that they are being investigated.',
        'Robust OPSEC practices include using dedicated, isolated virtual machines (sock puppets), VPNs or Tor routing to conceal originating IP addresses, avoiding logging into personal accounts on research browsers, and strictly adhering to legal frameworks like the Computer Fraud and Abuse Act (CFAA) and GDPR.'
      ],
      takeaway: 'Passive OSINT observes public data without sending direct probes; maintaining OPSEC ensures the investigator\'s identity remains private.',
      question: 'What is the crucial legal and technical boundary that separates passive reconnaissance from active reconnaissance?',
      options: [
        'Passive recon queries third-party public records; active recon transmits network packets directly to target systems',
        'Passive recon is illegal in all countries; active recon is always legal',
        'Passive recon requires a written court subpoena; active recon does not',
        'Passive recon can only be done using paper encyclopedias'
      ],
      answer: 0,
      explanation: 'Passive reconnaissance gathers data from third parties (DNS, search engines, WHOIS) without touching the target; active reconnaissance sends traffic directly to target infrastructure and requires authorization.'
    }
  ]
}

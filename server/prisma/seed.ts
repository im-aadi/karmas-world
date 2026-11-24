import crypto from 'node:crypto'
import { PrismaClient, DifficultyLevel } from '@prisma/client'
import { CYBERSECURITY_CATEGORIES, CATEGORY_DETAILS } from '../../packages/shared/src/index.js'

const prisma = new PrismaClient()

function sha256(text: string): string {
  return crypto.createHash('sha256').update(text.trim()).digest('hex')
}

async function main() {
  console.log('Seeding cybersecurity categories, courses, and achievements...')

  // 1. Seed Categories
  for (const catId of CYBERSECURITY_CATEGORIES) {
    const details = CATEGORY_DETAILS[catId]
    const level = details.level as DifficultyLevel

    await prisma.category.upsert({
      where: { slug: details.id },
      update: {
        name: details.name,
        description: details.description,
        level,
        iconName: details.iconName,
      },
      create: {
        slug: details.id,
        name: details.name,
        description: details.description,
        level,
        iconName: details.iconName,
      },
    })
  }
  console.log(`✓ Seeded ${CYBERSECURITY_CATEGORIES.length} categories`)

  // 2. Seed Initial Core Achievements
  const achievements = [
    {
      slug: 'first-step',
      title: 'First Step',
      description: 'Completed your first cybersecurity lesson',
      icon: 'Award',
      xpValue: 100,
    },
    {
      slug: 'cadet-streak',
      title: 'Consistent Defender',
      description: 'Maintained an active 3-day learning streak',
      icon: 'Flame',
      xpValue: 200,
    },
    {
      slug: 'network-explorer',
      title: 'Packet Tracer',
      description: 'Completed the Networking and Packet Flow curriculum',
      icon: 'Network',
      xpValue: 300,
    },
    {
      slug: 'crypto-guard',
      title: 'Cipher Master',
      description: 'Completed all Cryptography & PKI modules',
      icon: 'KeyRound',
      xpValue: 400,
    },
    {
      slug: 'web-guardian',
      title: 'Web Sentry',
      description: 'Completed the Web Application Security path',
      icon: 'Globe',
      xpValue: 400,
    },
  ]

  for (const ach of achievements) {
    await prisma.achievement.upsert({
      where: { slug: ach.slug },
      update: {
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpValue: ach.xpValue,
      },
      create: {
        slug: ach.slug,
        title: ach.title,
        description: ach.description,
        icon: ach.icon,
        xpValue: ach.xpValue,
      },
    })
  }
  console.log(`✓ Seeded ${achievements.length} achievements`)

  // 3. Seed Practical Cybersecurity Labs
  const seedLabs = [
    {
      slug: 'linux-cli-mastery',
      title: 'Linux Privileges & Log Hunting',
      description: 'Learn Linux CLI forensics, explore directory hierarchies, uncover hidden files, inspect system logs, and discover SUID privilege escalation vectors in a contained safe terminal.',
      categorySlug: 'linux-fundamentals',
      difficulty: DifficultyLevel.BEGINNER,
      duration: '25 min',
      xpReward: 150,
      type: 'linux-cli',
      instructions: 'Access the simulated workstation terminal. Use Unix utilities to locate three hidden flags across the file system.',
      tasks: [
        {
          title: 'Task 1: Uncover Hidden Vault Flag',
          instruction: 'Find the hidden file inside the learner user home directory and read its contents.',
          hint: 'Use `ls -la` in the home directory to find hidden files starting with a dot, then use `cat` to view.',
          flag: 'KW{l1nux_b4sh_m4st3r}',
          points: 50,
          orderIndex: 0,
        },
        {
          title: 'Task 2: Audit Failed SSH Logins',
          instruction: 'Inspect `/var/log/auth.log` and find the flag noting the failed login count.',
          hint: 'Use `grep "Failed password" /var/log/auth.log` or read the incident note in `/var/log/auth.log`.',
          flag: 'KW{auth_f41l_c0unt_42}',
          points: 50,
          orderIndex: 1,
        },
        {
          title: 'Task 3: Locate Misconfigured SUID Binary',
          instruction: 'Search the file system for elevated SUID executable files using the find utility.',
          hint: 'Run `find / -perm -4000` to list SUID binaries and view the note in `/opt/backdoor_audit/flag.txt`.',
          flag: 'KW{su1d_pr1v_3sc_fl4g}',
          points: 50,
          orderIndex: 2,
        },
      ],
    },
    {
      slug: 'network-pcap-investigation',
      title: 'Wireshark Packet & Credential Hunt',
      description: 'Inspect captured network traffic streams, trace unencrypted credentials over legacy HTTP, identify malicious DNS queries, and reconstruct TCP conversation streams.',
      categorySlug: 'network-security',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: '30 min',
      xpReward: 200,
      type: 'packet-analysis',
      instructions: 'Use the interactive packet capture inspector. Apply display filters, examine packet detail trees, and inspect data payloads to recover 3 network flags.',
      tasks: [
        {
          title: 'Task 1: Intercept Plaintext Credentials',
          instruction: 'Find the unencrypted HTTP POST request sent to /api/login and extract the password flag.',
          hint: 'Filter by `http` or look at packet #4 where user credentials were submitted in cleartext.',
          flag: 'KW{pl41nt3xt_p4ss_3xp0s3d}',
          points: 60,
          orderIndex: 0,
        },
        {
          title: 'Task 2: Detect Covert DNS Tunneling',
          instruction: 'Identify the anomalous DNS A query requesting a suspicious C2 exfiltration domain.',
          hint: 'Filter by `dns` and examine packet #7 containing a query with an embedded hex payload.',
          flag: 'KW{c2_d0m41n_3xf1ltr4t10n}',
          points: 70,
          orderIndex: 1,
        },
        {
          title: 'Task 3: Reconstruct TCP Session Token',
          instruction: 'Follow TCP Stream #4 between internal host 10.0.0.15 and server 10.0.0.1.',
          hint: 'Inspect packet #11 or stream 4 payload to find the session cookie flag.',
          flag: 'KW{tcp_str34m_t0k3n_c4ptur3d}',
          points: 70,
          orderIndex: 2,
        },
      ],
    },
    {
      slug: 'web-sqli-portal',
      title: 'SQL Injection & Authentication Bypass',
      description: 'Learn SQL injection mechanisms safely in a simulated vulnerable web portal. Practice classic authentication bypasses, UNION-based enumeration, and database schema discovery.',
      categorySlug: 'web-application-security',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: '35 min',
      xpReward: 250,
      type: 'sqli-sandbox',
      instructions: 'Test the search and login inputs in the simulated vulnerable database sandbox.',
      tasks: [
        {
          title: 'Task 1: Bypass Admin Authentication',
          instruction: 'Submit a classic SQL injection payload into the username field to authenticate as administrator without a password.',
          hint: 'Try entering `admin\' OR \'1\'=\'1` or `admin\' --` in the username field.',
          flag: 'KW{sql1_auth_byp4ss_succ3ss}',
          points: 80,
          orderIndex: 0,
        },
        {
          title: 'Task 2: UNION-Based Data Extraction',
          instruction: 'Inject a UNION SELECT query into the product catalog search to reveal unreleased confidential products.',
          hint: 'Use `\' UNION SELECT id, title, price, flag FROM confidential_inventory --` in the search box.',
          flag: 'KW{un10n_b4s3d_d4t4_3xtr4ct}',
          points: 80,
          orderIndex: 1,
        },
        {
          title: 'Task 3: Enumerate Database Schema',
          instruction: 'Extract the database schema and table definitions from information_schema.',
          hint: 'Query `information_schema.tables` using UNION to reveal the secret column flag.',
          flag: 'KW{db_sch3m4_3num3r4t10n}',
          points: 90,
          orderIndex: 2,
        },
      ],
    },
    {
      slug: 'cryptography-crack-and-cipher',
      title: 'Cryptanalysis & Hash Cracking Lab',
      description: 'Explore modern cryptographic primitives, crack SHA-256 and MD5 password hashes with dictionary attacks, and decrypt AES-GCM authenticated ciphertexts.',
      categorySlug: 'cryptography',
      difficulty: DifficultyLevel.INTERMEDIATE,
      duration: '30 min',
      xpReward: 200,
      type: 'cryptography',
      instructions: 'Use the interactive cryptography workbench. Crack captured hashes using the embedded dictionary wordlist, then decrypt an AES ciphertext to uncover hidden flags.',
      tasks: [
        {
          title: 'Task 1: Dictionary Hash Cracking',
          instruction: 'Find the plaintext password corresponding to the intercepted SHA-256 hash.',
          hint: 'The target hash is `d63cd4c0c0...`. Check candidates in the wordlist using the Hash Cracker tool.',
          flag: 'KW{cr4ck_th3_h4sh_sh4256}',
          points: 60,
          orderIndex: 0,
        },
        {
          title: 'Task 2: Decrypt AES-256-GCM Payload',
          instruction: 'Decrypt the intercepted ciphertext using the revealed 256-bit encryption key and IV.',
          hint: 'Paste the key `karmas-world-aes-master-key-2026` into the AES Decryptor tool.',
          flag: 'KW{43s_gcm_auth_d3crypt3d}',
          points: 70,
          orderIndex: 1,
        },
        {
          title: 'Task 3: Salt Reuse Vulnerability Analysis',
          instruction: 'Analyze the salt reuse flaw where two separate user passwords produced identical ciphertext blocks.',
          hint: 'Review the cryptographic report note regarding nonce reuse to discover the third flag.',
          flag: 'KW{s4lt_r3us3_c0mpr0m1s3}',
          points: 70,
          orderIndex: 2,
        },
      ],
    },
    {
      slug: 'incident-response-log-forensics',
      title: 'SOC Incident Investigation & Web Shell Hunt',
      description: 'Investigate an enterprise security breach using simulated SOC SIEM logs. Track attacker reconnaissance, web shell uploads, cron persistence, and data staging.',
      categorySlug: 'digital-forensics',
      difficulty: DifficultyLevel.ADVANCED,
      duration: '45 min',
      xpReward: 300,
      type: 'digital-forensics',
      instructions: 'Filter and inspect the chronological SIEM log trail. Uncover the adversary IP address, the uploaded backdoor filename, and the cron persistence mechanism.',
      tasks: [
        {
          title: 'Task 1: Identify Attacker Source IP',
          instruction: 'Find the external IP address responsible for automated vulnerability scanning and web shell upload.',
          hint: 'Filter logs for status 404 or POST requests to `/uploads/`. Look at IP 198.51.100.23.',
          flag: 'KW{4tt4ck3r_1p_198_51_100_23}',
          points: 100,
          orderIndex: 0,
        },
        {
          title: 'Task 2: Detect Uploaded Web Shell',
          instruction: 'Identify the exact filename of the obfuscated backdoor uploaded into the /uploads/ media directory.',
          hint: 'Examine POST requests to `/uploads/` followed by code execution calls to `shadow.php`.',
          flag: 'KW{b4ckd00r_sh3ll_sh4d0w_php}',
          points: 100,
          orderIndex: 1,
        },
        {
          title: 'Task 3: Locate Cron Persistence Mechanism',
          instruction: 'Find the scheduled persistence task installed by the adversary in `/etc/cron.d/`.',
          hint: 'Inspect log entries tagged `CRON` at 03:30:00 UTC containing the persistence beacon.',
          flag: 'KW{cr0n_p3rs1st3nc3_3st4bl1sh3d}',
          points: 100,
          orderIndex: 2,
        },
      ],
    },
    {
      slug: 'osint-infrastructure-recon',
      title: 'Lawful OSINT Reconnaissance & DNS Intelligence',
      description: 'Perform passive reconnaissance and DNS enumeration using lawful open source intelligence. Uncover staging subdomains, analyze TXT verification records, and inspect WHOIS data.',
      categorySlug: 'osint',
      difficulty: DifficultyLevel.BEGINNER,
      duration: '20 min',
      xpReward: 150,
      type: 'osint-recon',
      instructions: 'Use the OSINT DNS & WHOIS workbench. Query the target domain `insecure-corp.karmas.world` and discover three intelligence flags hidden in public records.',
      tasks: [
        {
          title: 'Task 1: Enumerate Staging Subdomain',
          instruction: 'Find the staging environment subdomain exposed through DNS A records.',
          hint: 'Inspect the list of discovered subdomains in the DNS console. Look for `staging-portal`.',
          flag: 'KW{st4g1ng_s3cr3t_subd0m41n}',
          points: 50,
          orderIndex: 0,
        },
        {
          title: 'Task 2: Discover DNS TXT Verification Key',
          instruction: 'Examine the domain TXT records used for third-party service ownership validation.',
          hint: 'Filter records by TXT type to find the security verification string.',
          flag: 'KW{dns_txt_v3r1f1c4t10n_k3y}',
          points: 50,
          orderIndex: 1,
        },
        {
          title: 'Task 3: Locate Security Contact in WHOIS',
          instruction: 'Lookup the WHOIS registration information to find the administrative security contact email flag.',
          hint: 'Open the WHOIS tab and read the Admin Contact comments section.',
          flag: 'KW{s3cur1ty_c0nt4ct_f0und}',
          points: 50,
          orderIndex: 2,
        },
      ],
    },
  ]

  for (const lab of seedLabs) {
    const upsertedLab = await prisma.lab.upsert({
      where: { slug: lab.slug },
      update: {
        title: lab.title,
        description: lab.description,
        categorySlug: lab.categorySlug,
        difficulty: lab.difficulty,
        duration: lab.duration,
        xpReward: lab.xpReward,
        type: lab.type,
        instructions: lab.instructions,
      },
      create: {
        slug: lab.slug,
        title: lab.title,
        description: lab.description,
        categorySlug: lab.categorySlug,
        difficulty: lab.difficulty,
        duration: lab.duration,
        xpReward: lab.xpReward,
        type: lab.type,
        instructions: lab.instructions,
      },
    })

    for (const task of lab.tasks) {
      const flagHash = sha256(task.flag)
      // Check existing task by labId and orderIndex
      const existingTask = await prisma.labTask.findFirst({
        where: { labId: upsertedLab.id, orderIndex: task.orderIndex },
      })

      if (existingTask) {
        await prisma.labTask.update({
          where: { id: existingTask.id },
          data: {
            title: task.title,
            instruction: task.instruction,
            hint: task.hint,
            flagHash,
            points: task.points,
          },
        })
      } else {
        await prisma.labTask.create({
          data: {
            labId: upsertedLab.id,
            title: task.title,
            instruction: task.instruction,
            hint: task.hint,
            flagHash,
            points: task.points,
            orderIndex: task.orderIndex,
          },
        })
      }
    }
  }
  console.log(`✓ Seeded ${seedLabs.length} practical cybersecurity labs and tasks`)

  console.log('Seeding completed successfully.')
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

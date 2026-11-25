import { Router, type Request, type Response, type NextFunction } from 'express'
import { rateLimit } from 'express-rate-limit'
import crypto from 'node:crypto'
import { Prisma, type PrismaClient } from '@prisma/client'
import { csrfGuard } from '../auth/router.js'
import {
  communityPostSchema,
  communityPostStatusSchema,
  communityReportSchema,
  communityReportStatusSchema,
  createThreadSchema,
  createReplySchema,
  threadQuerySchema,
  articleQuerySchema,
} from './validation.js'
import { awardXp } from '../gamification/router.js'
import { calculateUserLevel } from '../gamification/ranks.js'

function requireUser(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) return res.status(401).json({ error: 'Sign in to join the learner community.' })
  next()
}

function isKnownPostId(value: string) {
  return /^[a-zA-Z0-9_-]{8,40}$/.test(value)
}

function slugify(title: string): string {
  const base = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80)
  return `${base}-${crypto.randomBytes(3).toString('hex')}`
}

const DEFAULT_FORUM_CATEGORIES = [
  {
    slug: 'general-discussion',
    name: 'General Discussion',
    description: 'Community introductions, cybersecurity career pathways, questions, and learning tips.',
    iconName: 'MessageSquare',
    orderIndex: 0,
  },
  {
    slug: 'web-security',
    name: 'Web Application Security',
    description: 'OWASP Top 10 vulnerabilities, API security, authentication bypasses, and ethical bug bounty hunting.',
    iconName: 'Globe',
    orderIndex: 1,
  },
  {
    slug: 'network-defense',
    name: 'Network Defense & SOC',
    description: 'Packet capture dissection, IDS/IPS alerts, firewall rule engineering, and SIEM threat monitoring.',
    iconName: 'Shield',
    orderIndex: 2,
  },
  {
    slug: 'reverse-engineering',
    name: 'Reverse Engineering & Exploits',
    description: 'Binary disassembly, Ghidra decompilation, memory corruption mitigation, and CTF challenges.',
    iconName: 'Terminal',
    orderIndex: 3,
  },
  {
    slug: 'career-certifications',
    name: 'Certifications & Career',
    description: 'CompTIA Security+, CEH, OSCP, CISSP study strategies, resume advice, and interview prep.',
    iconName: 'Award',
    orderIndex: 4,
  },
]

const DEFAULT_KNOWLEDGE_ARTICLES = [
  {
    slug: 'practical-guide-to-sql-injection',
    title: 'Practical Guide to SQL Injection: Detection, Exploitation & Parameterized Defense',
    summary: 'A deep technical breakdown of in-band, blind, and time-based SQL injection with mitigation patterns in PostgreSQL and Node.js.',
    content: `# Practical Guide to SQL Injection: Detection, Exploitation & Parameterized Defense\n\nSQL Injection (SQLi) remains one of the most persistent and devastating vulnerabilities in web applications, holding a permanent spot on the OWASP Top 10.\n\n## 1. Anatomy of Vulnerable Queries\n\nWhen user input is concatenated directly into SQL command strings without structural separation, the SQL parser interprets user input as SQL syntax:\n\n\`\`\`sql\n-- Vulnerable Dynamic String Concatenation\nSELECT * FROM accounts WHERE email = '\" + userInput + \"' AND password = '\" + pass + \"';\n\`\`\`\n\nIf an attacker enters \`admin' --\`, the condition transforms to:\n\n\`\`\`sql\nSELECT * FROM accounts WHERE email = 'admin' --' AND password = '...';\n\`\`\`\n\n## 2. In-Band vs. Inferential (Blind) SQLi\n\n- **In-Band (Classic/UNION-based):** Results or schema details are reflected directly into the HTTP response body.\n- **Error-Based:** Database syntax errors intentionally triggered to reveal table and column names.\n- **Boolean-Based Blind:** The attacker crafts conditional queries that yield distinct binary application states (e.g., HTTP 200 vs HTTP 404).\n- **Time-Based Blind:** The attacker induces intentional database execution pauses (\`pg_sleep(5)\` in PostgreSQL) to infer byte values.\n\n## 3. Defense: Parameterized Statements\n\nModern ORMs like Prisma or parameterized queries ensure that parameters are passed out-of-band to the database engine as typed values, never as executable code.\n\n\`\`\`typescript\n// Secure Prisma Query\nconst user = await prisma.user.findUnique({\n  where: { email: userEmail },\n});\n\`\`\`\n\nAlways enforce Least Privilege database accounts, disable verbose error reflection in production, and run regular static application security testing (SAST).`,
    categorySlug: 'web-security',
    tags: 'SQLi,OWASP,Web Security,Database Defense',
    difficulty: 'BEGINNER' as const,
    readTimeMinutes: 7,
    isFeatured: true,
  },
  {
    slug: 'demystifying-tls-13-handshake',
    title: 'Demystifying the TLS 1.3 Handshake: Zero-RTT and Modern Cipher Suites',
    summary: 'Analyze how TLS 1.3 reduces latency from two round-trips to one (1-RTT), deprecates insecure ciphers, and implements Perfect Forward Secrecy.',
    content: `# Demystifying the TLS 1.3 Handshake: Zero-RTT and Modern Cipher Suites\n\nTransport Layer Security (TLS) 1.3 (RFC 8446) is a major architectural overhaul compared to TLS 1.2, designed for increased privacy, hardened cipher suites, and reduced connection latency.\n\n## Key Improvements over TLS 1.2\n\n1. **1-RTT Handshake Default:** Standard handshakes finish in a single round-trip time instead of two.\n2. **0-RTT Early Data (Session Resumption):** Returning clients can transmit encrypted application data in their first ClientHello message.\n3. **Removal of Legacy Algorithms:** Deprecated RSA key exchange, static Diffie-Hellman, RC4, DES, 3DES, MD5, and SHA-1.\n4. **Mandatory Perfect Forward Secrecy (PFS):** Ephemeral Diffie-Hellman (ECDHE/DHE) is enforced so compromising long-term private keys does not decrypt past sessions.\n\n## The Handshake Packet Sequence\n\n\`\`\`text\nClient                                               Server\n\nClientHello\n + key_share (ECDHE public keys)\n + supported_versions (TLS 1.3)\n + signature_algorithms      -------->\n                                                ServerHello\n                                       + key_share (Server ECDHE)\n                                            {EncryptedExtensions}\n                                            {CertificateRequest*}\n                                                   {Certificate}\n                                             {CertificateVerify}\n                                                      {Finished}\n                             <--------       [Application Data*]\n{Finished}                   -------->\n[Application Data]           <------->      [Application Data]\n\`\`\`\n\n*Note: Everything enclosed in braces \`{...}\` is encrypted using the handshake traffic secret derived immediately from ECDHE key exchange.*`,
    categorySlug: 'cryptography',
    tags: 'TLS,Cryptography,HTTPS,PFS',
    difficulty: 'INTERMEDIATE' as const,
    readTimeMinutes: 9,
    isFeatured: true,
  },
  {
    slug: 'building-a-home-soc-lab',
    title: 'Building an Enterprise-Grade Home SOC Lab with Suricata & ELK Stack',
    summary: 'A step-by-step walkthrough to deploy Suricata network intrusion detection, Filebeat log shippers, and Elasticsearch dashboards on Linux.',
    content: `# Building an Enterprise-Grade Home SOC Lab with Suricata & ELK Stack\n\nPractical detection engineering requires hands-on experience examining telemetry from live packet streams and host log pipelines.\n\n## Architecture Overview\n\n1. **Network Sensor (Suricata):** Operates on a mirrored port / TAP in Promiscuous mode to inspect raw Ethernet frames against Emerging Threats (ET) signature rules.\n2. **Log Shipper (Filebeat / Logstash):** Ingests Suricata \`eve.json\` logs and Linux \`auth.log\` / Syslog events.\n3. **Analytics Engine (Elasticsearch):** Indexes alerts, flow metadata, HTTP headers, and DNS queries.\n4. **Visualization (Kibana):** Pre-built security analyst triage boards with geolocation maps and alert counters.\n\n## Configuring Suricata IDS Rules\n\n\`\`\`yaml\n# /etc/suricata/suricata.yaml\ndefault-rule-path: /var/lib/suricata/rules\nrule-files:\n  - suricata.rules\n\naf-packet:\n  - interface: eth1\n    cluster-id: 99\n    cluster-type: cluster_flow\n    defrag: yes\n\`\`\`\n\nDeploying detection rules locally allows you to practice incident triage, alert tuning, and false positive reduction before enterprise deployment.`,
    categorySlug: 'incident-response',
    tags: 'SOC,Suricata,SIEM,Blue Team,Detection Engineering',
    difficulty: 'INTERMEDIATE' as const,
    readTimeMinutes: 11,
    isFeatured: false,
  },
  {
    slug: 'active-directory-kerberoasting-defense',
    title: 'Active Directory Kerberoasting: Attack Mechanics & Event ID 4769 Detection',
    summary: 'Understand how attackers extract Kerberos TGS tickets for offline password cracking, and implement Event ID 4769 telemetry detection.',
    content: `# Active Directory Kerberoasting: Attack Mechanics & Event ID 4769 Detection\n\nKerberoasting is a post-exploitation technique targeting Active Directory service accounts registered with Service Principal Names (SPNs).\n\n## Attack Mechanics\n\n1. Any authenticated domain user requests a Kerberos Ticket Granting Service (TGS) ticket for a target service account SPN.\n2. The Domain Controller (KDC) generates the TGS encrypted using the NTLM hash of the service account password.\n3. The attacker extracts the ticket from memory and performs offline brute-force cracking using hashcat or John the Ripper (Kerberos 5 TGS-REP etype 23).\n\n## Detection via Windows Security Event Log\n\nMonitor Domain Controllers for **Windows Event ID 4769** (*A Kerberos service ticket was requested*):\n\n- Filter for **Ticket Encryption Type \`0x17\` (RC4-HMAC)**. Modern Windows environments should negotiate AES-128 (\`0x12\`) or AES-256 (\`0x13\`).\n- High frequency of TGS requests across disparate services from a single workstation IP indicates automated enumeration scripts (e.g. Rubeus or GetUserSPNs.py).\n\n## Remediation\n\n- Transition service accounts to Group Managed Service Accounts (gMSA) with automated 128-character password rotation.\n- Configure Kerberos encryption types to disable DES and RC4 across all domain accounts.`,
    categorySlug: 'cloud-security',
    tags: 'Active Directory,Kerberos,Threat Hunting,Blue Team',
    difficulty: 'ADVANCED' as const,
    readTimeMinutes: 14,
    isFeatured: false,
  },
]

export function communityRouter(prisma: PrismaClient) {
  const router = Router()
  const submissionLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 15, standardHeaders: true, legacyHeaders: false })
  const reportLimit = rateLimit({ windowMs: 60 * 60 * 1000, limit: 10, standardHeaders: true, legacyHeaders: false })

  // ==========================================
  // FORUMS: Categories
  // ==========================================
  router.get('/forums/categories', async (_req, res, next) => {
    try {
      let categories = await prisma.forumCategory.findMany({
        orderBy: { orderIndex: 'asc' },
        include: {
          _count: {
            select: { threads: { where: { status: 'APPROVED' } } },
          },
        },
      })

      // Auto-seed default categories if database is empty
      if (categories.length === 0) {
        for (const cat of DEFAULT_FORUM_CATEGORIES) {
          await prisma.forumCategory.upsert({
            where: { slug: cat.slug },
            update: {},
            create: cat,
          })
        }
        categories = await prisma.forumCategory.findMany({
          orderBy: { orderIndex: 'asc' },
          include: {
            _count: {
              select: { threads: { where: { status: 'APPROVED' } } },
            },
          },
        })
      }

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        categories: categories.map((c) => ({
          id: c.id,
          slug: c.slug,
          name: c.name,
          description: c.description,
          iconName: c.iconName,
          orderIndex: c.orderIndex,
          threadsCount: c._count.threads,
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // FORUMS: Threads List
  // ==========================================
  router.get('/forums/threads', async (req, res, next) => {
    const parsed = threadQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid thread query parameters.' })

    const { category, sort, q } = parsed.data

    try {
      const where: Prisma.ForumThreadWhereInput = {
        status: 'APPROVED',
      }
      if (category && category !== 'all') {
        where.categorySlug = category
      }
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { content: { contains: q, mode: 'insensitive' } },
        ]
      }

      let orderBy: Prisma.ForumThreadOrderByWithRelationInput = { createdAt: 'desc' }
      if (sort === 'popular') {
        orderBy = { upvotesCount: 'desc' }
      }

      const threads = await prisma.forumThread.findMany({
        where,
        orderBy: [
          { isPinned: 'desc' },
          orderBy,
        ],
        include: {
          author: { select: { displayName: true, totalXp: true } },
          category: { select: { name: true } },
          _count: { select: { replies: true } },
        },
        take: 50,
      })

      let result = threads.map((t) => ({
        id: t.id,
        slug: t.slug,
        title: t.title,
        preview: t.content.slice(0, 160) + (t.content.length > 160 ? '...' : ''),
        categorySlug: t.categorySlug,
        categoryName: t.category.name,
        authorName: t.author.displayName,
        authorRank: calculateUserLevel(t.author.totalXp).rankTitle,
        upvotesCount: t.upvotesCount,
        repliesCount: t._count.replies,
        viewsCount: t.viewsCount,
        isPinned: t.isPinned,
        isLocked: t.isLocked,
        status: t.status,
        createdAt: t.createdAt.toISOString(),
        updatedAt: t.updatedAt.toISOString(),
      }))

      if (sort === 'unanswered') {
        result = result.filter((t) => t.repliesCount === 0)
      }

      res.setHeader('Cache-Control', 'no-store')
      res.json({ threads: result })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // FORUMS: Thread Detail
  // ==========================================
  router.get('/forums/threads/:slug', async (req, res, next) => {
    const slug = String(req.params.slug)
    const userId = req.session?.userId

    try {
      const thread = await prisma.forumThread.findUnique({
        where: { slug },
        include: {
          author: { select: { id: true, displayName: true, totalXp: true } },
          category: { select: { name: true } },
          replies: {
            orderBy: [{ isAcceptedAnswer: 'desc' }, { createdAt: 'asc' }],
            include: {
              author: { select: { id: true, displayName: true, totalXp: true } },
              votes: userId ? { where: { userId } } : false,
            },
          },
          votes: userId ? { where: { userId } } : false,
        },
      })

      if (!thread || (thread.status !== 'APPROVED' && thread.authorId !== userId)) {
        return res.status(404).json({ error: 'Discussion thread not found.' })
      }

      // Increment views count non-blockingly
      prisma.forumThread.update({
        where: { id: thread.id },
        data: { viewsCount: { increment: 1 } },
      }).catch(() => {})

      const hasVoted = Boolean(thread.votes && thread.votes.length > 0)

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        thread: {
          id: thread.id,
          slug: thread.slug,
          title: thread.title,
          content: thread.content,
          preview: thread.content.slice(0, 160),
          categorySlug: thread.categorySlug,
          categoryName: thread.category.name,
          authorName: thread.author.displayName,
          authorRank: calculateUserLevel(thread.author.totalXp).rankTitle,
          upvotesCount: thread.upvotesCount,
          repliesCount: thread.replies.length,
          viewsCount: thread.viewsCount + 1,
          isPinned: thread.isPinned,
          isLocked: thread.isLocked,
          status: thread.status,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
          isOwn: thread.authorId === userId,
          hasVoted,
          replies: thread.replies.map((r) => ({
            id: r.id,
            threadId: r.threadId,
            content: r.content,
            authorName: r.author.displayName,
            authorRank: calculateUserLevel(r.author.totalXp).rankTitle,
            upvotesCount: r.upvotesCount,
            isAcceptedAnswer: r.isAcceptedAnswer,
            createdAt: r.createdAt.toISOString(),
            isOwn: r.authorId === userId,
            hasVoted: Boolean(r.votes && r.votes.length > 0),
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // FORUMS: Create Thread
  // ==========================================
  router.post('/forums/threads', requireUser, csrfGuard, submissionLimit, async (req, res, next) => {
    const parsed = createThreadSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid thread content.' })
    }

    const { title, content, categorySlug } = parsed.data
    const userId = req.session.userId!

    try {
      // Ensure category exists
      const cat = await prisma.forumCategory.findUnique({ where: { slug: categorySlug } })
      if (!cat) {
        await prisma.forumCategory.create({
          data: {
            slug: categorySlug,
            name: categorySlug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
            description: 'Topic discussion channel.',
            iconName: 'MessageSquare',
          },
        })
      }

      const slug = slugify(title)
      const thread = await prisma.forumThread.create({
        data: {
          slug,
          title,
          content,
          categorySlug,
          authorId: userId,
          status: 'APPROVED',
        },
        include: {
          author: { select: { displayName: true, totalXp: true } },
          category: { select: { name: true } },
        },
      })

      // Award XP for contributing to community
      await awardXp(prisma, userId, 25, 'COMMUNITY_THREAD', `Created community discussion: ${title}`)

      res.status(201).json({
        thread: {
          id: thread.id,
          slug: thread.slug,
          title: thread.title,
          content: thread.content,
          categorySlug: thread.categorySlug,
          categoryName: thread.category.name,
          authorName: thread.author.displayName,
          authorRank: calculateUserLevel(thread.author.totalXp).rankTitle,
          upvotesCount: 0,
          repliesCount: 0,
          viewsCount: 0,
          isPinned: false,
          isLocked: false,
          status: thread.status,
          createdAt: thread.createdAt.toISOString(),
          updatedAt: thread.updatedAt.toISOString(),
          isOwn: true,
          hasVoted: false,
          replies: [],
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // FORUMS: Create Reply
  // ==========================================
  router.post('/forums/threads/:slug/replies', requireUser, csrfGuard, submissionLimit, async (req, res, next) => {
    const slug = String(req.params.slug)
    const parsed = createReplySchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid reply content.' })
    }

    const { content } = parsed.data
    const userId = req.session.userId!

    try {
      const thread = await prisma.forumThread.findUnique({
        where: { slug },
        select: { id: true, title: true, isLocked: true, status: true },
      })

      if (!thread || thread.status !== 'APPROVED') {
        return res.status(404).json({ error: 'Discussion thread not found.' })
      }
      if (thread.isLocked) {
        return res.status(403).json({ error: 'This discussion thread is locked and cannot receive new replies.' })
      }

      const reply = await prisma.forumReply.create({
        data: {
          threadId: thread.id,
          authorId: userId,
          content,
        },
        include: {
          author: { select: { displayName: true, totalXp: true } },
        },
      })

      // Award XP for answering community questions
      await awardXp(prisma, userId, 10, 'COMMUNITY_REPLY', `Contributed answer to: ${thread.title}`)

      res.status(201).json({
        reply: {
          id: reply.id,
          threadId: reply.threadId,
          content: reply.content,
          authorName: reply.author.displayName,
          authorRank: calculateUserLevel(reply.author.totalXp).rankTitle,
          upvotesCount: 0,
          isAcceptedAnswer: false,
          createdAt: reply.createdAt.toISOString(),
          isOwn: true,
          hasVoted: false,
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // FORUMS: Vote Thread
  // ==========================================
  router.post('/forums/threads/:slug/vote', requireUser, csrfGuard, async (req, res, next) => {
    const slug = String(req.params.slug)
    const userId = req.session.userId!

    try {
      const thread = await prisma.forumThread.findUnique({
        where: { slug },
        select: { id: true, upvotesCount: true },
      })
      if (!thread) return res.status(404).json({ error: 'Thread not found.' })

      const existingVote = await prisma.forumVote.findUnique({
        where: { userId_threadId: { userId, threadId: thread.id } },
      })

      let upvotesCount = thread.upvotesCount
      let hasVoted = false

      if (existingVote) {
        await prisma.forumVote.delete({ where: { id: existingVote.id } })
        upvotesCount = Math.max(0, upvotesCount - 1)
        await prisma.forumThread.update({
          where: { id: thread.id },
          data: { upvotesCount },
        })
        hasVoted = false
      } else {
        await prisma.forumVote.create({
          data: { userId, threadId: thread.id, direction: 1 },
        })
        upvotesCount += 1
        await prisma.forumThread.update({
          where: { id: thread.id },
          data: { upvotesCount },
        })
        hasVoted = true
      }

      res.json({ upvotesCount, hasVoted })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // FORUMS: Vote Reply
  // ==========================================
  router.post('/forums/replies/:replyId/vote', requireUser, csrfGuard, async (req, res, next) => {
    const replyId = String(req.params.replyId)
    const userId = req.session.userId!

    try {
      const reply = await prisma.forumReply.findUnique({
        where: { id: replyId },
        select: { id: true, upvotesCount: true },
      })
      if (!reply) return res.status(404).json({ error: 'Reply not found.' })

      const existingVote = await prisma.forumVote.findUnique({
        where: { userId_replyId: { userId, replyId: reply.id } },
      })

      let upvotesCount = reply.upvotesCount
      let hasVoted = false

      if (existingVote) {
        await prisma.forumVote.delete({ where: { id: existingVote.id } })
        upvotesCount = Math.max(0, upvotesCount - 1)
        await prisma.forumReply.update({
          where: { id: reply.id },
          data: { upvotesCount },
        })
        hasVoted = false
      } else {
        await prisma.forumVote.create({
          data: { userId, replyId: reply.id, direction: 1 },
        })
        upvotesCount += 1
        await prisma.forumReply.update({
          where: { id: reply.id },
          data: { upvotesCount },
        })
        hasVoted = true
      }

      res.json({ upvotesCount, hasVoted })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // KNOWLEDGE BASE: Articles List
  // ==========================================
  router.get('/articles', async (req, res, next) => {
    const parsed = articleQuerySchema.safeParse(req.query)
    if (!parsed.success) return res.status(400).json({ error: 'Invalid article query parameters.' })

    const { category, tag, difficulty, q } = parsed.data

    try {
      // Auto-seed default knowledge articles if database is empty
      const existingCount = await prisma.knowledgeArticle.count()
      if (existingCount === 0) {
        for (const art of DEFAULT_KNOWLEDGE_ARTICLES) {
          await prisma.knowledgeArticle.upsert({
            where: { slug: art.slug },
            update: {},
            create: art,
          })
        }
      }

      const where: Prisma.KnowledgeArticleWhereInput = {}
      if (category && category !== 'all') {
        where.categorySlug = category
      }
      if (tag) {
        where.tags = { contains: tag, mode: 'insensitive' }
      }
      if (difficulty && difficulty !== 'ALL') {
        where.difficulty = difficulty
      }
      if (q) {
        where.OR = [
          { title: { contains: q, mode: 'insensitive' } },
          { summary: { contains: q, mode: 'insensitive' } },
          { tags: { contains: q, mode: 'insensitive' } },
        ]
      }

      const articles = await prisma.knowledgeArticle.findMany({
        where,
        orderBy: [{ isFeatured: 'desc' }, { publishedAt: 'desc' }],
        include: {
          author: { select: { displayName: true } },
        },
      })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        articles: articles.map((a) => ({
          id: a.id,
          slug: a.slug,
          title: a.title,
          summary: a.summary,
          categorySlug: a.categorySlug,
          tags: a.tags.split(',').map((t) => t.trim()),
          difficulty: a.difficulty,
          readTimeMinutes: a.readTimeMinutes,
          authorName: a.author?.displayName || 'Karma Security Research Team',
          viewsCount: a.viewsCount,
          helpfulVotesCount: a.helpfulVotesCount,
          isFeatured: a.isFeatured,
          publishedAt: a.publishedAt.toISOString(),
        })),
      })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // KNOWLEDGE BASE: Article Detail
  // ==========================================
  router.get('/articles/:slug', async (req, res, next) => {
    const slug = String(req.params.slug)

    try {
      let article = await prisma.knowledgeArticle.findUnique({
        where: { slug },
        include: { author: { select: { displayName: true } } },
      })

      // If not in DB yet, check default articles
      if (!article) {
        const found = DEFAULT_KNOWLEDGE_ARTICLES.find((a) => a.slug === slug)
        if (found) {
          article = await prisma.knowledgeArticle.create({
            data: found,
            include: { author: { select: { displayName: true } } },
          })
        }
      }

      if (!article) {
        return res.status(404).json({ error: 'Security article not found.' })
      }

      // Increment views count non-blockingly
      prisma.knowledgeArticle.update({
        where: { id: article.id },
        data: { viewsCount: { increment: 1 } },
      }).catch(() => {})

      // Fetch related articles
      const related = await prisma.knowledgeArticle.findMany({
        where: {
          categorySlug: article.categorySlug,
          id: { not: article.id },
        },
        take: 3,
        select: {
          id: true,
          slug: true,
          title: true,
          summary: true,
          categorySlug: true,
          tags: true,
          difficulty: true,
          readTimeMinutes: true,
          viewsCount: true,
          helpfulVotesCount: true,
          isFeatured: true,
          publishedAt: true,
        },
      })

      res.setHeader('Cache-Control', 'no-store')
      res.json({
        article: {
          id: article.id,
          slug: article.slug,
          title: article.title,
          summary: article.summary,
          content: article.content,
          categorySlug: article.categorySlug,
          tags: article.tags.split(',').map((t) => t.trim()),
          difficulty: article.difficulty,
          readTimeMinutes: article.readTimeMinutes,
          authorName: article.author?.displayName || 'Karma Security Research Team',
          viewsCount: article.viewsCount + 1,
          helpfulVotesCount: article.helpfulVotesCount,
          isFeatured: article.isFeatured,
          publishedAt: article.publishedAt.toISOString(),
          relatedArticles: related.map((r) => ({
            ...r,
            tags: r.tags.split(',').map((t) => t.trim()),
            authorName: 'Karma Security Research Team',
            publishedAt: r.publishedAt.toISOString(),
          })),
        },
      })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // KNOWLEDGE BASE: Article Feedback
  // ==========================================
  router.post('/articles/:slug/helpful', async (req, res, next) => {
    const slug = String(req.params.slug)
    try {
      const article = await prisma.knowledgeArticle.update({
        where: { slug },
        data: { helpfulVotesCount: { increment: 1 } },
        select: { helpfulVotesCount: true },
      })
      res.json({ helpfulVotesCount: article.helpfulVotesCount })
    } catch (error) {
      next(error)
    }
  })

  // ==========================================
  // EXISTING COMMUNITY CORNER (Backwards Compatible)
  // ==========================================
  router.get('/posts', async (req, res, next) => {
    try {
      const posts = await prisma.communityPost.findMany({
        where: req.session.userId ? { OR: [{ status: 'APPROVED' }, { authorId: req.session.userId }] } : { status: 'APPROVED' },
        select: { id: true, body: true, status: true, createdAt: true, authorId: true, author: { select: { displayName: true } } },
        orderBy: { createdAt: 'desc' }, take: 50,
      })
      res.setHeader('Cache-Control', 'no-store')
      res.json({ posts: posts.map(({ authorId, ...post }) => ({ ...post, isOwn: authorId === req.session.userId })) })
    } catch (error) { next(error) }
  })

  router.post('/posts', requireUser, csrfGuard, submissionLimit, async (req, res, next) => {
    const parsed = communityPostSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Posts must be 20 to 800 characters.' })
    try {
      const post = await prisma.communityPost.create({
        data: { authorId: req.session.userId!, body: parsed.data.body },
        select: { id: true, body: true, status: true, createdAt: true, author: { select: { displayName: true } } },
      })
      res.status(201).json({ post })
    } catch (error) { next(error) }
  })

  router.post('/posts/:postId/reports', requireUser, csrfGuard, reportLimit, async (req, res, next) => {
    const postId = req.params.postId
    if (typeof postId !== 'string' || !isKnownPostId(postId)) return res.status(404).json({ error: 'Post not found.' })
    const parsed = communityReportSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose a report reason and keep the note under 300 characters.' })
    try {
      const post = await prisma.communityPost.findUnique({ where: { id: postId }, select: { id: true, authorId: true, status: true } })
      if (!post || post.status !== 'APPROVED') return res.status(404).json({ error: 'Post not found.' })
      if (post.authorId === req.session.userId) return res.status(400).json({ error: 'You cannot report your own post.' })
      await prisma.communityReport.create({ data: { postId: post.id, reporterId: req.session.userId!, ...parsed.data } })
      res.status(201).json({ message: 'Report sent to the moderation team.' })
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') return res.status(409).json({ error: 'You have already reported this post.' })
      next(error)
    }
  })

  async function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (!req.session.userId) return res.status(401).json({ error: 'Sign in with a moderator account.' })
    try {
      const user = await prisma.user.findUnique({ where: { id: req.session.userId }, select: { role: true } })
      if (user?.role !== 'ADMIN') return res.status(403).json({ error: 'Moderator access is required.' })
      next()
    } catch (error) { next(error) }
  }

  router.get('/moderation', requireUser, requireAdmin, async (_req, res, next) => {
    try {
      const [posts, reports] = await Promise.all([
        prisma.communityPost.findMany({ where: { status: 'PENDING' }, select: { id: true, body: true, createdAt: true, author: { select: { displayName: true } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
        prisma.communityReport.findMany({ where: { status: 'OPEN' }, select: { id: true, reason: true, details: true, createdAt: true, reporter: { select: { displayName: true } }, post: { select: { id: true, body: true, author: { select: { displayName: true } } } } }, orderBy: { createdAt: 'asc' }, take: 100 }),
      ])
      res.setHeader('Cache-Control', 'no-store')
      res.json({ posts, reports })
    } catch (error) { next(error) }
  })

  router.patch('/moderation/posts/:postId', requireUser, requireAdmin, csrfGuard, async (req, res, next) => {
    const postId = req.params.postId
    if (typeof postId !== 'string' || !isKnownPostId(postId)) return res.status(404).json({ error: 'Post not found.' })
    const parsed = communityPostStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose approve or hide.' })
    try {
      const post = await prisma.communityPost.update({ where: { id: postId }, data: { status: parsed.data.status, moderatedAt: new Date(), moderatorId: req.session.userId! }, select: { id: true, status: true } })
      res.json({ post })
    } catch (error) { next(error) }
  })

  router.patch('/moderation/reports/:reportId', requireUser, requireAdmin, csrfGuard, async (req, res, next) => {
    const reportId = req.params.reportId
    if (typeof reportId !== 'string' || !isKnownPostId(reportId)) return res.status(404).json({ error: 'Report not found.' })
    const parsed = communityReportStatusSchema.safeParse(req.body)
    if (!parsed.success) return res.status(400).json({ error: 'Choose reviewed or dismissed.' })
    try {
      const report = await prisma.communityReport.update({ where: { id: reportId }, data: { status: parsed.data.status, reviewedAt: new Date(), moderatorId: req.session.userId! }, select: { id: true, status: true } })
      res.json({ report })
    } catch (error) { next(error) }
  })

  return router
}

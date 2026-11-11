export type GlossaryCategory = 'FOUNDATIONS' | 'NETWORKS' | 'WEB SECURITY'

export type GlossaryTerm = {
  term: string
  category: GlossaryCategory
  definition: string
  example: string
  courseId: 'foundations' | 'network' | 'web'
  lessonIndex: number
}

export const glossaryTerms: GlossaryTerm[] = [
  {
    term: 'Availability', category: 'FOUNDATIONS',
    definition: 'The right people can use a system or information when they need it.',
    example: 'A tested backup can help restore a service after a device fails.',
    courseId: 'foundations', lessonIndex: 1,
  },
  {
    term: 'Authentication', category: 'WEB SECURITY',
    definition: 'A check that helps a service confirm who is signing in.',
    example: 'A password plus an authenticator code uses two different checks.',
    courseId: 'web', lessonIndex: 1,
  },
  {
    term: 'Browser and server', category: 'WEB SECURITY',
    definition: 'The browser asks for a page or action; a server processes the request and sends a response.',
    example: 'When you open a lesson, your browser requests it and the website server returns the page.',
    courseId: 'web', lessonIndex: 0,
  },
  {
    term: 'Confidentiality, integrity, availability', category: 'FOUNDATIONS',
    definition: 'Three useful goals for security: keep information private, accurate, and usable.',
    example: 'A school portal should show grades only to approved people, preserve correct marks, and work during enrollment.',
    courseId: 'foundations', lessonIndex: 1,
  },
  {
    term: 'Cookie', category: 'WEB SECURITY',
    definition: 'A small piece of data a website stores in a browser, often to remember a session or preference.',
    example: 'A protected session cookie can help a site remember that you signed in.',
    courseId: 'web', lessonIndex: 1,
  },
  {
    term: 'Defense in depth', category: 'NETWORKS',
    definition: 'Using several safeguards so one failure does not expose everything.',
    example: 'Updates, access controls, backups, and monitoring cover different kinds of risk.',
    courseId: 'network', lessonIndex: 2,
  },
  {
    term: 'Domain Name System (DNS)', category: 'NETWORKS',
    definition: 'A naming system that helps devices find the network address for a domain name.',
    example: 'DNS helps a browser find where to send a request for a familiar website name.',
    courseId: 'network', lessonIndex: 1,
  },
  {
    term: 'Firewall', category: 'NETWORKS',
    definition: 'A control that allows or blocks network traffic according to a set of rules.',
    example: 'A home router may block unexpected incoming connections by default.',
    courseId: 'network', lessonIndex: 2,
  },
  {
    term: 'Hash', category: 'WEB SECURITY',
    definition: 'A one-way calculation that produces a fixed-length value used to check or protect data.',
    example: 'A service can store a password hash instead of keeping the original password.',
    courseId: 'web', lessonIndex: 1,
  },
  {
    term: 'HTTPS', category: 'WEB SECURITY',
    definition: 'The secure form of HTTP, which protects information traveling between a browser and a website.',
    example: 'A browser uses HTTPS when it connects securely to a sign-in page.',
    courseId: 'web', lessonIndex: 0,
  },
  {
    term: 'Input validation', category: 'WEB SECURITY',
    definition: 'Checking that information from a user has the expected type, size, and format before using it.',
    example: 'A date field should reject text that is not a valid date.',
    courseId: 'web', lessonIndex: 2,
  },
  {
    term: 'Integrity', category: 'FOUNDATIONS',
    definition: 'Information and systems stay accurate and are changed only in appropriate ways.',
    example: 'A verified record helps ensure a grade was not changed without authorization.',
    courseId: 'foundations', lessonIndex: 1,
  },
  {
    term: 'IP address', category: 'NETWORKS',
    definition: 'A network address that helps route information to the right device or service.',
    example: 'A router uses network addresses to send a message toward its destination.',
    courseId: 'network', lessonIndex: 0,
  },
  {
    term: 'Multifactor authentication (MFA)', category: 'WEB SECURITY',
    definition: 'A sign-in method that asks for proof from more than one category, such as something you know and something you have.',
    example: 'A password and a code from an authenticator app are two different factors.',
    courseId: 'web', lessonIndex: 1,
  },
  {
    term: 'Network protocol', category: 'NETWORKS',
    definition: 'A shared set of rules that devices follow to exchange information.',
    example: 'Web browsers and servers use agreed protocols to request and return pages.',
    courseId: 'network', lessonIndex: 0,
  },
  {
    term: 'Phishing', category: 'FOUNDATIONS',
    definition: 'A deceptive message that tries to get someone to reveal information or take an unsafe action.',
    example: 'A fake delivery notice may pressure you to open an unexpected link.',
    courseId: 'foundations', lessonIndex: 2,
  },
  {
    term: 'Risk', category: 'FOUNDATIONS',
    definition: 'The possibility that a threat could use a weakness and cause harm.',
    example: 'A lost, unencrypted laptop may put the information stored on it at risk.',
    courseId: 'foundations', lessonIndex: 2,
  },
  {
    term: 'Router', category: 'NETWORKS',
    definition: 'A device that directs network traffic between different networks.',
    example: 'A home router connects devices in the home network to the internet.',
    courseId: 'network', lessonIndex: 0,
  },
  {
    term: 'Session', category: 'WEB SECURITY',
    definition: 'A way for an application to remember that a user has already signed in across multiple requests.',
    example: 'A protected session lets you move between pages without entering your password each time.',
    courseId: 'web', lessonIndex: 1,
  },
  {
    term: 'SQL injection', category: 'WEB SECURITY',
    definition: 'A weakness where unsafe handling of input lets it change the meaning of a database query.',
    example: 'Parameterized database queries keep a search value separate from query instructions.',
    courseId: 'web', lessonIndex: 2,
  },
  {
    term: 'Threat', category: 'FOUNDATIONS',
    definition: 'Something that could cause harm by taking advantage of a weakness.',
    example: 'A stolen account password can be a threat to private information in that account.',
    courseId: 'foundations', lessonIndex: 2,
  },
  {
    term: 'Vulnerability', category: 'FOUNDATIONS',
    definition: 'A weakness in a system, process, or behavior that could be used to cause harm.',
    example: 'Unpatched software may contain a known weakness that an attacker could exploit.',
    courseId: 'foundations', lessonIndex: 2,
  },
  {
    term: 'Cross-site scripting (XSS)', category: 'WEB SECURITY',
    definition: 'A web weakness where untrusted content is treated as active page code in another person’s browser.',
    example: 'A site that safely displays user text as text helps prevent it from running as page code.',
    courseId: 'web', lessonIndex: 2,
  },
]

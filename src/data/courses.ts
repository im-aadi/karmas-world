export type Lesson = {
  title: string
  duration: string
  body: string[]
  takeaway: string
  question: string
  options: string[]
  answer: number
  explanation: string
}

export type Course = {
  id: string
  title: string
  level: string
  description: string
  lessons: Lesson[]
}

export const courses: Course[] = [
  {
    id: 'foundations', title: 'Cybersecurity foundations', level: 'BEGINNER',
    description: 'Learn the core ideas behind protecting people, information, and systems.',
    lessons: [
      { title: 'What cybersecurity protects', duration: '6 min', body: ['Cybersecurity is the practice of reducing harm to digital systems and the people who rely on them. It covers devices, accounts, networks, applications, and the information they hold.', 'Good security is not a single product or a one-time task. It combines thoughtful design, sensible habits, and ongoing attention to changing risks.'], takeaway: 'Security means managing risk so people and services can keep working safely.', question: 'Which statement best describes cybersecurity?', options: ['A single tool that blocks every threat', 'A practice for reducing risk to systems and people', 'A way to make every file public'], answer: 1, explanation: 'Cybersecurity combines people, processes, and technology to reduce risk. No one tool can prevent every problem.' },
      { title: 'The security triad', duration: '7 min', body: ['A useful starting model is confidentiality, integrity, and availability. Confidentiality means information is seen only by the right people. Integrity means it stays accurate and complete. Availability means authorized people can use it when needed.', 'These goals can pull in different directions. For example, stronger access checks may improve confidentiality but can make a service harder to reach if they are poorly designed.'], takeaway: 'Ask what must stay private, accurate, and available for each system.', question: 'A team restores a service after an outage. Which security goal are they supporting most directly?', options: ['Availability', 'Confidentiality', 'Integrity'], answer: 0, explanation: 'Availability is about authorized users being able to access a service when they need it.' },
      { title: 'Think in risks', duration: '8 min', body: ['A risk is the chance that a threat could use a weakness and cause harm. Start by identifying what matters, what could go wrong, and what the impact would be.', 'Risk management is about choosing proportionate safeguards. A family photo account, a hospital system, and a public library kiosk have different needs and consequences.'], takeaway: 'Prioritize safeguards by likely harm and the value of what you are protecting.', question: 'What is a sensible first step when assessing risk?', options: ['Install every available security tool', 'Identify what matters and what could harm it', 'Assume the system is safe if it has a password'], answer: 1, explanation: 'You need to understand assets, threats, and possible impact before choosing proportionate safeguards.' },
    ],
  },
  {
    id: 'network', title: 'Network defense', level: 'BEGINNER → INTERMEDIATE',
    description: 'Understand how devices communicate and how defenders notice unusual activity.',
    lessons: [
      { title: 'How devices find each other', duration: '7 min', body: ['Networks let devices exchange information using agreed rules called protocols. Addresses help traffic reach the right destination, while routers connect separate networks.', 'A helpful defender learns the normal shape of a network: which devices exist, which services they need, and how information usually moves.'], takeaway: 'Knowing what is normal makes unusual network behavior easier to investigate.', question: 'Why keep an inventory of devices on a network?', options: ['To know what is expected and spot unknown devices', 'To make every device reachable from anywhere', 'To avoid updating software'], answer: 0, explanation: 'An inventory gives defenders context for recognizing unexpected devices and activity.' },
      { title: 'DNS: names to destinations', duration: '6 min', body: ['The Domain Name System (DNS) helps translate human-readable names into network addresses. It is part of the ordinary process of visiting websites and using online services.', 'Unexpected or unusual DNS requests can be a useful clue during an investigation, but one clue alone rarely proves something is malicious. Context matters.'], takeaway: 'Security signals need context; a single unusual request is a lead to investigate.', question: 'What does DNS help a device do?', options: ['Translate a domain name to a network address', 'Encrypt every file on a computer', 'Decide whether a password is strong'], answer: 0, explanation: 'DNS helps devices look up the network address associated with a domain name.' },
      { title: 'Layers of defense', duration: '8 min', body: ['Defense in depth uses multiple safeguards so one failure does not expose everything. Examples include timely updates, access controls, network separation, backups, and monitoring.', 'Layers should work together and be reviewed regularly. A safeguard that nobody maintains can create a false sense of security.'], takeaway: 'Use complementary safeguards and verify that they remain effective.', question: 'What is the main idea behind defense in depth?', options: ['Rely on one very strong perimeter', 'Use complementary safeguards so one failure is not enough', 'Disable monitoring to reduce noise'], answer: 1, explanation: 'Multiple complementary layers help limit harm when one safeguard fails.' },
    ],
  },
  {
    id: 'web', title: 'Web security', level: 'INTERMEDIATE',
    description: 'Explore how web apps handle requests, accounts, and user-provided information.',
    lessons: [
      { title: 'A browser and a server', duration: '6 min', body: ['A web application usually has a browser that sends requests and a server that processes them. The server may read or update data, then returns a response for the browser to display.', 'Clear trust boundaries matter: information received from a browser should be checked before it is used or stored.'], takeaway: 'Treat information crossing a trust boundary as untrusted until it is checked.', question: 'How should a server treat data received from a browser?', options: ['As trusted because the browser sent it', 'As untrusted input that needs validation', 'As a command to run immediately'], answer: 1, explanation: 'Client-side input can be changed, so servers need to validate it independently.' },
      { title: 'Sign-in and sessions', duration: '7 min', body: ['Authentication checks who a user is. A session lets an application remember that a user has authenticated across requests.', 'Secure applications protect sign-in flows, limit session exposure, and provide ways to end sessions. Users can help by using unique passwords and enabling multifactor authentication when available.'], takeaway: 'Authentication establishes identity; session controls protect access afterward.', question: 'What is a session used for in a web application?', options: ['To remember an authenticated user across requests', 'To make browser input automatically safe', 'To replace software updates'], answer: 0, explanation: 'A session maintains the authenticated state as the user continues to interact with the application.' },
      { title: 'Handle input safely', duration: '8 min', body: ['Applications should validate input for the expected type, size, and format. They should also use safe APIs that keep data separate from instructions.', 'These are secure design principles. Practice them only in code and environments you own or are explicitly allowed to test.'], takeaway: 'Validate input and use safe APIs; test only where you have permission.', question: 'Which is a safer way to handle user-provided values?', options: ['Validate them and pass them as data to safe APIs', 'Assume they match the form label', 'Combine them directly with executable instructions'], answer: 0, explanation: 'Validation and APIs that separate data from instructions reduce risk.' },
    ],
  },
]

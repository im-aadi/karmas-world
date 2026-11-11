export type GameQuestion = {
  prompt: string
  options: string[]
  answer: number
  explanation: string
}

export type CyberGame = {
  id: string
  title: string
  category: string
  description: string
  icon: string
  questions: GameQuestion[]
}

export const cyberGames: CyberGame[] = [
  {
    id: 'phishing', title: 'Phishing detective', category: 'SPOT THE SIGNALS', icon: '⌁',
    description: 'Inspect fictional messages and learn which details deserve a closer look.',
    questions: [
      { prompt: 'A fictional delivery notice says “your parcel is waiting” and asks you to sign in at ship-fast.example. What is the safest next step?', options: ['Use the company’s official app or type its known website yourself', 'Reply with your account details to confirm delivery', 'Open the message again and click the biggest button'], answer: 0, explanation: 'Unexpected messages can imitate familiar services. Verify through a channel you already trust instead of using a link in the message.' },
      { prompt: 'A coworker sends an unexpected attachment with “open this invoice right now.” What should you do first?', options: ['Check with the coworker through a separate, trusted channel', 'Enable macros so the invoice loads correctly', 'Forward it to everyone for a second opinion'], answer: 0, explanation: 'Urgency and unexpected files are reasons to verify with the sender using a separate channel.' },
      { prompt: 'Which clue is most useful when checking whether a sign-in page is genuine?', options: ['The familiar logo looks polished', 'The domain matches the service’s known official domain', 'The page says your account will be closed soon'], answer: 1, explanation: 'Visual design is easy to copy. Check the destination domain and use a known route to reach the service.' },
    ],
  },
  {
    id: 'passwords', title: 'Passphrase builder', category: 'MAKE BETTER CHOICES', icon: '◇',
    description: 'Practice choosing strong account habits without entering or storing a real password.',
    questions: [
      { prompt: 'Which approach makes an account password harder to guess?', options: ['A long, unique passphrase that you do not reuse', 'Your pet’s name plus the current year', 'The same password you use for every account'], answer: 0, explanation: 'Length and uniqueness matter. A password manager can help create and remember unique passwords.' },
      { prompt: 'A site offers multifactor authentication. What does it add?', options: ['Another verification step beyond the password', 'A guarantee that phishing is impossible', 'A replacement for software updates'], answer: 0, explanation: 'Multifactor authentication adds a second proof of identity. It helps, though it does not make every attack impossible.' },
      { prompt: 'Where is a good place to keep unique passwords?', options: ['A reputable password manager', 'A note shared with your whole team', 'A public profile so you can find it easily'], answer: 0, explanation: 'A reputable password manager can generate and securely store unique passwords for different accounts.' },
    ],
  },
  {
    id: 'network', title: 'Network detective', category: 'READ THE CLUES', icon: '⌘',
    description: 'Review a made-up activity summary and decide what a careful defender should check.',
    questions: [
      { prompt: 'A fictional laptop contacts a new service late at night, unlike its usual pattern. What is the best first response?', options: ['Review context and related records before drawing a conclusion', 'Assume it is harmless because only one alert appeared', 'Immediately delete every record from the laptop'], answer: 0, explanation: 'One signal is a starting point, not proof. Check the device owner, expected software, and nearby activity.' },
      { prompt: 'Several accounts show sign-ins from a new location around the same time. What might help the investigation?', options: ['Compare the events with known travel, device, and sign-in context', 'Publish the account names online', 'Turn off all monitoring permanently'], answer: 0, explanation: 'Correlating multiple trusted records helps defenders understand whether events are related.' },
      { prompt: 'Why should defenders document their investigation steps?', options: ['So findings can be reviewed and others can continue the work', 'So the investigation can skip verification', 'So every alert must be treated as a confirmed incident'], answer: 0, explanation: 'Clear notes preserve context, support careful decisions, and make handoffs more reliable.' },
    ],
  },
  {
    id: 'ctf', title: 'Mini CTF: the lost badge', category: 'SAFE PUZZLE', icon: '⚑',
    description: 'Solve a small, self-contained logic puzzle with clues provided right here.',
    questions: [
      { prompt: 'A fictional event badge says “The archive is two doors after the green room.” Rooms are listed: blue, green, red, archive. Which room is the archive?', options: ['Red', 'Green', 'Blue'], answer: 0, explanation: 'Following the list, green is the second room; red comes next and the archive follows it.' },
      { prompt: 'The archive note reads “read the first letter of each line.” The lines are: Always check; Never rush; Ask before opening. What word do the initials make?', options: ['ANA', 'CAN', 'AAN'], answer: 0, explanation: 'The first letters are A, N, and A. This puzzle is fully fictional and self-contained.' },
      { prompt: 'The note says the final code is the number of letters in “ANA.” What is the code?', options: ['3', '2', '5'], answer: 0, explanation: 'ANA has three letters, so the final answer is 3.' },
    ],
  },
]

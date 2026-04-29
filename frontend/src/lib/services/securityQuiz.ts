// Security Quiz Question Bank
// Categories: Easy, Medium, Hard
// Focus: Practical cybersecurity awareness

export interface QuizQuestion {
  id: number;
  category: 'Easy' | 'Medium' | 'Hard';
  question: string;
  options: string[];
  correctAnswer: number; // Index of correct option (0-3)
  explanation: string;
}

export const questionBank: QuizQuestion[] = [
  // EASY QUESTIONS
  {
    id: 1,
    category: 'Easy',
    question: 'You receive an email from "PayPal" asking you to verify your account by clicking a link. The email address is support@paypa1-secure.com. What should you do?',
    options: [
      'Click the link and verify your account immediately',
      'Ignore the email - it\'s a phishing attempt (notice the "1" instead of "l")',
      'Reply to the email asking if it\'s legitimate',
      'Forward the email to all your contacts as a warning'
    ],
    correctAnswer: 1,
    explanation: 'This is a classic phishing attempt. The email address uses "paypa1" (with number 1) instead of "paypal" to trick you. Always check the sender\'s email address carefully and never click links in suspicious emails.'
  },
  {
    id: 2,
    category: 'Easy',
    question: 'Which of the following is the STRONGEST password?',
    options: [
      'password123',
      'John1990',
      'Tr0ub4dor&3xY!9',
      'qwerty12345'
    ],
    correctAnswer: 2,
    explanation: '"Tr0ub4dor&3xY!9" is the strongest because it\'s long (13+ characters), uses mixed case, numbers, and special characters. The others are common patterns that can be easily guessed or found in breach databases.'
  },
  {
    id: 3,
    category: 'Easy',
    question: 'You see a public Wi-Fi network called "Free Airport WiFi" at the airport. Should you connect to it for online banking?',
    options: [
      'Yes, it\'s free and convenient',
      'Yes, but only if you use incognito mode',
      'No, public Wi-Fi is unsecured - use mobile data or a VPN instead',
      'Yes, as long as you don\'t save your password'
    ],
    correctAnswer: 2,
    explanation: 'Public Wi-Fi networks are often unsecured and can be easily intercepted by hackers. Anyone can create a fake network with a convincing name. For sensitive activities like banking, always use mobile data or a trusted VPN.'
  },
  {
    id: 4,
    category: 'Easy',
    question: 'A website shows a padlock icon (HTTPS) in the URL bar. This means:',
    options: [
      'The website is 100% safe and legitimate',
      'The connection is encrypted, but the site could still be fraudulent',
      'The website has been verified by the government',
      'Your computer cannot get viruses from this site'
    ],
    correctAnswer: 1,
    explanation: 'HTTPS only means the connection between you and the website is encrypted. It does NOT mean the website is legitimate. Phishing sites can also use HTTPS. Always verify the website\'s authenticity beyond just checking for HTTPS.'
  },
  {
    id: 5,
    category: 'Easy',
    question: 'You receive a text message: "Your package delivery failed. Click here to reschedule: bit.ly/3xYz9Qr". What should you do?',
    options: [
      'Click the link immediately to avoid missing your package',
      'Ignore it - you didn\'t order anything',
      'Check your order status directly on the retailer\'s official website or app',
      'Reply to the text asking for more details'
    ],
    correctAnswer: 2,
    explanation: 'This is a common smishing (SMS phishing) scam. Instead of clicking unknown links, always go directly to the official website or app to check your order status. Shortened URLs (bit.ly) hide the real destination.'
  },

  // MEDIUM QUESTIONS
  {
    id: 6,
    category: 'Medium',
    question: 'You get a call from someone claiming to be from "Microsoft Support" saying your computer has a virus. They ask for remote access to fix it. What should you do?',
    options: [
      'Give them access - Microsoft should know about viruses',
      'Hang up immediately - Microsoft doesn\'t make unsolicited calls',
      'Ask for their employee ID to verify later',
      'Let them access but monitor what they do'
    ],
    correctAnswer: 1,
    explanation: 'Microsoft (and other tech companies) NEVER make unsolicited calls about viruses. This is a tech support scam. Hang up immediately. If you\'re concerned about your computer, contact Microsoft through their official website.'
  },
  {
    id: 7,
    category: 'Medium',
    question: 'You receive an urgent email from your "CEO" asking you to buy gift cards and send the codes immediately for a confidential business deal. What type of attack is this?',
    options: [
      'Phishing',
      'Business Email Compromise (BEC) / CEO Fraud',
      'Ransomware',
      'Man-in-the-middle attack'
    ],
    correctAnswer: 1,
    explanation: 'This is Business Email Compromise (BEC), specifically CEO fraud. The attacker impersonates an executive to create urgency and bypass normal procedures. Always verify such requests through a different communication channel (call the CEO directly).'
  },
  {
    id: 8,
    category: 'Medium',
    question: 'You\'re shopping online and see a deal that\'s 90% off on a popular product. The website URL is amaz0n-deals.com. What red flags do you notice?',
    options: [
      'Nothing suspicious - great deals happen',
      'The URL uses "0" instead of "o" and isn\'t the official amazon.com',
      'Only the price matters, not the URL',
      'The site has product photos so it must be real'
    ],
    correctAnswer: 1,
    explanation: 'The URL "amaz0n-deals.com" uses a zero instead of the letter "o" - this is typosquatting. Combined with an unrealistic 90% discount, this is clearly a scam site designed to steal your payment information. Always verify you\'re on the official website.'
  },
  {
    id: 9,
    category: 'Medium',
    question: 'A friend sends you a Facebook message: "OMG is this you in this video?!" with a link. You click it and it asks you to login to Facebook to view the video. What\'s happening?',
    options: [
      'Facebook requires login to view videos',
      'Your friend\'s account is likely compromised - this is a credential harvesting attack',
      'It\'s a normal Facebook feature',
      'You should login quickly before the video expires'
    ],
    correctAnswer: 1,
    explanation: 'This is a classic credential harvesting attack. Your friend\'s account was likely compromised, and the malicious link leads to a fake Facebook login page designed to steal your credentials. Never login through links in messages - go directly to facebook.com.'
  },
  {
    id: 10,
    category: 'Medium',
    question: 'You receive an OTP code via SMS that you didn\'t request. What should you do?',
    options: [
      'Ignore it - someone probably typed the wrong number',
      'Share it with the person who contacted you',
      'Immediately change your password and enable 2FA if not already enabled',
      'Reply "STOP" to the message'
    ],
    correctAnswer: 2,
    explanation: 'An unexpected OTP means someone has your credentials and is trying to login. This is a critical warning sign. Immediately change your password, enable two-factor authentication (2FA), and check for any unauthorized activity on your account.'
  },
  {
    id: 11,
    category: 'Medium',
    question: 'You download a free PDF editor from a torrent site. A week later, your browser shows unusual pop-ups and redirects. What likely happened?',
    options: [
      'Your browser needs updating',
      'The cracked software contained malware that infected your system',
      'It\'s just a coincidence - unrelated issues',
      'Your internet provider is redirecting traffic'
    ],
    correctAnswer: 1,
    explanation: 'Cracked/pirated software from torrent sites is one of the most common malware distribution methods. The software likely contained trojans, adware, or ransomware. Always download software from official sources and use antivirus protection.'
  },
  {
    id: 12,
    category: 'Medium',
    question: 'A website asks you to complete a "human verification" survey that requires your phone number and email before showing content. This is likely:',
    options: [
      'A legitimate security measure',
      'A social engineering tactic to harvest personal information',
      'Required by law for all websites',
      'Safe as long as you use a temporary email'
    ],
    correctAnswer: 1,
    explanation: 'Legitimate CAPTCHAs don\'t require personal information. These fake "verification" surveys are designed to harvest phone numbers and emails for spam, phishing, or selling to third parties. Close the page and find the content elsewhere.'
  },

  // HARD QUESTIONS
  {
    id: 13,
    category: 'Hard',
    question: 'You receive an email that appears to be from your bank with perfect formatting, your name, and last 4 digits of your account. The link goes to bankofamerica-secure.com (not bankofamerica.com). This is an example of:',
    options: [
      'Spear phishing with typosquatting',
      'A legitimate secure portal',
      'Email spoofing only',
      'A safe link with extra security'
    ],
    correctAnswer: 0,
    explanation: 'This is spear phishing (targeted attack using your personal info) combined with typosquatting (similar but fake domain). Attackers use publicly available information to make emails appear legitimate. Always verify the exact URL - even one extra word makes it fraudulent.'
  },
  {
    id: 14,
    category: 'Hard',
    question: 'An attacker sends you a malicious QR code via email that, when scanned, directs you to a fake login page. This attack technique is called:',
    options: [
      'QRishing (Quishing)',
      'Pharming',
      'DNS spoofing',
      'SQL injection'
    ],
    correctAnswer: 0,
    explanation: 'QRishing (or Quishing) is a growing threat where attackers use QR codes to bypass email security filters (which can\'t easily scan QR codes). Always be cautious with QR codes in emails - verify the URL before entering any credentials.'
  },
  {
    id: 15,
    category: 'Hard',
    question: 'You receive a LinkedIn message from a recruiter offering an amazing job. They send you a "company handbook" PDF to review before the interview. What\'s the risk?',
    options: [
      'No risk - it\'s just a PDF',
      'The PDF could contain malicious macros or exploits that install malware when opened',
      'LinkedIn messages are always verified',
      'Only executable files (.exe) can contain malware'
    ],
    correctAnswer: 1,
    explanation: 'PDFs can contain malicious scripts, exploits, or embedded malware. Attackers often use fake job offers to deliver malicious documents. Always verify the sender, and use a PDF viewer with security features enabled. When in doubt, use online PDF scanners.'
  },
  {
    id: 16,
    category: 'Hard',
    question: 'A colleague forwards you an email chain about a "security update" that requires you to install a certificate on your computer. The email has legitimate-looking signatures and formatting. What should you do FIRST?',
    options: [
      'Install the certificate immediately for security',
      'Verify with your IT department through official channels before taking any action',
      'Check the email headers yourself',
      'Ask other colleagues if they installed it'
    ],
    correctAnswer: 1,
    explanation: 'Always verify security-related requests through official, pre-established channels (not reply-to emails or phone numbers in the email). Attackers can forge email signatures and formatting. Your IT department can confirm if this is a legitimate update.'
  },
  {
    id: 17,
    category: 'Hard',
    question: 'You notice a small icon in your browser toolbar that you don\'t recognize. When you check your browser extensions, you see one you don\'t remember installing. This is likely:',
    options: [
      'A browser update feature',
      'A potentially unwanted program (PUP) or browser hijacker',
      'An automatic Windows update',
      'Harmless - browsers add features automatically'
    ],
    correctAnswer: 1,
    explanation: 'Unknown browser extensions are often PUPs or browser hijackers installed through bundling with other software. They can track your browsing, inject ads, or steal data. Remove unknown extensions immediately and run a security scan.'
  },
  {
    id: 18,
    category: 'Hard',
    question: 'An attacker creates a fake job posting on a legitimate site. When you apply, they ask you to complete a "skills test" that requires downloading their proprietary testing software. This is:',
    options: [
      'A normal hiring practice',
      'A targeted malware delivery attack disguised as recruitment',
      'Safe if the job posting site is legitimate',
      'Only dangerous if you pay for the software'
    ],
    correctAnswer: 1,
    explanation: 'Attackers increasingly use fake job postings to deliver malware. The "testing software" is likely malicious. Legitimate companies use established platforms for skills assessment. Never download unknown software during job applications, and verify the company through official channels.'
  },
  {
    id: 19,
    category: 'Hard',
    question: 'You receive a WhatsApp message from an unknown number claiming to be your bank\'s fraud department. They ask you to install a "security app" (APK file) to protect your account. What\'s the danger?',
    options: [
      'No danger if the app looks professional',
      'The APK could be malware that steals banking credentials, OTPs, and personal data',
      'Banks do send security apps via WhatsApp',
      'Only dangerous if you grant camera permissions'
    ],
    correctAnswer: 1,
    explanation: 'Banks NEVER send apps via WhatsApp or messaging apps. APK files from unknown sources can contain banking trojans that capture screenshots, log keystrokes, read SMS (including OTPs), and steal credentials. Only install banking apps from official app stores.'
  },
  {
    id: 20,
    category: 'Hard',
    question: 'During an online purchase, the payment page URL changes from shop.com to payment-verify.shop.com.gateway-secure.net/process. This indicates:',
    options: [
      'A secure third-party payment processor',
      'Likely a fraudulent redirect - the actual domain is gateway-secure.net',
      'The website upgraded its security',
      'A normal subdomain structure'
    ],
    correctAnswer: 1,
    explanation: 'The actual domain is "gateway-secure.net" (the last part before the first slash). Everything before that is subdomain manipulation designed to look legitimate. Always check the actual domain name, not the full URL. This is likely a payment phishing site.'
  },
  {
    id: 21,
    category: 'Easy',
    question: 'Your antivirus software is expired and asks you to renew. Where should you purchase the renewal?',
    options: [
      'Click the renewal link in the popup notification',
      'Go directly to the official antivirus website or authorized retailer',
      'Buy from any website offering the cheapest price',
      'Ask someone to email you a license key'
    ],
    correctAnswer: 1,
    explanation: 'Fake renewal popups are common malware distribution methods. Always go directly to the official website to renew your antivirus. Never click renewal links in popups, as they could be fake and install malware instead of renewing your license.'
  },
  {
    id: 22,
    category: 'Medium',
    question: 'You receive an email stating your cloud storage is full and will be deleted in 24 hours unless you verify your account. The countdown timer adds urgency. This uses which psychological tactic?',
    options: [
      'Authority impersonation',
      'Artificial urgency and scarcity to bypass critical thinking',
      'Social proof',
      'Reciprocity'
    ],
    correctAnswer: 1,
    explanation: 'Attackers use artificial urgency (24-hour countdown) to create panic and bypass your critical thinking. When you feel rushed, you\'re less likely to verify the email\'s authenticity. Always pause and verify urgent requests through official channels.'
  },
  {
    id: 23,
    category: 'Hard',
    question: 'A website you visit regularly suddenly shows a certificate error. When you check, the SSL certificate was issued yesterday to a different company name. What should you do?',
    options: [
      'Ignore the warning and proceed',
      'Do NOT enter any information - the site may be compromised or spoofed',
      'Clear your browser cache and try again',
      'Contact the website via their contact form on the same page'
    ],
    correctAnswer: 1,
    explanation: 'A sudden certificate change to a different entity is a major red flag. The site could be compromised, DNS could be hijacked, or you could be on a spoofed site. Do NOT enter any credentials or personal information until you verify the site\'s authenticity through a different channel.'
  },
  {
    id: 24,
    category: 'Easy',
    question: 'Which of these is the BEST practice for managing passwords across multiple accounts?',
    options: [
      'Use the same password for all accounts so you don\'t forget',
      'Write passwords in a notebook kept at your desk',
      'Use a reputable password manager with a strong master password',
      'Use variations of your pet\'s name with different numbers'
    ],
    correctAnswer: 2,
    explanation: 'Password managers generate and store unique, complex passwords for each account, protected by one strong master password. This prevents credential stuffing attacks where one breached password compromises all your accounts. Choose reputable managers like Bitwarden, 1Password, or KeePass.'
  },
  {
    id: 25,
    category: 'Medium',
    question: 'You see a post on social media: "Click here to see who viewed your profile!" with a link to an external website. What\'s the most likely outcome if you click and login?',
    options: [
      'You\'ll see your profile visitors',
      'Your account credentials will be stolen and your account may be used to spread the same scam',
      'Facebook will ban your account',
      'Nothing - it\'s just a harmless prank'
    ],
    correctAnswer: 1,
    explanation: 'Social media platforms don\'t allow third-party apps to show profile visitors. These are credential harvesting scams designed to steal your login. Once compromised, attackers use your account to spread the same scam to your friends, multiplying the attack.'
  }
];

// Helper function to shuffle array (Fisher-Yates algorithm)
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// Generate quiz session with 10 random questions
export function generateQuizSession(): QuizQuestion[] {
  const shuffled = shuffleArray(questionBank);
  return shuffled.slice(0, 10).map(question => {
    // Shuffle options while tracking correct answer
    const correctOption = question.options[question.correctAnswer];
    const shuffledOptions = shuffleArray(question.options);
    const newCorrectIndex = shuffledOptions.indexOf(correctOption);
    
    return {
      ...question,
      options: shuffledOptions,
      correctAnswer: newCorrectIndex
    };
  });
}

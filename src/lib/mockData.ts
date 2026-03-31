// Centralized mock data and analysis functions for APGS

export type ScanStatus = "safe" | "phishing";

export interface UrlAnalysis {
  status: ScanStatus;
  url: string;
  reasons: { label: string; value: string; flagged: boolean }[];
  score: number;
}

export interface ScanHistoryItem {
  id: string;
  type: "url" | "file" | "email" | "password";
  target: string;
  status: "safe" | "phishing" | "breached" | "weak" | "medium" | "strong";
  timestamp: Date;
}

export interface BreachResult {
  breached: boolean;
  count: number;
  sources: string[];
}

export interface PasswordResult {
  strength: "weak" | "medium" | "strong";
  score: number;
  breached: boolean;
  suggestions: string[];
}

export interface FileAnalysis {
  status: "safe" | "infected";
  fileName: string;
  fileSize: string;
  reasons: { label: string; value: string; flagged: boolean }[];
  score: number;
  threats: string[];
}

function addToHistory(item: any, analysisResult?: any) {
  // Mock implementation - store in localStorage
  try {
    const history = JSON.parse(localStorage.getItem("scan_history") || "[]");
    history.push({
      id: Math.random().toString(),
      ...item,
      timestamp: new Date().toISOString(),
      analysisResult: analysisResult || null,
    });
    localStorage.setItem("scan_history", JSON.stringify(history));
  } catch (err) {
    console.error("Failed to save scan to history:", err);
  }
}

export function analyzeUrl(url: string): UrlAnalysis {
  const reasons: UrlAnalysis["reasons"] = [];
  let riskPoints = 0; // Track risk points for more nuanced scoring

  // 1. URL Length Analysis
  const urlLength = url.length;
  let lengthFlagged = false;
  let lengthValue = `${urlLength} characters`;
  if (urlLength > 100) {
    riskPoints += 20;
    lengthFlagged = true;
    lengthValue += " (very long - HIGH RISK)";
  } else if (urlLength > 75) {
    riskPoints += 10;
    lengthFlagged = true;
    lengthValue += " (long - suspicious)";
  } else {
    lengthValue += " (normal)";
  }
  reasons.push({
    label: "URL Length",
    value: lengthValue,
    flagged: lengthFlagged,
  });

  // 2. Suspicious Keywords Detection
  const suspiciousKeywords = [
    "login",
    "verify",
    "confirm",
    "update",
    "secure",
    "account",
    "urgent",
    "click-here",
    "free",
    "prize",
    "claim",
    "reset",
    "validate",
    "check",
    "action",
  ];
  const foundKeywords = suspiciousKeywords.filter((k) =>
    url.toLowerCase().includes(k),
  );
  const keywordValue =
    foundKeywords.length > 0 ? foundKeywords.join(", ") : "None found";
  const keywordFlagged = foundKeywords.length > 0;
  if (keywordFlagged) {
    riskPoints += foundKeywords.length * 8;
  }
  reasons.push({
    label: "Suspicious Keywords",
    value: keywordValue,
    flagged: keywordFlagged,
  });

  // 3. Special Characters Analysis
  const hasAt = url.includes("@");
  const dashCount = (url.match(/-/g) || []).length;
  const dotCount = (url.match(/\./g) || []).length;
  const specialCharsWarning: string[] = [];

  if (hasAt) {
    riskPoints += 25;
    specialCharsWarning.push("@ symbol");
  }
  if (dashCount > 3) {
    riskPoints += 15;
    specialCharsWarning.push("multiple dashes");
  }
  if (dotCount > 3) {
    riskPoints += 10;
    specialCharsWarning.push("multiple dots");
  }

  const specialValue =
    specialCharsWarning.length > 0
      ? specialCharsWarning.join(", ")
      : "Normal characters";
  const specialFlagged = specialCharsWarning.length > 0;
  reasons.push({
    label: "Special Characters",
    value: specialValue,
    flagged: specialFlagged,
  });

  // 4. HTTPS/SSL Protocol Check
  const hasHttps = url.startsWith("https://");
  if (!hasHttps) {
    riskPoints += 15;
  }
  const protocolValue = hasHttps
    ? "HTTPS (SSL secure)"
    : "HTTP (no encryption)";
  reasons.push({
    label: "Protocol (HTTPS)",
    value: protocolValue,
    flagged: !hasHttps,
  });

  // Calculate final risk score (0-100, where 0 is safest)
  // Risk points start at 0 (safe), cap at 100 (dangerous)
  let score = Math.min(100, riskPoints);

  // Boost score slightly if no issues were found
  if (riskPoints === 0) {
    score = 15; // Slight baseline for additional scrutiny
  }

  // Determine status based on risk points
  const isPhishing = riskPoints >= 35;
  const status: ScanStatus = isPhishing ? "phishing" : "safe";
  const result = { status, url, reasons, score };
  addToHistory({ type: "url", target: url, status }, result);

  return result;
}

export function checkEmailBreach(email: string): BreachResult {
  const breached =
    email.includes("test") || email.includes("admin") || email.includes("old");
  const result: BreachResult = breached
    ? {
        breached: true,
        count: Math.floor(Math.random() * 5) + 1,
        sources: ["LinkedIn (2021)", "Adobe (2019)", "Dropbox (2016)"].slice(
          0,
          Math.floor(Math.random() * 3) + 1,
        ),
      }
    : { breached: false, count: 0, sources: [] };

  addToHistory(
    { type: "email", target: email, status: breached ? "breached" : "safe" },
    result,
  );
  return result;
}

// Common passwords found in known data breaches
const KNOWN_BREACHED_PASSWORDS = [
  "password",
  "123456",
  "12345678",
  "qwerty",
  "abc123",
  "monkey",
  "1234567",
  "letmein",
  "trustno1",
  "dragon",
  "baseball",
  "111111",
  "iloveyou",
  "master",
  "sunshine",
  "ashley",
  "bailey",
  "shadow",
  "123123",
  "654321",
  "superman",
  "qazwsx",
  "michael",
  "football",
  "admin123",
  "password123",
  "123456789",
  "password1",
  "admin",
  "login",
  "welcome",
];

// Common password patterns found in breaches
const BREACH_PATTERNS = [
  /^(password|pass|pwd).*/i,
  /^(admin|administrator).*/i,
  /^(login|signin).*/i,
  /^123456.*$/,
  /^qwerty.*/i,
  /^(letmein|letmein123).*/i,
];

export function checkPasswordBreach(password: string): {
  breached: boolean;
  count: number;
} {
  // Check against known breached passwords
  const isExactMatch = KNOWN_BREACHED_PASSWORDS.some(
    (p) => p.toLowerCase() === password.toLowerCase(),
  );

  // Check against common breach patterns
  const matchesPattern = BREACH_PATTERNS.some((pattern) =>
    pattern.test(password),
  );

  const breached = isExactMatch || matchesPattern;

  // Simulate breach count for demonstration
  const breachCount = breached ? Math.floor(Math.random() * 50) + 5 : 0;

  return { breached, count: breachCount };
}

export function analyzePassword(password: string): PasswordResult {
  let score = 0;
  const suggestions: string[] = [];

  // Strength analysis
  if (password.length >= 8) score += 20;
  else suggestions.push("Use at least 8 characters");
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20;
  else suggestions.push("Add uppercase letters");
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 20;
  else suggestions.push("Add numbers");
  if (/[^A-Za-z0-9]/.test(password)) score += 20;
  else suggestions.push("Add special characters");

  // Check for breach
  const breachData = checkPasswordBreach(password);
  const breached = breachData.breached;

  if (breached) {
    score = Math.min(score, 20);
    suggestions.unshift(
      "This password appears in known data breaches and should never be used",
    );
  }

  const strength: PasswordResult["strength"] =
    score >= 70 ? "strong" : score >= 40 ? "medium" : "weak";
  const result = { strength, score, breached, suggestions };

  addToHistory(
    {
      type: "password",
      target: "••••••••",
      status: breached ? "breached" : strength,
    },
    result,
  );
  return result;
}

export function scanFile(fileName: string): FileAnalysis {
  const reasons: FileAnalysis["reasons"] = [];
  const threats: string[] = [];
  let riskPoints = 0;

  // 1. File Extension Analysis
  const extension = fileName.split(".").pop()?.toLowerCase() || "";
  const dangerousExtensions = [
    "exe",
    "bat",
    "scr",
    "com",
    "pif",
    "vbs",
    "js",
    "jar",
  ];
  const suspiciousExtensions = ["zip", "rar", "7z", "iso"];
  const safeExtensions = [
    "pdf",
    "txt",
    "doc",
    "docx",
    "xls",
    "xlsx",
    "jpg",
    "png",
    "gif",
  ];

  let extensionValue = "";
  let extensionFlagged = false;

  if (dangerousExtensions.includes(extension)) {
    riskPoints += 40;
    extensionFlagged = true;
    extensionValue = `${extension.toUpperCase()} (EXECUTABLE - CRITICAL RISK)`;
    threats.push("Executable file detected");
  } else if (suspiciousExtensions.includes(extension)) {
    riskPoints += 20;
    extensionFlagged = true;
    extensionValue = `${extension.toUpperCase()} (archive - suspicious)`;
    threats.push("Archive file detected");
  } else if (safeExtensions.includes(extension)) {
    extensionValue = `${extension.toUpperCase()} (safe format)`;
  } else {
    riskPoints += 10;
    extensionFlagged = true;
    extensionValue = `${extension.toUpperCase()} (unknown format)`;
  }

  reasons.push({
    label: "File Extension",
    value: extensionValue,
    flagged: extensionFlagged,
  });

  // 2. File Name Analysis
  let fileNameValue = `${fileName} (${fileName.length} chars)`;
  let fileNameFlagged = false;

  const suspiciousPatterns =
    /invoice|payment|update|confirm|verify|urgent|click|secure|login|password|admin/i;
  if (suspiciousPatterns.test(fileName) && extensionFlagged) {
    riskPoints += 15;
    fileNameFlagged = true;
    fileNameValue += " - contains suspicious patterns";
    threats.push("Suspicious file naming detected");
  } else if (suspiciousPatterns.test(fileName)) {
    riskPoints += 5;
    fileNameFlagged = true;
    fileNameValue += " - unusual naming";
  } else {
    fileNameValue += " (normal)";
  }

  reasons.push({
    label: "File Name",
    value: fileNameValue,
    flagged: fileNameFlagged,
  });

  // 3. Simulated Signature Detection
  const hasKnownSignature =
    fileName.toLowerCase().includes("malware") ||
    fileName.toLowerCase().includes("virus") ||
    fileName.toLowerCase().includes("trojan");

  let signatureValue = "No known malware signatures";
  let signatureFlagged = false;

  if (hasKnownSignature) {
    riskPoints += 50;
    signatureFlagged = true;
    signatureValue = "MALWARE SIGNATURE DETECTED";
    threats.push("Known malware signature matched");
  }

  reasons.push({
    label: "Malware Signature",
    value: signatureValue,
    flagged: signatureFlagged,
  });

  // 4. Heuristic Analysis
  let heuristicValue = "No suspicious behavior patterns";
  let heuristicFlagged = false;

  if (extensionFlagged && fileNameFlagged) {
    riskPoints += 15;
    heuristicFlagged = true;
    heuristicValue = "Multiple risk factors detected";
    threats.push("Heuristic threat detected");
  }

  reasons.push({
    label: "Heuristic Analysis",
    value: heuristicValue,
    flagged: heuristicFlagged,
  });

  // Calculate final risk score
  let score = Math.min(100, riskPoints);
  if (riskPoints === 0) {
    score = 10; // Baseline safe score
  }

  const isInfected = riskPoints >= 35;
  const status: "safe" | "infected" = isInfected ? "infected" : "safe";

  // Generate file size (simulated)
  const fileSizeKB = Math.floor(Math.random() * 50000) + 100;
  const fileSize =
    fileSizeKB > 1024
      ? `${(fileSizeKB / 1024).toFixed(2)} MB`
      : `${fileSizeKB} KB`;

  const result: FileAnalysis = {
    status,
    fileName,
    fileSize,
    reasons,
    score,
    threats,
  };
  addToHistory(
    {
      type: "file",
      target: fileName,
      status: status === "infected" ? "phishing" : "safe",
    },
    result,
  );

  return result;
}

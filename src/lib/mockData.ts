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

// Simulated scan history store
let scanHistory: ScanHistoryItem[] = [
  { id: "1", type: "url", target: "https://google.com", status: "safe", timestamp: new Date(Date.now() - 3600000) },
  { id: "2", type: "url", target: "http://free-login-verify.com", status: "phishing", timestamp: new Date(Date.now() - 7200000) },
  { id: "3", type: "email", target: "user@example.com", status: "safe", timestamp: new Date(Date.now() - 10800000) },
  { id: "4", type: "file", target: "report.pdf", status: "safe", timestamp: new Date(Date.now() - 14400000) },
];

let stats = { totalScans: 47, threats: 8, safe: 39 };

export function getStats() {
  return { ...stats };
}

export function getHistory(): ScanHistoryItem[] {
  return [...scanHistory];
}

function addToHistory(item: Omit<ScanHistoryItem, "id" | "timestamp">) {
  const entry: ScanHistoryItem = {
    ...item,
    id: crypto.randomUUID(),
    timestamp: new Date(),
  };
  scanHistory = [entry, ...scanHistory].slice(0, 20);
  stats.totalScans++;
  if (item.status === "phishing" || item.status === "breached") stats.threats++;
  else stats.safe++;
}

export function analyzeUrl(url: string): UrlAnalysis {
  const reasons: UrlAnalysis["reasons"] = [];

  const longUrl = url.length > 75;
  reasons.push({ label: "URL Length", value: `${url.length} characters${longUrl ? " (suspicious)" : ""}`, flagged: longUrl });

  const keywords = ["free", "login", "verify", "update", "secure", "account", "confirm", "click", "urgent", "prize"];
  const foundKeywords = keywords.filter((k) => url.toLowerCase().includes(k));
  reasons.push({ label: "Suspicious Keywords", value: foundKeywords.length ? foundKeywords.join(", ") : "None found", flagged: foundKeywords.length > 0 });

  const hasAt = url.includes("@");
  const hasManyDashes = (url.match(/-/g) || []).length > 3;
  const specialChars = hasAt || hasManyDashes;
  reasons.push({ label: "Special Characters", value: `${hasAt ? "@ symbol " : ""}${hasManyDashes ? "Multiple dashes" : ""}${!specialChars ? "Normal" : ""}`.trim(), flagged: specialChars });

  const hasHttps = url.startsWith("https://");
  reasons.push({ label: "Protocol", value: hasHttps ? "HTTPS (secure)" : "HTTP (insecure)", flagged: !hasHttps });

  const flagCount = reasons.filter((r) => r.flagged).length;
  const isPhishing = flagCount >= 2;
  const score = Math.max(0, 100 - flagCount * 25);

  const status: ScanStatus = isPhishing ? "phishing" : "safe";
  addToHistory({ type: "url", target: url, status });

  return { status, url, reasons, score };
}

export function checkEmailBreach(email: string): BreachResult {
  const breached = email.includes("test") || email.includes("admin") || email.includes("old");
  const result: BreachResult = breached
    ? { breached: true, count: Math.floor(Math.random() * 5) + 1, sources: ["LinkedIn (2021)", "Adobe (2019)", "Dropbox (2016)"].slice(0, Math.floor(Math.random() * 3) + 1) }
    : { breached: false, count: 0, sources: [] };

  addToHistory({ type: "email", target: email, status: breached ? "breached" : "safe" });
  return result;
}

export function analyzePassword(password: string): PasswordResult {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score += 20; else suggestions.push("Use at least 8 characters");
  if (password.length >= 12) score += 10;
  if (/[A-Z]/.test(password)) score += 20; else suggestions.push("Add uppercase letters");
  if (/[a-z]/.test(password)) score += 10;
  if (/[0-9]/.test(password)) score += 20; else suggestions.push("Add numbers");
  if (/[^A-Za-z0-9]/.test(password)) score += 20; else suggestions.push("Add special characters");

  const commonPasswords = ["password", "123456", "qwerty", "admin", "letmein"];
  const breached = commonPasswords.some((p) => password.toLowerCase().includes(p));
  if (breached) { score = Math.min(score, 20); suggestions.push("This password appears in known breaches"); }

  const strength: PasswordResult["strength"] = score >= 70 ? "strong" : score >= 40 ? "medium" : "weak";

  addToHistory({ type: "password", target: "••••••••", status: strength });
  return { strength, score, breached, suggestions };
}

export function scanFile(fileName: string): string {
  const suspicious = fileName.endsWith(".exe") || fileName.endsWith(".bat") || fileName.endsWith(".scr");
  const status = suspicious ? "phishing" : "safe";
  addToHistory({ type: "file", target: fileName, status });
  return suspicious ? "Suspicious file detected" : "No threats detected";
}

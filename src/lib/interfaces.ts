export type ScanStatus = "safe" | "phishing";

export interface ScanReason {
    label: string;
    value: string;
    flagged: boolean;
}

export interface FileAnalysis {
    fileName: string;
    fileSize: string;
    status: "safe" | "infected" | "suspicious";
    score: number;
    threats: string[];
    reasons: ScanReason[];
}
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
export interface RiskReportData {
  scanType: "url" | "email" | "file" | "password";
  result: {
    status: "safe" | "suspicious" | "dangerous";
    score?: number;
    details: string;
    threats?: string[];
  };
  userName?: string;
  timestamp?: Date;
}
export interface PDFReportData {
  scanType: "url" | "file" | "password" | "email";
  target: string;
  result: UrlAnalysis | FileAnalysis | PasswordResult | BreachResult;
  userName?: string;
}

// Shared types for the application

export type ScanStatus = "safe" | "phishing" | "suspicious" | "low" | "moderate" | "high" | "dangerous" | "breached" | "weak" | "strong" | string;

export interface ScanReason {
  label: string;
  value: string;
  flagged: boolean;
}

export interface VTAnalysisStats {
  malicious: number;
  suspicious: number;
  harmless: number;
  undetected: number;
  total: number;
  timeout: number;
  malicious_engines?: string[];
}

export interface VTVendorResult {
  engine_name: string;
  category: string;
  result: string | null;
}

export interface FileAnalysis {
  fileName: string;
  fileSize: string;
  status: ScanStatus;
  score: number;
  threats: string[];
  reasons: ScanReason[];
  vtStats?: {
    malicious: number;
    suspicious: number;
    harmless: number;
    undetected: number;
  };
  sha256?: string;
  flags?: {
    malwareDetected?: boolean;
    phishingDetected?: boolean;
    blacklisted?: boolean;
    suspicious?: boolean;
  };
  modelAnalysis?: {
    prediction: string;
    confidence: number;
  };
}

export interface UrlAnalysis {
  url: string;
  status: ScanStatus;
  score: number; // 0–100 combined score
  reasons: ScanReason[];
  vtStats: VTAnalysisStats | null; // null for quick scans (no API call)
  vtVendors: Record<string, VTVendorResult>;
  analysisId: string;
  mode: "quick" | "deep";
  flags?: {
    phishingDetected?: boolean;
    malwareDetected?: boolean;
    blacklisted?: boolean;
    suspicious?: boolean;
  };
  source?: string; // "AI_MODEL" | "AI_MODEL + API"
  apiUnavailable?: boolean; // true when deep scan but API failed
  maliciousEngines?: string[]; // list of engines (deep scan only)
  modelAnalysis?: {
    prediction: string;
    confidence: number;
    features?: Record<string, boolean>;
    explanations?: { word: string; score: number }[];
  };
}

export interface ScanHistoryItem {
  id: string;
  type: "url" | "file" | "email" | "password";
  target: string;
  status: ScanStatus;
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
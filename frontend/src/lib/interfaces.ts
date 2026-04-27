//export type ScanStatus = "safe" | "phishing" | "safe"| "suspicious" | "dangerous" ;
    //status: "safe" | "suspicious" | "dangerous";

// 
export interface ScanReason {
    label: string;
    value: string;
    flagged: boolean;
}

// export interface FileAnalysis {
//     fileName: string;
//     fileSize: string;
//     status: "safe" | "infected" | "suspicious";
//     score: number;
//     threats: string[];
//     reasons: ScanReason[];
// }
export interface FileAnalysis {
    fileName: string;
    fileSize: string;
    status: "safe" | "low" | "moderate" | "high" | "dangerous" | string;
    score: number;
    threats: string[];
    reasons: ScanReason[];
    // Add these to match the URL scanner's level of detail
    vtStats?: {
        malicious: number;
        suspicious: number;
        harmless: number;
        undetected: number;
    };
    sha256?: string;
    flags?: {                               // critical flags for unified decision logic
      malwareDetected?: boolean;
      phishingDetected?: boolean;
      blacklisted?: boolean;
      suspicious?: boolean;
    };
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

// upadte after the change
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

export type ScanStatus = "safe" | "phishing" | "suspicious";

export interface UrlAnalysis {
  url: string;
  status: ScanStatus;
  score: number;                              // 0–100 combined score
  reasons: { label: string; value: string; flagged: boolean }[];
  vtStats: VTAnalysisStats | null;            // null for quick scans (no API call)
  vtVendors: Record<string, VTVendorResult>;
  analysisId: string;
  mode: "quick" | "deep";
  flags?: {                                   // critical flags for unified decision logic
    phishingDetected?: boolean;
    malwareDetected?: boolean;
    blacklisted?: boolean;
    suspicious?: boolean;
  };
  // Extended fields (populated by backend response)
  source?: string;                            // "AI_MODEL" | "AI_MODEL + API"
  apiUnavailable?: boolean;                   // true when deep scan but API failed
  maliciousEngines?: string[];                // list of engines (deep scan only)
}
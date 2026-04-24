"use client";

import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  Shield,
  Clock,
  Target,
  AlertOctagon,
  Lightbulb,
  Zap,
  Eye,
  Activity,
} from "lucide-react";
import {
  calculateFinalVerdict,
  calculateAdjustedScore,
  getVerdictDescription,
  getVerdictTitle,
  type RiskFlags,
  type FinalVerdict,
} from "@/lib/riskDecisionLogic";

export interface RiskAnalysisData {
  scanType: "url" | "email" | "file" | "password";
  status: "safe" | "suspicious" | "dangerous";
  score: number;
  details: string;
  threats?: string[];
  timestamp?: string;
  userName?: string;
  targetItem?: string;
  analysisItems?: string[];
  // Critical flags for final decision
  flags?: RiskFlags;
}

const sanitizeString = (value: unknown): string => {
  if (typeof value !== "string") return String(value || "").trim();
  return value.trim().replace(/[^\x20-\x7E\n\r\t]/g, "").substring(0, 500);
};

const validateData = (data: RiskAnalysisData): RiskAnalysisData => {
  if (!data) throw new Error("Report data is required");
  return {
    scanType:      data.scanType || "url",
    status:        data.status || "safe",
    score:         typeof data.score === "number" ? Math.min(100, Math.max(0, data.score)) : 0,
    details:       sanitizeString(data.details) || "No details available",
    threats:       Array.isArray(data.threats) ? data.threats.map(sanitizeString).filter(Boolean) : [],
    timestamp:     typeof data.timestamp === "string" ? data.timestamp : undefined,
    userName:      sanitizeString(data.userName) || "Guest User",
    targetItem:    sanitizeString(data.targetItem) || "Not specified",
    analysisItems: Array.isArray(data.analysisItems) ? data.analysisItems.map(sanitizeString).filter(Boolean) : [],
    flags:         data.flags || {},
  };
};

// Updated: Uses unified decision logic with critical flags
// Ensures only ONE verdict is shown consistently
const getRiskInfo = (score: number, flags?: RiskFlags) => {
  // Calculate final verdict using unified logic
  const verdict = calculateFinalVerdict(score, flags || {});
  const adjustedScore = calculateAdjustedScore(score, flags || {});

  const verdictConfig = {
    safe: {
      level:       "SAFE",
      textColor:   "text-emerald-400",
      dotColor:    "bg-emerald-500",
      barColor:    "bg-gradient-to-r from-emerald-500 to-emerald-400",
      badgeBg:     "bg-gradient-to-r from-emerald-500 to-emerald-600",
      cardBorder:  "border-emerald-500/50",
      cardBg:      "from-emerald-950/60 to-emerald-900/30",
      icon:        CheckCircle,
    },
    warning: {
      level:       "WARNING",
      textColor:   "text-amber-400",
      dotColor:    "bg-amber-500",
      barColor:    "bg-gradient-to-r from-amber-500 to-amber-400",
      badgeBg:     "bg-gradient-to-r from-amber-500 to-amber-600",
      cardBorder:  "border-amber-500/50",
      cardBg:      "from-amber-950/60 to-amber-900/30",
      icon:        AlertTriangle,
    },
    dangerous: {
      level:       "DANGEROUS",
      textColor:   "text-red-400",
      dotColor:    "bg-red-500",
      barColor:    "bg-gradient-to-r from-red-500 to-red-400",
      badgeBg:     "bg-gradient-to-r from-red-500 to-red-600",
      cardBorder:  "border-red-500/50",
      cardBg:      "from-red-950/60 to-red-900/30",
      icon:        AlertCircle,
    },
  };

  const config = verdictConfig[verdict];
  return {
    verdict,
    adjustedScore,
    ...config,
    description: getVerdictDescription(verdict),
  };
};

const scanTypeLabels: Record<string, string> = {
  url:      "URL Phishing Detection",
  email:    "Email Breach Check",
  file:     "File Malware Analysis",
  password: "Password Strength Analysis",
};

const RiskAnalysisReport = ({ data: rawData }: { data: RiskAnalysisData }) => {
  let data: RiskAnalysisData;

  try {
    data = validateData(rawData);
  } catch {
    return (
      <div className="w-full p-6 rounded-2xl border-2 border-red-900/50 bg-red-950/30">
        <p className="text-red-400 font-semibold">Error Loading Report</p>
        <p className="text-red-300 text-sm mt-2">The scan report could not be displayed due to a data validation error.</p>
      </div>
    );
  }

  const riskInfo  = getRiskInfo(data.score, data.flags);
  const RiskIcon  = riskInfo.icon;
  const formatTime = (date?: string) => date ? new Date(date).toLocaleString() : new Date().toLocaleString();

  // Use unified decision logic for consistent verdict
  const verdictText = riskInfo.description;

  return (
    <div className="w-full space-y-6 animate-fade-in">
      <div
        className="rounded-2xl border border-slate-700 p-8 space-y-8 shadow-2xl"
        style={{ backgroundColor: "#0f172a" }}
      >
        {/* ── Header ── */}
        <div className="space-y-4 pb-6 border-b border-slate-700">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h2 className="text-4xl font-bold text-white flex items-center gap-3">
                Risk Analysis Report
                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 font-medium">
                  ✔ Verified by APGS
                </span>
              </h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Powered by Advanced Threat Analysis Engine
              </p>
            </div>
            <div className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg text-white ${riskInfo.badgeBg}`}>
              <RiskIcon className="w-5 h-5" />
              {riskInfo.level}
            </div>
          </div>
          <p className="text-slate-300 text-base font-medium">{riskInfo.description}</p>
        </div>

        {/* ── Scan Info + Risk Summary ── */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scan Details */}
          <div className="rounded-xl p-6 border border-slate-700 space-y-4 shadow-lg" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Scan Information
            </h3>
            <div className="space-y-4">
              {[
                { label: "Scan Type",       value: scanTypeLabels[data.scanType] },
                { label: "Target",          value: data.targetItem || "Not specified" },
                { label: "Scanned By",      value: "APGS Security Engine" },
              ].map(({ label, value }) => (
                <div key={label} className="pb-3 border-b border-slate-600">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">{label}</p>
                  <p className="text-white font-medium mt-1 text-sm break-all">{value}</p>
                </div>
              ))}
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide flex items-center gap-1">
                  <Clock className="w-3 h-3" /> Scan Date &amp; Time
                </p>
                <p className="text-white font-medium text-sm mt-1">{formatTime(data.timestamp)}</p>
              </div>
            </div>
          </div>

          {/* Risk Summary */}
          <div className="rounded-xl p-6 border border-slate-700 space-y-4 shadow-lg" style={{ backgroundColor: "#1e293b" }}>
            <h3 className="font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Risk Summary
            </h3>
            <div className="space-y-5">
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Risk Score</p>
                  <span className={`text-3xl font-bold ${riskInfo.textColor}`}>{riskInfo.adjustedScore}</span>
                </div>
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
                  <div
                    className={`h-full transition-all duration-700 ease-out shadow-lg ${riskInfo.barColor}`}
                    style={{ width: `${riskInfo.adjustedScore}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>0 — Safe</span>
                  <span>50</span>
                  <span>100 — Danger</span>
                </div>
              </div>

              <div className="pt-2">
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-3">Status</p>
                <div className="flex items-center gap-3">
                  <div className={`w-4 h-4 rounded-full shadow-lg ${riskInfo.dotColor}`} />
                  <span className={`font-semibold text-lg ${riskInfo.textColor}`}>
                    {riskInfo.verdict === "safe" ? "✓ Safe" : riskInfo.verdict === "warning" ? "⚠ Warning" : "✕ Dangerous"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Analysis Details ── */}
        <div className="rounded-xl p-6 border border-slate-700 space-y-5 shadow-lg" style={{ backgroundColor: "#1e293b" }}>
          <h3 className="font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Analysis Details
          </h3>

          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600/50">
            <p className="text-sm text-slate-300 leading-relaxed">{data.details}</p>
          </div>

          {data.analysisItems && data.analysisItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Analysis Items</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.analysisItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-600/50 hover:border-slate-500/70 transition-colors">
                    <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.threats && data.threats.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-600">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">
                Flagged by {data.threats.length} Vendor(s)
              </p>
              <div className="space-y-2">
                {data.threats.map((threat, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-red-950/30 border border-red-800/50 hover:border-red-700/70 transition-colors">
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                    <span className="text-sm text-red-200">{threat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* ── Score Reference Cards ── */}
        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          {[
            { label: "Safe",      range: "0 – 30",   dot: "bg-emerald-500", border: "border-emerald-900/50", bg: "from-emerald-950/40 to-emerald-900/20", text: "emerald", desc: "Appears legitimate and secure. Safe to interact with." },
            { label: "Warning",   range: "31 – 70",  dot: "bg-amber-500",   border: "border-amber-900/50",   bg: "from-amber-950/40 to-amber-900/20",   text: "amber",   desc: "Suspicious characteristics detected. Review before proceeding." },
            { label: "Dangerous", range: "71 – 100", dot: "bg-red-500",     border: "border-red-900/50",     bg: "from-red-950/40 to-red-900/20",       text: "red",     desc: "Critical security threat. Avoid interaction." },
          ].map(({ label, range, dot, border, bg, text, desc }) => (
            <div key={label} className={`rounded-xl p-5 space-y-3 border ${border} bg-gradient-to-br ${bg} transition-colors shadow-lg`}>
              <div className="flex items-center gap-2">
                <div className={`w-4 h-4 ${dot} rounded-full shadow-lg`} />
                <p className={`font-semibold text-${text}-300 text-sm uppercase tracking-wide`}>{label}</p>
              </div>
              <div className="space-y-1">
                <p className={`text-xs text-${text}-200/80`}>Score Range</p>
                <p className={`text-lg font-bold text-${text}-400`}>{range}</p>
              </div>
              <p className={`text-xs text-${text}-200/70 leading-relaxed`}>{desc}</p>
            </div>
          ))}
        </div>

        {/* ── Final Verdict ── */}
        <div className={`rounded-xl p-7 space-y-4 border-2 shadow-lg bg-gradient-to-r ${riskInfo.cardBorder} ${riskInfo.cardBg}`}>
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Final Verdict</p>
          <div className="flex items-start gap-4">
            <RiskIcon className={`w-8 h-8 mt-1 shrink-0 ${riskInfo.textColor}`} />
            <div className="space-y-3 flex-1">
              <p className={`text-2xl font-bold ${riskInfo.textColor}`}>
                {getVerdictTitle(riskInfo.verdict)}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">{verdictText}</p>
            </div>
          </div>
        </div>

        {/* ── Recommendations ── */}
        <div className="rounded-xl p-6 border border-slate-700 space-y-4 shadow-lg" style={{ backgroundColor: "#1e293b" }}>
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            Recommended Actions
          </p>
          <ul className="space-y-3 text-sm text-slate-200">
            {riskInfo.verdict === "safe" && (
              <>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>URL verified as safe. Proceed with confidence.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Continue monitoring — threat status can change over time.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Always use HTTPS and keep your browser updated.</span>
                </li>
              </>
            )}
            {riskInfo.verdict === "warning" && (
              <>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Review the flagged vendors in the analysis section above.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Verify the source and legitimacy through independent means.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Do not enter personal credentials or sensitive information.</span>
                </li>
              </>
            )}
            {riskInfo.verdict === "dangerous" && (
              <>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Do not visit or interact with this URL. Multiple vendors flagged it as malicious.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Report this URL to your security team or email provider immediately.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>If already visited, run a full device scan and change compromised credentials.</span>
                </li>
              </>
            )}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisReport;

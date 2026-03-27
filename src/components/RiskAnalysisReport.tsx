import {
  AlertTriangle,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Shield,
  Clock,
  Target,
  AlertOctagon,
  Lightbulb,
  Zap,
  Eye,
  Activity,
} from "lucide-react";

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
}

// Sanitize string values to ensure no corrupted text
const sanitizeString = (value: unknown): string => {
  if (typeof value !== "string") {
    return String(value || "").trim();
  }
  // Remove any potentially problematic characters
  return value
    .trim()
    .replace(/[^\x20-\x7E\n\r\t]/g, "") // Keep only printable ASCII and whitespace
    .substring(0, 500); // Cap length to prevent overflow
};

// Validate and sanitize the entire data object
const validateData = (data: RiskAnalysisData): RiskAnalysisData => {
  if (!data) {
    throw new Error("Report data is required");
  }

  return {
    scanType: data.scanType || "url",
    status: data.status || "safe",
    score: typeof data.score === "number" ? Math.min(100, Math.max(0, data.score)) : 50,
    details: sanitizeString(data.details) || "No details available",
    threats: Array.isArray(data.threats)
      ? data.threats.map((t) => sanitizeString(t)).filter(Boolean)
      : [],
    timestamp: typeof data.timestamp === "string" ? data.timestamp : undefined,
    userName: sanitizeString(data.userName) || "Guest User",
    targetItem: sanitizeString(data.targetItem) || "Not specified",
    analysisItems: Array.isArray(data.analysisItems)
      ? data.analysisItems.map((item) => sanitizeString(item)).filter(Boolean)
      : [],
  };
};

const RiskAnalysisReport = ({ data: rawData }: { data: RiskAnalysisData }) => {
  let data: RiskAnalysisData;

  try {
    data = validateData(rawData);
  } catch (error) {
    // Fallback rendering if data is invalid
    return (
      <div className="w-full p-6 rounded-2xl border-2 border-red-900/50 bg-red-950/30" style={{ backgroundColor: "#0f172a" }}>
        <p className="text-red-400 font-semibold">Error Loading Report</p>
        <p className="text-red-300 text-sm mt-2">The scan report could not be displayed due to data validation error.</p>
      </div>
    );
  }

  // Determine risk level and colors based on score
  const getRiskInfo = (score: number) => {
    if (score <= 30)
      return {
        level: "SAFE",
        color: "emerald",
        bgColor: "bg-emerald-50",
        borderColor: "border-emerald-200",
        textColor: "text-emerald-400",
        badgeColor: "bg-emerald-100 text-emerald-700",
        icon: CheckCircle,
        description: "This item appears safe and legitimate",
      };
    if (score <= 70)
      return {
        level: "WARNING",
        color: "amber",
        bgColor: "bg-amber-50",
        borderColor: "border-amber-200",
        textColor: "text-amber-400",
        badgeColor: "bg-amber-100 text-amber-700",
        icon: AlertTriangle,
        description: "This item shows suspicious characteristics that need review",
      };
    return {
      level: "DANGEROUS",
      color: "red",
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      textColor: "text-red-400",
      badgeColor: "bg-red-100 text-red-700",
      icon: AlertCircle,
      description: "This item has critical security threats",
    };
  };

  const riskInfo = getRiskInfo(data.score);
  const RiskIcon = riskInfo.icon;

  // Format timestamp
  const formatTime = (date?: string) => {
    if (!date) return new Date().toLocaleString();
    return new Date(date).toLocaleString();
  };

  // Scan type display names
  const scanTypeLabels = {
    url: "URL Phishing Detection",
    email: "Email Breach Check",
    file: "File Malware Analysis",
    password: "Password Strength Analysis",
  };

  return (
    <div className="w-full space-y-6 animate-fade-in">
      {/* Main Report Container with Modern Dark Theme */}
      <div className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-8 space-y-8 shadow-2xl" style={{ backgroundColor: "#0f172a" }}>
        
        {/* Header Section */}
        <div className="space-y-4 pb-6 border-b border-slate-700">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="space-y-1">
              <h2 className="text-4xl font-bold text-white">Risk Analysis Report</h2>
              <p className="text-slate-400 text-sm flex items-center gap-2">
                <Activity className="w-4 h-4" />
                Security assessment completed
              </p>
            </div>
            <div
              className={`px-5 py-3 rounded-full font-semibold text-sm flex items-center gap-2 shadow-lg ${
                data.score <= 30
                  ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                  : data.score <= 70
                  ? "bg-gradient-to-r from-amber-500 to-amber-600 text-white"
                  : "bg-gradient-to-r from-red-500 to-red-600 text-white"
              }`}
            >
              <RiskIcon className="w-5 h-5" />
              {riskInfo.level}
            </div>
          </div>
          <p className="text-slate-300 text-base font-medium">{riskInfo.description}</p>
        </div>

        {/* Scan Information Section */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Scan Details */}
          <div
            className="rounded-xl p-6 border border-slate-700 space-y-4 shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: "#1e293b" }}
          >
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <Shield className="w-5 h-5 text-cyan-400" />
              Scan Information
            </h3>
            <div className="space-y-4">
              <div className="pb-3 border-b border-slate-600">
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Scan Type</p>
                <p className="text-white font-medium mt-2">{scanTypeLabels[data.scanType]}</p>
              </div>
              <div className="pb-3 border-b border-slate-600">
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Target Item</p>
                <p className="text-slate-200 font-medium truncate text-sm mt-2 break-all">{data.targetItem || "Not specified"}</p>
              </div>
              <div className="pb-3 border-b border-slate-600">
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Scanned By</p>
                <p className="text-white font-medium mt-2">{data.userName || "Guest User"}</p>
              </div>
              <div>
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  Scan Date & Time
                </p>
                <p className="text-white font-medium text-sm mt-2">{formatTime(data.timestamp)}</p>
              </div>
            </div>
          </div>

          {/* Risk Summary */}
          <div
            className="rounded-xl p-6 border border-slate-700 space-y-4 shadow-lg hover:shadow-xl transition-shadow"
            style={{ backgroundColor: "#1e293b" }}
          >
            <h3 className="font-heading font-semibold text-white flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              Risk Summary
            </h3>
            <div className="space-y-5">
              {/* Risk Score Display */}
              <div>
                <div className="flex justify-between items-center mb-3">
                  <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Risk Score</p>
                  <span
                    className={`text-3xl font-bold ${
                      data.score <= 30
                        ? "text-emerald-400"
                        : data.score <= 70
                        ? "text-amber-400"
                        : "text-red-400"
                    }`}
                  >
                    {data.score}
                  </span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-700 rounded-full h-3 overflow-hidden border border-slate-600">
                  <div
                    className={`h-full transition-all duration-700 ease-out shadow-lg ${
                      data.score <= 30
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400"
                        : data.score <= 70
                        ? "bg-gradient-to-r from-amber-500 to-amber-400"
                        : "bg-gradient-to-r from-red-500 to-red-400"
                    }`}
                    style={{ width: `${data.score}%` }}
                  />
                </div>
                <div className="flex justify-between text-xs text-slate-400 mt-2 font-medium">
                  <span>0</span>
                  <span>50</span>
                  <span>100</span>
                </div>
              </div>

              {/* Decision Status */}
              <div className="pt-2">
                <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide mb-3">Status</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full shadow-lg ${
                      data.score <= 30
                        ? "bg-emerald-500"
                        : data.score <= 70
                        ? "bg-amber-500"
                        : "bg-red-500"
                    }`}
                  />
                  <span className={`font-semibold text-lg ${riskInfo.textColor}`}>
                    {data.status === "safe"
                      ? "✓ Safe"
                      : data.status === "suspicious"
                      ? "⚠ Suspicious"
                      : "✕ Dangerous"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Detailed Analysis Section */}
        <div
          className="rounded-xl p-6 border border-slate-700 space-y-5 shadow-lg"
          style={{ backgroundColor: "#1e293b" }}
        >
          <h3 className="font-heading font-semibold text-white flex items-center gap-2">
            <Target className="w-5 h-5 text-purple-400" />
            Analysis Details
          </h3>

          {/* Analysis Description */}
          <div className="p-4 bg-slate-900/50 rounded-lg border border-slate-600/50">
            <p className="text-sm text-slate-300 leading-relaxed">{data.details}</p>
          </div>

          {/* Analysis Items Display */}
          {data.analysisItems && data.analysisItems.length > 0 && (
            <div className="space-y-3">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Analysis Items</p>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {data.analysisItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-3 rounded-lg bg-slate-900/30 border border-slate-600/50 hover:border-slate-500/70 transition-colors"
                  >
                    <Eye className="w-4 h-4 text-cyan-400 shrink-0" />
                    <span className="text-xs text-slate-200 font-medium">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Threats Found */}
          {data.threats && data.threats.length > 0 && (
            <div className="space-y-3 pt-2 border-t border-slate-600">
              <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Identified Issues</p>
              <div className="space-y-2">
                {data.threats.map((threat, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 rounded-lg bg-red-950/30 border border-red-800/50 hover:border-red-700/70 transition-colors"
                  >
                    <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 shrink-0 flex-shrink-0" />
                    <span className="text-sm text-red-200">{threat}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Risk Level Information */}
        <div className="grid md:grid-cols-3 gap-4 pt-4 border-t border-slate-700">
          {/* Safe Level */}
          <div className="rounded-xl p-5 space-y-3 border border-emerald-900/50 bg-gradient-to-br from-emerald-950/40 to-emerald-900/20 hover:from-emerald-950/60 hover:to-emerald-900/40 transition-colors shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-emerald-500 rounded-full shadow-lg" />
              <p className="font-semibold text-emerald-300 text-sm uppercase tracking-wide">Safe</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-emerald-200/80">Score Range</p>
              <p className="text-lg font-bold text-emerald-400">0 - 30</p>
            </div>
            <p className="text-xs text-emerald-200/70 leading-relaxed">Item appears legitimate and secure. Safe to interact with.</p>
          </div>

          {/* Warning Level */}
          <div className="rounded-xl p-5 space-y-3 border border-amber-900/50 bg-gradient-to-br from-amber-950/40 to-amber-900/20 hover:from-amber-950/60 hover:to-amber-900/40 transition-colors shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-amber-500 rounded-full shadow-lg" />
              <p className="font-semibold text-amber-300 text-sm uppercase tracking-wide">Warning</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-amber-200/80">Score Range</p>
              <p className="text-lg font-bold text-amber-400">31 - 70</p>
            </div>
            <p className="text-xs text-amber-200/70 leading-relaxed">Suspicious characteristics detected. Review before proceeding.</p>
          </div>

          {/* Dangerous Level */}
          <div className="rounded-xl p-5 space-y-3 border border-red-900/50 bg-gradient-to-br from-red-950/40 to-red-900/20 hover:from-red-950/60 hover:to-red-900/40 transition-colors shadow-lg">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded-full shadow-lg" />
              <p className="font-semibold text-red-300 text-sm uppercase tracking-wide">Dangerous</p>
            </div>
            <div className="space-y-2">
              <p className="text-xs text-red-200/80">Score Range</p>
              <p className="text-lg font-bold text-red-400">71 - 100</p>
            </div>
            <p className="text-xs text-red-200/70 leading-relaxed">Critical security threat. Avoid interaction.</p>
          </div>
        </div>

        {/* Final Verdict */}
        <div
          className={`rounded-xl p-7 space-y-4 border-2 shadow-lg ${
            data.score <= 30
              ? "border-emerald-500/50 bg-gradient-to-r from-emerald-950/60 to-emerald-900/30"
              : data.score <= 70
              ? "border-amber-500/50 bg-gradient-to-r from-amber-950/60 to-amber-900/30"
              : "border-red-500/50 bg-gradient-to-r from-red-950/60 to-red-900/30"
          }`}
        >
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide">Final Verdict</p>
          <div className="flex items-start gap-4">
            <RiskIcon
              className={`w-8 h-8 mt-1 shrink-0 ${
                data.score <= 30
                  ? "text-emerald-400"
                  : data.score <= 70
                  ? "text-amber-400"
                  : "text-red-400"
              }`}
            />
            <div className="space-y-3 flex-1">
              <p
                className={`text-2xl font-bold ${
                  data.score <= 30
                    ? "text-emerald-300"
                    : data.score <= 70
                    ? "text-amber-300"
                    : "text-red-300"
                }`}
              >
                {data.score <= 30
                  ? "✓ Green Light - Safe to Proceed"
                  : data.score <= 70
                  ? "⚠ Caution - Review Before Proceeding"
                  : "✕ Red Alert - Do Not Proceed"}
              </p>
              <p className="text-sm text-slate-300 leading-relaxed">
                {data.score <= 30
                  ? "This item has passed comprehensive security analysis and appears to be legitimate and safe to use. You can interact with it with confidence."
                  : data.score <= 70
                  ? "This item shows some suspicious characteristics that warrant review. Analyze the details above before deciding whether to proceed with caution or avoid entirely."
                  : "This item has been identified as a potential security threat with critical indicators of malicious intent. We strongly recommend avoiding any interaction with this item."}
              </p>
            </div>
          </div>
        </div>

        {/* Recommendations */}
        <div
          className="rounded-xl p-6 border border-slate-700 space-y-4 shadow-lg"
          style={{ backgroundColor: "#1e293b" }}
        >
          <p className="text-xs text-slate-400 uppercase font-semibold tracking-wide flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-cyan-400" />
            Recommended Actions
          </p>
          <ul className="space-y-3 text-sm text-slate-200">
            {data.score <= 30 && (
              <>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Item is verified as safe. Proceed with confidence.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Continue monitoring for any changes in item status.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <CheckCircle className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                  <span>Share this report with others who need security assurance.</span>
                </li>
              </>
            )}
            {data.score > 30 && data.score <= 70 && (
              <>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Review the detailed analysis section thoroughly before proceeding.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Verify the source and legitimacy through independent means.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertTriangle className="w-4 h-4 text-amber-400 mt-0.5 shrink-0" />
                  <span>Report this item if you confirm it to be malicious.</span>
                </li>
              </>
            )}
            {data.score > 70 && (
              <>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Do not interact with this item. Critical security threat detected.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>Report this item to your security team or administrator immediately.</span>
                </li>
                <li className="flex gap-3 p-2 rounded hover:bg-slate-800/30 transition-colors">
                  <AlertOctagon className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span>If already accessed, implement protective measures and review activity logs.</span>
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

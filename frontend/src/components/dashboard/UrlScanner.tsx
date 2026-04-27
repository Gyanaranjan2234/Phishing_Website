import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle, Shield, FileText, Lock, Download, AlertCircle, Check, RotateCcw, Link, Type, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import type { UrlAnalysis, ScanStatus } from "@/lib/interfaces";
import { apiScans } from "@/lib/api-backend";  // UPDATED: Use backend API instead of mock
import { saveScanResult } from "@/lib/scanHistory";
import { handleScanAttempt } from "@/lib/guestAccess";  // ADDED: Guest access control
import RiskAnalysisReport from "@/components/RiskAnalysisReport";
import { generatePDFReport, generatePDFBlob } from "@/lib/pdfReportGenerator";
import { scanUrlWithVT } from "@/lib/virustotal";
import { mapVTToUrlAnalysis } from "@/lib/mapVTResult";
import { calculateFinalVerdict, type RiskFlags } from "@/lib/riskDecisionLogic";

interface UrlScannerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

// 5-tier verdict display — driven purely by risk_score (malicious/total * 100)
const getVerdictInfo = (score: number, flags?: RiskFlags) => {
  const verdict = calculateFinalVerdict(score, flags || {});

  switch (verdict) {
    case "safe":
      return { bar: "bg-[#00ff9c]", text: "text-[#00ff9c]", bg: "bg-[#00ff9c]/10", label: "✓ Safe",          description: "Risk Score (0–100): No threats detected",            verdict };
    case "low":
      return { bar: "bg-[#ffcc00]", text: "text-[#ffcc00]", bg: "bg-[#ffcc00]/10", label: "⚠ Low Risk",      description: "Risk Score (0–100): Based on detected threats",      verdict };
    case "moderate":
      return { bar: "bg-[#ffcc00]", text: "text-[#ffcc00]", bg: "bg-[#ffcc00]/10", label: "⚠ Moderate Risk", description: "Risk Score (0–100): Based on detected threats",      verdict };
    case "high":
      return { bar: "bg-[#ff4d4d]", text: "text-[#ff4d4d]", bg: "bg-[#ff4d4d]/10", label: "✕ High Risk",     description: "Risk Score (0–100): Based on detected threats",      verdict };
    default: // dangerous
      return { bar: "bg-[#ff4d4d]", text: "text-[#ff4d4d]", bg: "bg-[#ff4d4d]/10", label: "✕ Dangerous",     description: "Risk Score (0–100): Widespread malicious detections", verdict };
  }
};

const UrlScanner = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: UrlScannerProps) => {
  const [url, setUrl] = useState(scanData.input || "");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<UrlAnalysis | null>(scanData.result || null);
  const [downloadingReport, setDownloadingReport] = useState(false);
  const [sharing, setSharing] = useState(false);
  const [scanMode, setScanMode] = useState<"quick" | "deep">("quick");

  const showToast = (message: string, type: "success" | "error" | "info" = "info") => {
    toast({
      title: message,
      variant: type === "error" ? "destructive" : "default",
    });
  };

  const handleReset = () => {
    setUrl("");
    setResult(null);
    setScanData({ input: "", result: null });
    showToast("URL scan cleared", "info");
  };

const handleAnalyze = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!url.trim()) { showToast("Enter a URL to analyze", "error"); return; }

  // GUEST ACCESS CHECK: Verify scan limit before proceeding
  const scanAccess = handleScanAttempt();
  if (!scanAccess.success) {
    showToast(scanAccess.message, "error");
    return;
  }

  if (!isAuthenticated) {
    showToast(`📝 ${scanAccess.message}`, "info");
  }

  setScanning(true);
  setResult(null);

  try {
    const userId = localStorage.getItem('user_id');

    // Required console logs
    if (scanMode === "quick") {
      console.log("MODE: QUICK → AI ONLY");
    } else {
      console.log("MODE: DEEP → AI + API");
    }

    const response = await apiScans.analyzeUrl(url, scanMode, userId ? parseInt(userId) : undefined);

    if (response.status === 'error') {
      throw new Error(response.message);
    }

    console.log("[UrlScanner] Response:", { mode: response.mode, risk: response.risk, score: response.score, source: response.source });
    const isDeep  = scanMode === "deep";
    const apiData = response.api_analysis;
    const apiOk   = isDeep && apiData && !("error" in apiData);
    const apiErr  = isDeep && (!apiData || "error" in apiData);

    // Map all 5 risk tiers to frontend status
    const riskLower = (response.risk || "").toLowerCase();
    const status: "safe" | "suspicious" | "phishing" =
      riskLower === "safe" || riskLower === "low" ? "safe" :
      riskLower === "moderate"                    ? "suspicious" :
      "phishing"; // HIGH or DANGEROUS

    const reasons = [
      { label: "Scan Result",   value: response.model_analysis.prediction.toUpperCase(), flagged: response.model_analysis.prediction === 'phishing' },
      { label: "Confidence",    value: `${Math.round(response.model_analysis.confidence * 100)}%`, flagged: false },
      { label: "Scan Mode",     value: isDeep ? "Deep Scan" : "Quick Scan", flagged: false },
      // Deep scan: show vendor count prominently
      ...(isDeep && apiOk ? [{ label: "Vendor Detection", value: `${apiData.malicious} / ${apiData.total} vendors flagged`, flagged: apiData.malicious > 0 }] : []),
      ...(isDeep && apiErr ? [{ label: "Security Vendors", value: "⚠ Analysis Data Unavailable", flagged: false }] : []),
      // Only show feature/keyword analysis in Deep Scan to keep Quick Scan clean
      ...(isDeep ? [
        ...Object.entries(response.model_analysis.features).map(([k, v]) => ({
          label: k.replace(/_/g, ' ').toUpperCase(),
          value: v ? "Detected" : "None",
          flagged: !!v && k !== 'has_https'
        })),
        ...(response.model_analysis.explanations || []).map((exp: any) => ({
          label: `Keyword: ${exp.word}`,
          value: `Impact: ${exp.score.toFixed(4)}`,
          flagged: exp.score > 0
        }))
      ] : [])
    ];

    const analysis: UrlAnalysis = {
      url: url,
      status,
      score: response.score,
      reasons,
      vtStats: apiOk ? {
        malicious:  apiData.malicious,
        suspicious: apiData.suspicious,
        harmless:   apiData.harmless,
        undetected: apiData.undetected,
        timeout:    0
      } : null,
      vtVendors: {},
      analysisId: `backend_${Date.now()}`,
      mode: response.mode as "quick" | "deep",
      flags: {
        phishingDetected: response.risk === 'HIGH' || response.risk === 'DANGEROUS',
        suspicious: response.risk === 'MODERATE'
      },
      source:           response.source || (isDeep ? "Deep Scan" : "Quick Scan"),
      apiUnavailable:   apiErr,
      maliciousEngines: apiOk ? (apiData.malicious_engines || []) : [],
    };

    setResult(analysis);
    setScanData({ input: url, result: analysis });
    onScanComplete();

    if (isAuthenticated) showToast("✅ Result saved to history", "success");

    const riskLabel = response.risk || "UNKNOWN";
    if (status === "phishing")        showToast(`⚠️ ${riskLabel} risk detected!`, "error");
    else if (status === "suspicious") showToast("⚠️ Suspicious URL detected!", "error");
    else                              showToast("✅ URL appears safe", "success");

  } catch (err) {
    console.error("[UrlScanner] Scan error:", err);
    showToast(`❌ ${err instanceof Error ? err.message : "Scan failed"}`, "error");
  } finally {
    setScanning(false);
  }
};

  const scoreInfo = result ? getVerdictInfo(result.score, result.flags) : null;

  const handleGenerateReport = async () => {
    const reportResult = result || scanData.result;
    if (!reportResult) {
      toast({
        title: "❌ No Scan Result",
        description: "Please scan a URL first",
        variant: "destructive",
      });
      return;
    }

    setDownloadingReport(true);
    try {
      const urlData = reportResult as UrlAnalysis;
      await generatePDFReport({
        scanType: "url",
        target: urlData.url,
        result: urlData,
        userName: userName,
      });
      toast({ title: "✅ Report Downloaded", description: "PDF saved to your device" });
    } catch (error) {
      console.error(error);
      toast({ title: "❌ Error", description: "Failed to generate report", variant: "destructive" });
    } finally {
      setDownloadingReport(false);
    }
  };

  const handleShare = async () => {
    const reportResult = result || scanData.result;
    if (!reportResult) {
      toast({ title: "❌ No Scan Result", description: "Please scan a URL first", variant: "destructive" });
      return;
    }

    setSharing(true);

    // Helper: download PDF as fallback
    const downloadFallback = (blob: Blob) => {
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = "APGS_Report.pdf";
      link.click();
      URL.revokeObjectURL(link.href);
      toast({ title: "⬇️ Download started", description: "Sharing not supported on this device" });
    };

    try {
      const urlData = reportResult as UrlAnalysis;

      // 1. Generate PDF Blob
      const pdfBlob = await generatePDFBlob({
        scanType: "url",
        target: urlData.url,
        result: urlData,
        userName: userName,
      });

      // 2. Convert to File
      const file = new File([pdfBlob], "APGS_Report.pdf", { type: "application/pdf" });

      // 3. Check file-share support (canShare can itself throw on some browsers)
      let canShareFiles = false;
      try {
        canShareFiles = !!(navigator.canShare && navigator.canShare({ files: [file] }));
      } catch {
        canShareFiles = false;
      }

      if (canShareFiles) {
        await navigator.share({ files: [file] });
        toast({ title: "✅ Shared Successfully" });
      } else {
        downloadFallback(pdfBlob);
      }
    } catch (err: any) {
      // User cancelled the share sheet — silent
      if (err?.name === "AbortError") return;
      // Device/browser doesn't support sharing — fallback to download
      if (err?.name === "NotAllowedError" || err?.name === "NotSupportedError" || err instanceof TypeError) {
        // pdfBlob may not exist if generation failed; re-generate for fallback
        try {
          const urlData = (result || scanData.result) as UrlAnalysis;
          const blob = await generatePDFBlob({ scanType: "url", target: urlData.url, result: urlData, userName });
          downloadFallback(blob);
        } catch {
          toast({ title: "❌ Failed to generate report", variant: "destructive" });
        }
        return;
      }
      // Genuine share failure
      toast({ title: "❌ Share Failed", description: "Could not share report", variant: "destructive" });
    } finally {
      setSharing(false);
    }
  };

  return (
    <section className="bg-card border border-border rounded-lg p-6 animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
      <h2 className="font-heading font-semibold text-foreground mb-4 flex items-center gap-2">
        <Search className="w-5 h-5 text-primary" /> URL Phishing Detector
      </h2>

      {!isAuthenticated && (
        <div className="mb-4 rounded-lg border border-border/40 bg-primary/10 p-3 text-sm text-primary">
          Login to save your scan history when signed in.
        </div>
      )}

      <form onSubmit={handleAnalyze} className="flex gap-3 flex-col sm:flex-row">
        <Input
          type="text"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className="flex-1 bg-muted border-border text-foreground placeholder:text-muted-foreground focus:shadow-[0_0_12px_hsl(150_100%_45%/0.2)]"
        />
        
        {/* Scan Mode Selector */}
        <div className="flex bg-slate-900/50 rounded-full p-1 border border-slate-700 shrink-0 self-center shadow-inner">
          <button
            type="button"
            onClick={() => setScanMode("quick")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] tracking-[0.05em] font-semibold rounded-full transition-all duration-300 ${
              scanMode === "quick" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 z-10" 
                : "text-slate-400 hover:text-slate-200 opacity-70 hover:opacity-100"
            }`}
          >
            <Zap className={`w-3.5 h-3.5 ${scanMode === "quick" ? "animate-pulse" : ""}`} />
            Quick
          </button>
          <button
            type="button"
            onClick={() => setScanMode("deep")}
            className={`flex items-center gap-1.5 px-4 py-1.5 text-[11px] tracking-[0.05em] font-semibold rounded-full transition-all duration-300 ${
              scanMode === "deep" 
                ? "bg-gradient-to-r from-emerald-500 to-teal-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.4)] scale-105 z-10" 
                : "text-slate-400 hover:text-slate-200 opacity-70 hover:opacity-100"
            }`}
          >
            <Search className="w-3.5 h-3.5" />
            Deep
          </button>
        </div>

        <div className="flex gap-2">
          <Button type="submit" disabled={scanning} className="font-heading shrink-0 hover:shadow-[0_0_16px_hsl(150_100%_45%/0.3)] transition-shadow">
            {scanning ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Scanning...</> : "Analyze URL"}
          </Button>
          {(url || result) && (
            <Button type="button" onClick={handleReset} variant="outline" disabled={scanning} className="font-heading shrink-0 border-border hover:bg-card/70 transition gap-2">
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Reset</span>
            </Button>
          )}
        </div>
      </form>

      {scanning && (
        <div className="mt-4 space-y-2 animate-fade-in-up">
          <p className="text-muted-foreground text-sm font-mono">
            {scanMode === "quick"
              ? "Quick Scan — Analyzing URL..."
              : "Deep Scan — Performing comprehensive multi-vendor analysis..."}
          </p>
          <Progress value={66} className="h-2" />
        </div>
      )}

      {result && scoreInfo && (
        <div className="mt-6 space-y-5 animate-fade-in-up">

          {/* Status Banner */}
          <div className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-all duration-500 ${
            scoreInfo.verdict === "safe"
              ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_hsl(150_100%_45%/0.2)]"
              : (scoreInfo.verdict === "low" || scoreInfo.verdict === "moderate")
              ? "bg-yellow-500/10 border-yellow-500/40 shadow-[0_0_20px_rgba(255,204,0,0.2)]"
              : "bg-destructive/10 border-destructive/40 shadow-[0_0_20px_hsl(0_72%_51%/0.2)]"
          }`}>
            {scoreInfo.verdict === "safe" ? (
              <CheckCircle className="w-6 h-6 text-primary shrink-0" />
            ) : (
              <AlertTriangle className={`w-6 h-6 shrink-0 ${
                (scoreInfo.verdict === "low" || scoreInfo.verdict === "moderate") ? "text-[#ffcc00]" : "text-destructive"
              }`} />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-heading font-bold text-sm ${
                scoreInfo.verdict === "safe" ? "text-primary"
                : (scoreInfo.verdict === "low" || scoreInfo.verdict === "moderate") ? "text-[#ffcc00]"
                : "text-destructive"
              }`}>
                {scoreInfo.label}
              </p>
              <p className="text-muted-foreground text-xs truncate font-mono">{result.url}</p>
            </div>
          </div>

          {/* Risk Score Card */}
          <div className={`rounded-lg border p-5 space-y-4 transition-all duration-500 ${scoreInfo.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <div>
                <p className="text-xs font-heading text-muted-foreground uppercase tracking-wide">Risk Score</p>
                <p className={`font-heading font-bold text-3xl ${scoreInfo.text} drop-shadow-[0_0_8px_currentColor/0.3]`}>
                  {result.score}%
                </p>
              </div>
              <div className="text-right">
                <p className={`font-heading font-bold text-lg ${scoreInfo.text}`}>{scoreInfo.label}</p>
                <p className="text-muted-foreground text-xs">{scoreInfo.description}</p>
              </div>
            </div>
            <div className="space-y-2">
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-secondary/50 border border-border">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ease-out shadow-[0_0_12px_currentColor/0.5] ${scoreInfo.bar}`}
                  style={{ width: `${result.score}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>Low</span>
                <span>Medium Risk</span>
                <span>High</span>
              </div>
            </div>

            {/* API unavailable notice — deep scan only */}
            {result.mode === "deep" && result.apiUnavailable && (
              <div className="pt-2 border-t border-border/30">
                <p className="text-xs font-mono text-amber-400">
                  ⚠ Analysis data unavailable — score based on primary analysis only
                </p>
              </div>
            )}
          </div>

          {/* Risk Analysis Report */}
          <div className="mt-8">
            <RiskAnalysisReport
              data={{
                scanType: "url",
                status: scoreInfo.verdict,
                score: result.score,
                details: result.reasons.map((r) => r.label).join(", "),
                threats: result.reasons
                  .filter((r) => r.flagged)
                  .map((r) => `${r.label}: ${r.value}`),
                timestamp: new Date().toISOString(),
                userName: userName,
                targetItem: result.url,
                flags: result.flags,
                scanMode: result.mode,
                // Deep scan only: vendor counts, source, api status, engines
                ...(result.mode === "deep" ? {
                  maliciousEngines: result.maliciousEngines,
                  maliciousCount:   result.vtStats?.malicious,
                  suspiciousCount:  result.vtStats?.suspicious,
                } : {
                  source:           "Quick Scan",
                  apiUnavailable:   false,
                  detectionCount:   undefined,
                  totalVendors:     undefined,
                  maliciousEngines: [],
                  maliciousCount:   undefined,
                  suspiciousCount:  undefined,
                }),
              }}
            />
          </div>

          {/* Detailed Risk Analysis */}
          <div className="space-y-3">
            <h3 className="font-heading font-semibold text-foreground text-sm flex items-center gap-2">
              <Shield className="w-4 h-4 text-primary" /> Analysis Details
            </h3>
            <div className="grid gap-2 max-h-96 overflow-y-auto">
              {result.reasons.map((r, i) => {
                const isWarning = r.flagged;
                return (
                  <div
                    key={i}
                    className={`flex items-start gap-3 p-3 rounded-lg border transition-all duration-300 hover:shadow-[0_0_12px_currentColor/0.2] ${
                      isWarning
                        ? "bg-destructive/5 border-destructive/30 hover:border-destructive/50"
                        : "bg-primary/5 border-primary/30 hover:border-primary/50"
                    }`}
                  >
                    <div className="mt-0.5">
                      {isWarning ? (
                        <AlertTriangle className="w-4 h-4 text-destructive shrink-0" />
                      ) : (
                        <Check className="w-4 h-4 text-primary shrink-0" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-heading font-semibold text-sm ${isWarning ? "text-destructive" : "text-primary"}`}>
                        {r.label}
                      </p>
                      <p className="text-muted-foreground text-xs mt-1 font-mono">{r.value}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Download & Share Report */}
          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 p-5 space-y-4 animate-fade-in-up shadow-[0_0_15px_hsl(150_100%_45%/0.1)]">
            <div className="flex items-center gap-2 text-foreground font-heading text-sm">
              <FileText className="w-5 h-5 text-primary drop-shadow-[0_0_6px_currentColor/0.4]" />
              <span>Report Ready</span>
            </div>

            <div className="bg-muted/50 rounded border border-border p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Scan Type:</span>
                <span className="text-foreground font-semibold">URL Phishing Detection</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL:</span>
                <span className="text-foreground font-semibold truncate max-w-xs">
                  {result.url.length > 30 ? result.url.substring(0, 30) + "..." : result.url}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result:</span>
                <span className={result.status === "safe" ? "text-primary font-semibold" : "text-destructive font-semibold"}>
                  {scoreInfo.label.toUpperCase()}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Score:</span>
                <span className={`${scoreInfo.text} font-semibold`}>{result.score}/100</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date & Time:</span>
                <span className="text-foreground font-semibold">{new Date().toLocaleString()}</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <Button
                id="url-download-report-btn"
                onClick={handleGenerateReport}
                disabled={downloadingReport || sharing}
                className="font-heading hover:shadow-[0_0_20px_hsl(150_100%_45%/0.4)] transition-all duration-300"
              >
                {downloadingReport ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
                ) : (
                  <><Download className="w-4 h-4 mr-1.5" /> Download</>
                )}
              </Button>
              <Button
                id="url-share-report-btn"
                onClick={handleShare}
                disabled={sharing || downloadingReport}
                className="font-heading hover:shadow-[0_0_20px_hsl(150_100%_45%/0.4)] transition-all duration-300"
              >
                {sharing ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Sharing...</>
                ) : (
                  <><span className="mr-1.5 text-base leading-none">📤</span> Share</>
                )}
              </Button>
            </div>
          </div>

        </div>
      )}
    </section>
  );
};

export default UrlScanner;

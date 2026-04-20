import { useState } from "react";
import { Search, Loader2, CheckCircle, AlertTriangle, Shield, FileText, Lock, Download, AlertCircle, Check, RotateCcw, Link, Type } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { toast } from "@/hooks/use-toast";
import type { UrlAnalysis, ScanStatus } from "@/lib/interfaces";
import { apiScans } from "@/lib/api-backend";  // UPDATED: Use backend API instead of mock
import { handleScanAttempt } from "@/lib/guestAccess";  // ADDED: Guest access control
import RiskAnalysisReport from "@/components/RiskAnalysisReport";
import { generatePDFReport } from "@/lib/pdfReportGenerator";
import { scanUrlWithVT } from "@/lib/virustotal";
import { mapVTToUrlAnalysis } from "@/lib/mapVTResult";
import { calculateFinalVerdict, calculateAdjustedScore, type RiskFlags } from "@/lib/riskDecisionLogic";

interface UrlScannerProps {
  onScanComplete: () => void;
  isAuthenticated?: boolean;
  userName?: string;
  scanData: { input: string; result: any };
  setScanData: (data: { input: string; result: any }) => void;
}

// Updated: Uses unified decision logic with flag priority
// Ensures threats are never downplayed as "Safe"
const getVerdictInfo = (score: number, flags?: RiskFlags) => {
  const verdict = calculateFinalVerdict(score, flags || {});
  const adjustedScore = calculateAdjustedScore(score, flags || {});

  if (verdict === "safe") {
    return { 
      bar: "bg-[#00ff9c]", 
      text: "text-[#00ff9c]", 
      bg: "bg-[#00ff9c]/10", 
      label: "✓ Safe", 
      description: "Low Risk URL",
      adjustedScore
    };
  } else if (verdict === "warning") {
    return { 
      bar: "bg-[#ffcc00]", 
      text: "text-[#ffcc00]", 
      bg: "bg-[#ffcc00]/10", 
      label: "⚠ Warning", 
      description: "Medium Risk URL",
      adjustedScore
    };
  } else {
    return { 
      bar: "bg-[#ff4d4d]", 
      text: "text-[#ff4d4d]", 
      bg: "bg-[#ff4d4d]/10", 
      label: "✕ Dangerous", 
      description: "High Risk URL",
      adjustedScore
    };
  }
};

const UrlScanner = ({ onScanComplete, isAuthenticated = false, userName, scanData, setScanData }: UrlScannerProps) => {
  const [url, setUrl] = useState(scanData.input || "");
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<UrlAnalysis | null>(scanData.result || null);
  const [downloadingReport, setDownloadingReport] = useState(false);

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
    // Guest limit reached - block scan and show message
    showToast(scanAccess.message, "error");
    return;
  }

  // Show guest scan info (only for guests)
  if (!isAuthenticated) {
    showToast(`📝 ${scanAccess.message}`, "info");
  }

  setScanning(true);
  setResult(null);

  try {
    const vtResponse = await scanUrlWithVT(url);

    const analysis = mapVTToUrlAnalysis(
      vtResponse.url || url,
      vtResponse.analysisId,
      vtResponse.stats,
      vtResponse.results
    );

    setResult(analysis);
    setScanData({ input: url, result: analysis });
    onScanComplete();

    if (isAuthenticated) {
      try {
        // Get user_id from localStorage for secure data isolation
        const userId = localStorage.getItem('user_id');
        console.log('💾 Saving URL scan - user_id:', userId, 'url:', url, 'status:', analysis.status);
        
        if (userId) {
          const saveResult = await apiScans.saveScan(
            parseInt(userId),  // Use user_id (NOT username)
            "url",
            url,
            analysis.status
          );
          
          console.log('✅ Scan save result:', saveResult);
          
          if (saveResult.status === 'success') {
            showToast("✅ Result saved to history", "success");
          } else {
            console.error('❌ Failed to save scan:', saveResult.message);
            showToast("⚠️ Scan completed but failed to save to history", "error");
          }
        } else {
          console.warn('⚠️ No user_id found in localStorage - scan not saved');
        }
      } catch (err) {
        console.error("❌ Failed to save scan:", err);
      }
    }
    // REMOVED: Guest scan message (already shown above)

    if (analysis.status === "phishing")        showToast("⚠️ Phishing threat detected!", "error");
    else if (analysis.status === "suspicious") showToast("⚠️ Suspicious URL detected!", "error");
    else                                        showToast("✅ URL appears safe", "success");

  } catch (err) {
    console.error(err);
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
          <p className="text-muted-foreground text-sm font-mono">Scanning with VirusTotal — this may take 10–20 seconds...</p>
          <Progress value={66} className="h-2" />
        </div>
      )}

      {result && scoreInfo && (
        <div className="mt-6 space-y-5 animate-fade-in-up">

          {/* Status Banner */}
          <div className={`p-4 rounded-lg border-2 flex items-center gap-3 transition-all duration-500 ${
            result.status === "safe"
              ? "bg-primary/10 border-primary/40 shadow-[0_0_20px_hsl(150_100%_45%/0.2)]"
              : "bg-destructive/10 border-destructive/40 shadow-[0_0_20px_hsl(0_72%_51%/0.2)]"
          }`}>
            {result.status === "safe" ? (
              <CheckCircle className="w-6 h-6 text-primary shrink-0" />
            ) : (
              <AlertTriangle className="w-6 h-6 text-destructive shrink-0" />
            )}
            <div className="flex-1 min-w-0">
              <p className={`font-heading font-bold text-sm ${result.status === "safe" ? "text-primary" : "text-destructive"}`}>
                {result.status === "safe"
                  ? "✓ URL Appears Safe"
                  : result.status === "suspicious"
                  ? "⚠ Suspicious URL Detected"
                  : "⚠ Phishing Threat Detected"}
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
                  {scoreInfo.adjustedScore}
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
                  style={{ width: `${scoreInfo.adjustedScore}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground font-mono">
                <span>0 - Safe</span>
                <span>50 - Neutral</span>
                <span>100 - Danger</span>
              </div>
            </div>

            {/* VirusTotal Stats */}
            {result.vtStats && (
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-border/30">
                {[
                  { label: "Malicious",  value: result.vtStats.malicious,  color: "text-[#ff4d4d]" },
                  { label: "Suspicious", value: result.vtStats.suspicious, color: "text-[#ffcc00]" },
                  { label: "Harmless",   value: result.vtStats.harmless,   color: "text-[#00ff9c]" },
                  { label: "Undetected", value: result.vtStats.undetected, color: "text-muted-foreground" },
                ].map(({ label, value, color }) => (
                  <div key={label} className="text-center">
                    <p className={`font-heading font-bold text-xl ${color}`}>{value}</p>
                    <p className="text-xs text-muted-foreground font-mono">{label}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Risk Analysis Report */}
          <div className="mt-8">
            <RiskAnalysisReport
              data={{
                scanType: "url",
                status:
                  result.status === "safe"
                    ? "safe"
                    : result.status === "suspicious"
                    ? "suspicious"
                    : "dangerous",
                score: result.score,
                details: result.reasons.map((r) => r.label).join(", "),
                threats: result.reasons
                  .filter((r) => r.flagged)
                  .map((r) => `${r.label}: ${r.value}`),
                timestamp: new Date().toISOString(),
                userName: userName,
                targetItem: result.url,
                flags: result.flags,
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

          {/* PDF Report Download */}
          <div className="rounded-lg border border-border/50 bg-gradient-to-br from-purple-500/5 to-cyan-500/5 p-5 space-y-4 animate-fade-in-up shadow-[0_0_15px_hsl(150_100%_45%/0.1)]">
            <div className="flex items-center gap-2 text-foreground font-heading text-sm">
              <FileText className="w-5 h-5 text-primary drop-shadow-[0_0_6px_currentColor/0.4]" />
              <span>PDF Report Ready</span>
            </div>

            <div className="bg-muted/50 rounded border border-border p-3 space-y-2 text-xs font-mono">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Report Type:</span>
                <span className="text-foreground font-semibold">APGS Security Risk Report</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">URL Analyzed:</span>
                <span className="text-foreground font-semibold truncate max-w-xs">
                  {result.url.length > 30 ? result.url.substring(0, 30) + "..." : result.url}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Result:</span>
                <span className={result.status === "safe" ? "text-primary font-semibold" : "text-destructive font-semibold"}>
                  {result.status === "safe" ? "✓ SAFE" : result.status === "suspicious" ? "⚠ SUSPICIOUS" : "⚠ PHISHING"}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Risk Score:</span>
                <span className={`${scoreInfo.text} font-semibold`}>{result.score}/100</span>
              </div>
              {result.vtStats && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Malicious Vendors:</span>
                  <span className={`font-semibold ${result.vtStats.malicious > 0 ? "text-destructive" : "text-primary"}`}>
                    {result.vtStats.malicious} / {result.vtStats.malicious + result.vtStats.suspicious + result.vtStats.harmless + result.vtStats.undetected}
                  </span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Analysis Points:</span>
                <span className="text-foreground font-semibold">{result.reasons.length} factors</span>
              </div>
            </div>

            <Button
              onClick={handleGenerateReport}
              disabled={downloadingReport}
              className="w-full font-heading hover:shadow-[0_0_20px_hsl(150_100%_45%/0.4)] transition-all duration-300"
            >
              {downloadingReport ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generating...</>
              ) : (
                <><Download className="w-4 h-4 mr-2" /> Download Risk Report</>
              )}
            </Button>
          </div>

        </div>
      )}
    </section>
  );
};

export default UrlScanner;

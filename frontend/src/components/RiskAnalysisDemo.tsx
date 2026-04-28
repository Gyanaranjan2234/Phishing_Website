import RiskAnalysisReport from "@/components/RiskAnalysisReport";

const RiskAnalysisDemo = () => {
  // Demo data - SAFE
  const safeData = {
    scanType: "url" as const,
    status: "safe" as const,
    score: 15,
    details: "The URL has been verified as legitimate. All security checks passed successfully. No suspicious patterns detected.",
    threats: [],
    timestamp: new Date().toISOString(),
    userName: "Security Scanner",
    targetItem: "https://www.example-safe-site.com",
    analysisItems: [
      "HTTPS Enabled",
      "Valid Certificate",
      "No Malware",
      "Domain Registered",
      "Safe Reputation",
    ],
  };

  // Demo data - WARNING
  const warningData = {
    scanType: "url" as const,
    status: "suspicious" as const,
    score: 55,
    details: "This URL shows some suspicious characteristics. While not definitively malicious, exercise caution. Multiple factors require manual review.",
    threats: [
      "Newly registered domain (less than 30 days)",
      "Unusual redirect pattern detected",
      "SSL certificate from less trusted CA",
    ],
    timestamp: new Date().toISOString(),
    userName: "Security Scanner",
    targetItem: "https://www.suspicious-domain.net",
    analysisItems: [
      "HTTPS Present",
      "New Domain",
      "Redirects Found",
      "Low Trust CA",
    ],
  };

  // Demo data - DANGEROUS
  const dangerousData = {
    scanType: "url" as const,
    status: "dangerous" as const,
    score: 92,
    details: "This URL has been identified as a known phishing site. Strong indicators of malicious intent detected across multiple security parameters.",
    threats: [
      "Known phishing domain",
      "Matches credential harvesting patterns",
      "Hosting malware payload",
      "Blacklisted by multiple security vendors",
      "Used in active phishing campaigns",
    ],
    timestamp: new Date().toISOString(),
    userName: "Security Scanner",
    targetItem: "https://www.phishing-site-malicious.xyz",
    analysisItems: [
      "Phishing Known",
      "Malware Detected",
      "Blacklisted",
      "Credential Harvester",
      "Active Campaign",
    ],
  };

  return (
    <div className="w-full min-h-screen bg-slate-950 p-8 space-y-12">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold text-white mb-2">Risk Analysis Report Examples</h1>
        <p className="text-slate-400 mb-12">Demonstration of the modern cybersecurity risk assessment dashboard</p>

        {/* Safe Report */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-emerald-500 rounded-full" />
            Safe Item Example
          </h2>
          <RiskAnalysisReport data={safeData} />
        </div>

        {/* Warning Report */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-amber-400 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-amber-500 rounded-full" />
            Suspicious Item Example
          </h2>
          <RiskAnalysisReport data={warningData} />
        </div>

        {/* Dangerous Report */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-red-400 mb-4 flex items-center gap-2">
            <span className="w-3 h-3 bg-red-500 rounded-full" />
            Dangerous Item Example
          </h2>
          <RiskAnalysisReport data={dangerousData} />
        </div>
      </div>
    </div>
  );
};

export default RiskAnalysisDemo;

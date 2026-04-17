import { Shield, Mail, Lock, Eye } from "lucide-react";

const PrivacyPolicy = () => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/90 backdrop-blur-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <span className="text-2xl font-heading font-bold text-primary">APGS</span>
            <span className="text-xs text-muted-foreground">Advanced Phishing Guard System</span>
          </a>
          <a href="/" className="text-sm text-primary hover:text-primary/90 transition-colors">
            Back to Home
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-16 space-y-16">
        {/* Title Section */}
        <section className="space-y-4 text-center border-b border-border pb-8">
          <div className="flex items-center justify-center gap-3">
            <Shield className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold">Privacy Policy</h1>
          </div>
          <p className="text-muted-foreground text-lg">
            Your privacy and data security are our top priorities
          </p>
          <p className="text-xs text-muted-foreground">
            Last updated: April 17, 2026
          </p>
        </section>

        {/* Sections */}
        <section className="space-y-16">
          {/* Section 1 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="1" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
              <Eye className="w-6 h-6" />
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              Welcome to APGS (Advanced Phishing Guard System). We are committed to protecting your privacy and ensuring transparency about how we collect, use, and safeguard your personal information. This Privacy Policy explains our practices regarding data collection and your rights as a user.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              By using our website and services, you agree to the terms outlined in this Privacy Policy. If you do not agree with our practices, please do not use our services.
            </p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-100/80 leading-relaxed">
                <strong>⚠️ Important Disclaimer:</strong> APGS provides security analysis based on available data and does not guarantee absolute accuracy. While we strive for accuracy, no security scanning service is 100% effective. Always exercise caution and use additional security measures.
              </p>
            </div>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="2" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
              <Lock className="w-6 h-6" />
              2. Information We Collect
            </h2>
            <div className="space-y-4 text-muted-foreground leading-relaxed">
              <div className="bg-card/30 rounded-lg p-4 border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                <ul className="list-disc list-inside space-y-2 text-base leading-relaxed">
                  <li>Email address (when you create an account or contact us)</li>
                  <li>Username and password (encrypted and securely stored)</li>
                  <li>Name and profile information (optional)</li>
                  <li>Scan history and results (with your consent)</li>
                </ul>
              </div>
              <div className="bg-card/30 rounded-lg p-4 border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">Automatically Collected Information</h3>
                <ul className="list-disc list-inside space-y-2 text-base leading-relaxed">
                  <li>IP address and geolocation data</li>
                  <li>Browser type, operating system, and device information</li>
                  <li>Pages visited and time spent on our site</li>
                  <li>Referrer information and search keywords</li>
                  <li>Cookies and local storage data</li>
                </ul>
              </div>
              <div className="bg-card/30 rounded-lg p-4 border border-border/50">
                <h3 className="font-semibold text-foreground mb-2">Third-Party Data</h3>
                <p className="text-base leading-relaxed">
                  We may receive security threat data from VirusTotal and other threat intelligence providers to enhance our scanning services. This data does not include personal identifiers.
                </p>
              </div>
            </div>
          </div>

          {/* Section 3 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="3" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
              <Shield className="w-6 h-6" />
              3. How We Use Your Data
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We use the information we collect for the following purposes:
            </p>
            <ul className="space-y-3 text-muted-foreground">
              {[
                "Providing and improving our security scanning services",
                "Creating and maintaining your user account",
                "Personalizing your experience and delivering relevant content",
                "Analyzing usage patterns to enhance website performance",
                "Sending security alerts and important notifications",
                "Responding to customer support requests",
                "Detecting and preventing fraud, abuse, and security threats",
                "Complying with legal obligations and regulations",
              ].map((item) => (
                <li key={item} className="flex gap-3 leading-relaxed">
                  <span className="text-primary min-w-fit">✓</span>
                  <span className="text-base">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="4" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
              <Lock className="w-6 h-6" />
              4. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We implement industry-standard security measures to protect your personal information:
            </p>
            <div className="bg-card/50 rounded-lg border border-border p-6 space-y-3">
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">🔒</span>
                <div>
                  <h3 className="font-semibold text-foreground">Encryption</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">All data transmitted between your device and our servers uses TLS/SSL encryption</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">🛡️</span>
                <div>
                  <h3 className="font-semibold text-foreground">Access Controls</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Access to personal data is restricted to authorized personnel only</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">🔑</span>
                <div>
                  <h3 className="font-semibold text-foreground">Password Protection</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">Passwords are hashed using industry-standard algorithms</p>
                </div>
              </div>
              <div className="flex gap-3">
                <span className="text-primary font-bold min-w-fit">📋</span>
                <div>
                  <h3 className="font-semibold text-foreground">Regular Audits</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">We conduct regular security audits and penetration testing</p>
                </div>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed text-base">
              Despite our best efforts, no method of transmission over the internet is 100% secure. We cannot guarantee absolute security of your data.
            </p>
          </div>

          {/* Section 5 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="5" className="text-2xl font-heading font-bold text-primary">
              5. Data Retention
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Account Data:</span> Retained for the duration of your account. You can request deletion at any time.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Scan History:</span> Retained for 1 year for authenticated users, 30 days for guest scans.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Usage Logs:</span> Automatically purged after 90 days.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Legal Hold:</span> Data may be retained longer if required by law.
              </p>
            </div>
          </div>

          {/* Section 6 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="6" className="text-2xl font-heading font-bold text-primary">
              6. Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We integrate with third-party services to enhance our capabilities. No sensitive personal data (such as passwords or full personal details) is shared with third parties.
            </p>
            <div className="space-y-3 bg-card/30 rounded-lg p-4 border border-border/50">
              <div>
                <h3 className="font-semibold text-foreground mb-1">VirusTotal API</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use VirusTotal for threat scanning. Your submitted URLs/files may be analyzed by 90+ security vendors. Review their privacy policy at virustotal.com.
                </p>
              </div>
              <div className="border-t border-border/30 pt-3">
                <h3 className="font-semibold text-foreground mb-1">Supabase</h3>
                <p className="text-sm text-muted-foreground">
                  For authentication and database services. Your account data is processed according to Supabase's privacy terms.
                </p>
              </div>
              <div>
                <h3 className="font-semibold text-foreground mb-1">Analytics</h3>
                <p className="text-sm text-muted-foreground">
                  We may use analytics tools to understand user behavior. These services comply with GDPR and CCPA.
                </p>
              </div>
            </div>
          </div>

          {/* Section 7 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="7" className="text-2xl font-heading font-bold text-primary">
              7. Your Privacy Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              Depending on your location, you may have the following rights:
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { title: "Right to Access", desc: "Request a copy of your personal data" },
                { title: "Right to Rectification", desc: "Correct inaccurate or incomplete data" },
                { title: "Right to Erasure", desc: "Request deletion of your data (right to be forgotten)" },
                { title: "Right to Restrict", desc: "Limit how your data is processed" },
                { title: "Right to Portability", desc: "Download your data in a portable format" },
                { title: "Right to Withdraw", desc: "Withdraw consent for data processing" },
              ].map((right) => (
                <div key={right.title} className="bg-card/30 rounded-lg p-4 border border-border/50">
                  <h3 className="font-semibold text-foreground mb-2 leading-relaxed">{right.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{right.desc}</p>
                </div>
              ))}
            </div>
            <p className="text-muted-foreground leading-relaxed text-base mt-4">
              To exercise these rights, contact us at support.apgs@gmail.com with your request.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="8" className="text-2xl font-heading font-bold text-primary">
              8. Cookies & Tracking
            </h2>
            <div className="space-y-3 text-muted-foreground">
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Session Cookies:</span> Maintain your login session and preferences.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Persistent Cookies:</span> Remember your settings across visits.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Tracking Pixels:</span> Used to measure campaign effectiveness.
              </p>
              <p className="text-base leading-relaxed">
                <span className="font-semibold text-foreground">Local Storage:</span> Stores your view preferences and scan history locally.
              </p>
              <div className="bg-card/50 rounded-lg p-4 border border-border/50 mt-4">
                <p className="text-sm leading-relaxed">
                  <strong>Managing Cookies:</strong> You can disable cookies in your browser settings. However, some features may not work properly.
                </p>
              </div>
            </div>
          </div>

          {/* Section 9 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="9" className="text-2xl font-heading font-bold text-primary">
              9. Children's Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              APGS is not intended for users under 13 years of age. We do not knowingly collect personal information from children. If we discover that we have collected data from a child under 13, we will immediately delete it.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              Parents or guardians who believe their child has provided information to us should contact us immediately at support.apgs@gmail.com.
            </p>
          </div>

          {/* Section 10 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="10" className="text-2xl font-heading font-bold text-primary">
              10. Privacy Policy Updates
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We may update this Privacy Policy to reflect changes in our practices, technology, legal requirements, or other factors. We will notify you of material changes via email or prominent notice on our website.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              Your continued use of APGS following the posting of changes means you accept those changes.
            </p>
          </div>

          {/* Section 11 */}
          <div className="space-y-4">
            <h2 id="11" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
              <Mail className="w-6 h-6" />
              11. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              For any privacy-related queries, contact us at:
            </p>
            <div className="bg-card/50 rounded-lg border border-border p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary">Email</p>
                  <a href="mailto:support.apgs@gmail.com" className="text-muted-foreground hover:text-primary transition-colors text-base font-medium">
                    support.apgs@gmail.com
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Footer Section */}
        <section className="border-t border-border pt-8 mt-12 text-center text-muted-foreground">
          <p className="text-sm">
            © 2026 Advanced Phishing Guard System. All rights reserved.
          </p>
          <p className="text-xs mt-2">
            This Privacy Policy is effective as of April 17, 2026
          </p>
        </section>
      </main>
    </div>
  );
};

export default PrivacyPolicy;

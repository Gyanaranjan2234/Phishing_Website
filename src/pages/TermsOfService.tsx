import { AlertCircle, Mail } from "lucide-react";

const TermsOfService = () => {
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
            <AlertCircle className="w-8 h-8 text-primary" />
            <h1 className="text-4xl md:text-5xl font-heading font-bold">Terms of Service</h1>
          </div>
          <p className="text-muted-foreground text-lg leading-relaxed">
            Legal terms and conditions for using APGS services. Please read these terms carefully before accessing or using our platform. By using APGS, you acknowledge acceptance of these conditions.
          </p>
          <div className="space-y-1 text-xs text-muted-foreground/80">
            <p>Last updated: April 17, 2026</p>
            <p>Effective Date: April 17, 2026</p>
          </div>
        </section>

        {/* Sections */}
        <section className="space-y-16">
          {/* Section 1 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="1" className="text-2xl font-heading font-bold text-primary">
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              Welcome to APGS (Advanced Phishing Guard System). These Terms of Service ("Terms") govern your use of our website, services, and applications. By accessing or using APGS, you agree to be bound by these Terms. If you do not agree to these Terms, please do not use our services.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              APGS provides comprehensive threat analysis, URL scanning, file scanning, email breach checking, and password strength assessment services to help protect users from cyber threats. Our services are designed for educational and personal security purposes.
            </p>
          </div>

          {/* Section 2 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="2" className="text-2xl font-heading font-bold text-primary">
              2. Acceptance of Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              By using APGS services, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service and our Privacy Policy. These Terms apply to all users, including visitors, registered users, and individuals using our services on behalf of an organization.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              If you are using APGS on behalf of an organization, you represent and warrant that you have the authority to bind that organization to these Terms.
            </p>
          </div>

          {/* Section 3 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="3" className="text-2xl font-heading font-bold text-primary">
              3. Use of Services
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              APGS grants you a limited, non-exclusive, non-transferable license to use our services for lawful purposes. You agree to use our platform only for:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✓</span>
                <span>Scanning and analyzing URLs for phishing and malware threats</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✓</span>
                <span>Checking files for security vulnerabilities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✓</span>
                <span>Verifying email addresses for data breaches</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✓</span>
                <span>Assessing password security and strength</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">✓</span>
                <span>Educational purposes and personal security enhancement</span>
              </li>
            </ul>
          </div>

          {/* Section 4 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="4" className="text-2xl font-heading font-bold text-primary">
              4. User Responsibilities
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              As a user of APGS, you are responsible for:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Maintaining the confidentiality of your account credentials</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Ensuring you have the right to submit URLs, files, or other content for scanning</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Notifying us immediately of any unauthorized access to your account</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Complying with all applicable laws and regulations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Using APGS only for lawful and ethical purposes</span>
              </li>
            </ul>
          </div>

          {/* Section 5 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="5" className="text-2xl font-heading font-bold text-primary">
              5. Prohibited Activities
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              You agree not to:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Use APGS for illegal, fraudulent, or harmful purposes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Attempt to gain unauthorized access to our systems or services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Interfere with or disrupt the functionality of APGS</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Reverse engineer, decompile, or attempt to discover our proprietary code</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Scan or analyze websites/files that you do not own or have permission to analyze</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Use APGS to harass, threaten, or harm individuals or organizations</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-red-500 mt-1">✗</span>
                <span>Violate intellectual property rights or privacy of others</span>
              </li>
            </ul>
          </div>

          {/* Section 6 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="6" className="text-2xl font-heading font-bold text-primary">
              6. Service Availability
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              APGS services are provided on an as-available basis. We do not guarantee that our services will be available at all times or without interruption. We may:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Perform scheduled maintenance (with advance notice when possible)</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Temporarily suspend services due to technical issues or security concerns</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Modify or discontinue features or services</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Implement rate limiting to prevent service abuse</span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed text-base mt-4">
              You acknowledge that interruptions and delays may occur and agree not to hold APGS liable for any resulting damages.
            </p>
          </div>

          {/* Section 7 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="7" className="text-2xl font-heading font-bold text-primary">
              7. Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              APGS integrates with third-party services to provide comprehensive threat analysis:
            </p>
            <div className="space-y-3 bg-card/30 rounded-lg p-4 border border-border/50">
              <div>
                <h3 className="font-semibold text-foreground mb-2">VirusTotal API</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use VirusTotal for URL and file scanning. Your submitted content may be analyzed by 90+ security vendors. Review VirusTotal's privacy policy at virustotal.com. We are not responsible for how VirusTotal processes your data.
                </p>
              </div>
              <div className="border-t border-border/30 pt-3">
                <h3 className="font-semibold text-foreground mb-2">Supabase</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  We use Supabase for authentication and database services. Your data is processed according to Supabase's privacy terms.
                </p>
              </div>
            </div>
            <p className="text-muted-foreground leading-relaxed text-base mt-4">
              We are not responsible for the accuracy, availability, or practices of third-party services. Your use of third-party services is governed by their respective terms and privacy policies.
            </p>
          </div>

          {/* Section 8 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="8" className="text-2xl font-heading font-bold text-primary">
              8. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              APGS services are provided "AS IS" without warranties of any kind, either express or implied. We disclaim all warranties, including:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Warranties of merchantability, fitness for a particular purpose, or non-infringement</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Warranty that our services will be error-free or uninterrupted</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Warranty of 100% detection accuracy for threats</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Warranty that using our services will prevent all security threats</span>
              </li>
            </ul>
            <div className="bg-amber-500/5 border border-amber-500/15 rounded-lg p-4 mt-6">
              <p className="text-sm text-amber-100/70 leading-relaxed">
                <strong>⚠️ Important:</strong> No security scanning service is 100% effective. While APGS strives for accuracy, threat detection may be incomplete or delayed. Always use our service as one of multiple security layers, not as your sole protection.
              </p>
            </div>
          </div>

          {/* Section 9 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="9" className="text-2xl font-heading font-bold text-primary">
              9. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              To the fullest extent permitted by law, APGS shall not be liable for:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Indirect, incidental, consequential, or punitive damages</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Loss of profits, revenue, data, or business opportunities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Damages arising from missed threat detections or false positives</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Unauthorized access to your account or data</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Service interruptions or unavailability</span>
              </li>
            </ul>
            <div className="space-y-3 mt-6 p-4 bg-card/30 rounded-lg border border-border/50">
              <p className="text-muted-foreground leading-relaxed text-base font-semibold">
                <strong>Liability Cap:</strong> Our total liability for any claim arising under or relating to these Terms shall not exceed the amount you paid to APGS in the past 12 months, or $0 if you have not paid anything. This limitation applies regardless of the legal theory (contract, tort, negligence, or otherwise).
              </p>
            </div>
          </div>

          {/* Section 10 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="10" className="text-2xl font-heading font-bold text-primary">
              10. Data Usage and Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              Your use of APGS is also governed by our Privacy Policy. We collect and process data as described in that policy. Key points include:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Personal data is encrypted and securely stored</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Scan history may be retained for analytics and improvement purposes</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>Submitted URLs/files may be shared with VirusTotal and other security vendors</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>No sensitive personal data is shared with third parties without consent</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>You have the right to access, correct, or delete your personal data</span>
              </li>
            </ul>
          </div>

          {/* Section 11 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="11" className="text-2xl font-heading font-bold text-primary">
              11. Termination of Access
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We reserve the right to terminate or suspend your access to APGS at any time, without notice, if:
            </p>
            <ul className="space-y-2 text-muted-foreground leading-relaxed text-base">
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>You violate these Terms of Service</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>You engage in illegal or harmful activities</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>We determine your use poses a risk to our service or other users</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-primary mt-1">•</span>
                <span>We cease offering APGS services</span>
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed text-base mt-4">
              Upon termination, your right to use APGS immediately ceases. We may retain your data as required by law.
            </p>
          </div>

          {/* Section 12 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="12" className="text-2xl font-heading font-bold text-primary">
              12. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              We may update these Terms of Service at any time. Material changes will be notified to registered users via email. Your continued use of APGS following any changes constitutes acceptance of the updated Terms.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              We encourage you to review these Terms periodically to stay informed of any updates.
            </p>
          </div>

          {/* Section 13 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="13" className="text-2xl font-heading font-bold text-primary">
              13. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              These Terms of Service are governed by and construed in accordance with the laws of India, without regard to its conflict of law principles. You agree to submit to the exclusive jurisdiction of the courts of India for any legal proceedings arising from or relating to these Terms.
            </p>
            <p className="text-muted-foreground leading-relaxed text-base">
              If any provision of these Terms is found to be invalid or unenforceable, the remaining provisions shall continue in full force and effect.
            </p>
          </div>

          {/* Section 14 */}
          <div className="space-y-4 pb-8 border-b border-border/40">
            <h2 id="14" className="text-2xl font-heading font-bold text-primary flex items-center gap-2">
              <Mail className="w-6 h-6" />
              14. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed text-base">
              If you have questions, disputes, or concerns regarding these Terms of Service, or if you need to report violations, please reach out to our support team using the contact information below:
            </p>
            <div className="bg-card/50 rounded-lg border border-border p-6 hover:border-primary/30 transition-colors">
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary flex-shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-primary">Email</p>
                  <a href="mailto:support.apgs@gmail.com" className="text-muted-foreground hover:text-primary transition-colors text-base font-medium leading-relaxed">
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
            These Terms of Service are effective as of April 17, 2026
          </p>
        </section>
      </main>
    </div>
  );
};

export default TermsOfService;

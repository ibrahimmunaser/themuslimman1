import Link from "next/link";
import { Navbar } from "@/components/landing/navbar";
import { Footer } from "@/components/landing/footer";
import { ContactForm } from "@/components/help/contact-form";
import { 
  HelpCircle,
  BookOpen, Video, Download, RefreshCcw, CreditCard, Lock
} from "lucide-react";

export default function HelpPage() {

  return (
    <div className="flex flex-col min-h-screen bg-ink text-text">
      <Navbar />

      {/* Hero */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 geo-pattern opacity-20" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-sm font-medium mb-6">
            <HelpCircle className="w-4 h-4" />
            Help Center
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-text mb-5 leading-tight">
            How Can We Help You?
          </h1>
          <p className="text-base sm:text-lg text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Find answers to common questions or reach out to us directly.
          </p>
        </div>
      </section>

      {/* Quick Help Topics */}
      <section className="py-12 border-t border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <h2 className="text-2xl font-bold text-text mb-8 text-center">
            Common Questions
          </h2>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Getting Started */}
            <div className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center mb-4">
                <BookOpen className="w-6 h-6 text-gold" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-3">Getting Started</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• How do I access my course?</li>
                <li>• Where do I start learning?</li>
                <li>• How is the course structured?</li>
                <li>• Can I download materials?</li>
              </ul>
              <details className="mt-4 text-sm">
                <summary className="text-gold cursor-pointer hover:text-gold-light">View answers</summary>
                <div className="mt-3 space-y-3 text-text-secondary">
                  <p><strong>Access:</strong> Log in at <Link href="/login" className="text-gold hover:underline">themuslimman.com/login</Link> and go to your dashboard.</p>
                  <p><strong>Start:</strong> Begin with Part 1 in the Pre-Islamic Arabia chapter. Follow the sequential order.</p>
                  <p><strong>Structure:</strong> 100 parts organized chronologically across 15+ chapters.</p>
                  <p><strong>Downloads:</strong> PDF slides and materials are available in each lesson (Complete plan only).</p>
                </div>
              </details>
            </div>

            {/* Technical Issues */}
            <div className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-blue-500/10 border border-blue-500/30 flex items-center justify-center mb-4">
                <Video className="w-6 h-6 text-blue-400" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-3">Technical Issues</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Videos won't play</li>
                <li>• Page loading issues</li>
                <li>• Progress not saving</li>
                <li>• Login problems</li>
              </ul>
              <details className="mt-4 text-sm">
                <summary className="text-gold cursor-pointer hover:text-gold-light">View solutions</summary>
                <div className="mt-3 space-y-3 text-text-secondary">
                  <p><strong>Videos:</strong> Try refreshing the page, clearing your browser cache, or switching browsers (Chrome/Firefox recommended).</p>
                  <p><strong>Loading:</strong> Check your internet connection. Try hard refresh (Ctrl+F5 on Windows, Cmd+Shift+R on Mac).</p>
                  <p><strong>Progress:</strong> Make sure you're logged in. Progress saves automatically after completing activities.</p>
                  <p><strong>Login:</strong> Reset your password using the "Forgot Password" link on the login page.</p>
                </div>
              </details>
            </div>

            {/* Account & Billing */}
            <div className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-green-500/10 border border-green-500/30 flex items-center justify-center mb-4">
                <CreditCard className="w-6 h-6 text-green-400" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-3">Account & Billing</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• How do I upgrade my plan?</li>
                <li>• Can I get a refund?</li>
                <li>• How do I update my email?</li>
                <li>• Is this a subscription?</li>
              </ul>
              <details className="mt-4 text-sm">
                <summary className="text-gold cursor-pointer hover:text-gold-light">View answers</summary>
                <div className="mt-3 space-y-3 text-text-secondary">
                  <p><strong>Upgrade:</strong> Go to <Link href="/pricing" className="text-gold hover:underline">Pricing</Link> and select Complete Seerah. You'll only pay the $30 difference.</p>
                  <p><strong>Refunds:</strong> We offer a 14-day money-back guarantee. Contact us below for a refund request.</p>
                  <p><strong>Email:</strong> Go to your account settings or contact us to update your email.</p>
                  <p><strong>Subscription:</strong> No! This is a one-time payment. Pay once, own it forever.</p>
                </div>
              </details>
            </div>

            {/* Course Content */}
            <div className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center mb-4">
                <Download className="w-6 h-6 text-purple-400" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-3">Course Content</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• What's included in my plan?</li>
                <li>• Can I access on mobile?</li>
                <li>• Are transcripts available?</li>
                <li>• Can I share my account?</li>
              </ul>
              <details className="mt-4 text-sm">
                <summary className="text-gold cursor-pointer hover:text-gold-light">View answers</summary>
                <div className="mt-3 space-y-3 text-text-secondary">
                  <p><strong>Essentials:</strong> 56 core lessons with videos and quizzes.</p>
                  <p><strong>Complete:</strong> All 100 parts + slides, briefings, mind maps, flashcards, infographics.</p>
                  <p><strong>Mobile:</strong> Yes! Access on any device via web browser.</p>
                  <p><strong>Transcripts:</strong> Written briefings are available for every lesson.</p>
                  <p><strong>Sharing:</strong> Each account is for individual use. Family/group licenses available on request.</p>
                </div>
              </details>
            </div>

            {/* Progress & Completion */}
            <div className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-4">
                <RefreshCcw className="w-6 h-6 text-amber-400" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-3">Progress & Completion</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• How do I track my progress?</li>
                <li>• Can I reset progress?</li>
                <li>• What counts as completion?</li>
                <li>• Do I get a certificate?</li>
              </ul>
              <details className="mt-4 text-sm">
                <summary className="text-gold cursor-pointer hover:text-gold-light">View answers</summary>
                <div className="mt-3 space-y-3 text-text-secondary">
                  <p><strong>Tracking:</strong> Your dashboard shows overall progress and chapter-by-chapter completion.</p>
                  <p><strong>Reset:</strong> Contact us if you need to reset your progress.</p>
                  <p><strong>Essentials:</strong> Watch video + pass quiz = completed.</p>
                  <p><strong>Complete:</strong> Multiple tiers (Completed, Mastered, Fully Studied) based on activities.</p>
                  <p><strong>Certificate:</strong> Coming soon! We're working on official completion certificates.</p>
                </div>
              </details>
            </div>

            {/* Access & Permissions */}
            <div className="bg-surface border border-border rounded-xl p-6 hover:border-gold/30 transition-colors">
              <div className="w-12 h-12 rounded-lg bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-text mb-3">Access & Permissions</h3>
              <ul className="space-y-2 text-sm text-text-secondary">
                <li>• Why are some lessons locked?</li>
                <li>• How do I unlock more content?</li>
                <li>• Can I skip ahead?</li>
                <li>• Lifetime access details</li>
              </ul>
              <details className="mt-4 text-sm">
                <summary className="text-gold cursor-pointer hover:text-gold-light">View answers</summary>
                <div className="mt-3 space-y-3 text-text-secondary">
                  <p><strong>Progress Lock:</strong> Some lessons unlock after completing the previous one (sequential learning).</p>
                  <p><strong>Plan Lock:</strong> Content not in your plan requires upgrading to Complete Seerah.</p>
                  <p><strong>Skip Ahead:</strong> Sequential unlocking ensures proper understanding. Contact us if you need special access.</p>
                  <p><strong>Lifetime:</strong> Pay once, access forever. All future updates included at no extra cost.</p>
                </div>
              </details>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Form */}
      <ContactForm />

      <Footer />
    </div>
  );
}

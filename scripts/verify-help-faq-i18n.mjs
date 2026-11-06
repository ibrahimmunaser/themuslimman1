// Verifies that every English FAQ / ContactSupportForm phrase key used on the
// Help page exists in all 12 non-ar/fr/en shell phrase packs.
// Run with: node scripts/verify-help-faq-i18n.mjs
import fs from "fs";
import path from "path";

const dir = "data/i18n/shell";
const langs = ["id", "ms", "zh", "ru", "sw", "es", "de", "tr", "hi", "ur", "bn", "fa"];

const FAQ_KEYS = [
  "Getting Started",
  "Account & Billing",
  "Course Access",
  "Certificate",
  "How do I access my course?",
  "After purchasing, you can access your course from the Dashboard or My Courses page. Simply click on the course card to start learning.",
  "What does Complete Seerah Early Access include?",
  "You get the full 100-part Seerah journey: video lessons, briefings, quizzes, flashcards, mind maps, visual resources, study guides, reports, and guided progress tracking. Full access from day one.",
  "How are lessons structured?",
  "Each part includes a video lesson, briefing, study guide, flashcards, quiz, mind map, slides, infographics, and reports — everything you need to learn, review, and retain each part.",
  "What payment options are available?",
  "What's your refund policy?",
  "We offer a 7-Day Clarity Guarantee. If the course isn't what you expected, email us within 7 days for a full refund.",
  "Can I access parts in any order?",
  "Yes — all 100 parts are immediately accessible once your plan is active. You can jump to any lesson at any time. The parts are numbered to help you follow the Seerah chronologically, but there are no locks or requirements between lessons.",
  "Can I access lessons on mobile?",
  "Yes. The course is fully responsive and works on all devices including phones and tablets.",
  "How do I earn a certificate?",
  "Complete all required lessons in your plan. Complete users must also pass all quizzes with at least 70%. Your certificate will then be available in the Certificate section.",
  "Is the certificate official?",
  "Yes, it's an official certificate of completion from The Muslim Man showing you've completed Complete Seerah.",
  "Lifetime access is",
  "one-time — permanent access with no recurring charges. Pay once and keep the full course forever.",
];

const CONTACT_FORM_KEYS = [
  "Please fill in all fields",
  "Failed to send message",
  "Failed to send message. Please try again.",
  "Message Sent!",
  "We've received your message and will get back to you as soon as possible.",
  "Need More Help?",
  "Can't find what you're looking for? Our support team is here to help.",
  "Subject",
  "What do you need help with?",
  "Message",
  "Describe your issue or question...",
  "Sending...",
  "Send Message",
];

const ALL_KEYS = [...FAQ_KEYS, ...CONTACT_FORM_KEYS];

let ok = true;
for (const lang of langs) {
  const filePath = path.join(dir, `${lang}.json`);
  const data = JSON.parse(fs.readFileSync(filePath, "utf8"));
  const phrases = data.phrases || {};
  const missing = ALL_KEYS.filter((k) => !(k in phrases) || !String(phrases[k]).trim());
  if (missing.length) {
    ok = false;
    console.log(`❌ ${lang}: missing/empty ${missing.length}/${ALL_KEYS.length} key(s):`);
    for (const m of missing) console.log(`   - ${JSON.stringify(m)}`);
  } else {
    console.log(`✅ ${lang}: all ${ALL_KEYS.length} keys present (${FAQ_KEYS.length} FAQ + ${CONTACT_FORM_KEYS.length} contact form)`);
  }
}

console.log(ok ? "\nAll 12 shell packs contain every required key." : "\nSome packs are missing keys — see above.");
process.exit(ok ? 0 : 1);

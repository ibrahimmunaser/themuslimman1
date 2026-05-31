import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import { Toaster } from "sonner";
import { Analytics } from "@vercel/analytics/next";
import Script from "next/script";
import { ServiceWorkerRegistration } from "@/components/service-worker";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
  display: "swap",
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export const metadata: Metadata = {
  title: {
    default: "Complete Seerah System — TheMuslimMan",
    template: "%s | TheMuslimMan",
  },
  description:
    "Finally understand the full life of the Prophet ﷺ in one structured, complete system. 100+ parts with video, audio, briefings, guides, and more.",
  keywords: ["Seerah", "Prophet Muhammad", "Islamic learning", "Muslim education", "Seerah course"],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "https://themuslimman.com",
    siteName: "TheMuslimMan",
    title: "Complete Seerah System — TheMuslimMan",
    description:
      "Finally understand the full life of the Prophet ﷺ in one structured, complete system.",
  },
  twitter: {
    card: "summary_large_image",
    title: "Complete Seerah System — TheMuslimMan",
    description:
      "Finally understand the full life of the Prophet ﷺ in one structured, complete system.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${geist.variable} h-full`} data-scroll-behavior="smooth" suppressHydrationWarning>
      <head>
        <link rel="icon" type="image/png" href="/images/logodashboard.png?v=7" />
        <link rel="shortcut icon" type="image/png" href="/images/logodashboard.png?v=7" />
        <link rel="apple-touch-icon" type="image/png" href="/images/logodashboard.png?v=7" />
      </head>
      <body className="min-h-full bg-ink text-text antialiased">
        <ServiceWorkerRegistration />
        {children}
        <Toaster
          position="bottom-center"
          richColors
          theme="dark"
          toastOptions={{
            style: { marginBottom: "env(safe-area-inset-bottom, 0px)" },
          }}
        />
        <Analytics />
        <Script id="meta-pixel" strategy="afterInteractive">{`
          !function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
          n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
          n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
          t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}
          (window,document,'script','https://connect.facebook.net/en_US/fbevents.js');
          fbq('init', '859003573915526');
          fbq('track', 'PageView');
        `}</Script>
        <noscript>
          <img height="1" width="1" style={{display:"none"}} src="https://www.facebook.com/tr?id=859003573915526&ev=PageView&noscript=1" alt="" />
        </noscript>
      </body>
    </html>
  );
}

import React from "react";
import Header from "../../components/Header";

const features = [
  {
    title: "Go live in seconds",
    description:
      "No complex setup or configuration. Click one button and start streaming to your audience. Built for creators who want to focus on content, not tech.",
    icon: "▶",
  },
  {
    title: "Low-latency streaming",
    description:
      "Sub-second delay between you and your viewers. Perfect for live Q&A, gaming, tutorials, and interactive sessions.",
    icon: "⚡",
  },
  {
    title: "Multi-platform reach",
    description:
      "Stream to YouTube, Twitch, or your own server simultaneously. One stream, everywhere your audience is.",
    icon: "📡",
  },
  {
    title: "Overlays & alerts",
    description:
      "Add overlays, alerts, and branded elements to make your stream stand out. Keep viewers engaged with custom graphics.",
    icon: "✨",
  },
];

const faqs = [
  {
    q: "What do I need to start streaming?",
    a: "Just a computer, a stable internet connection, and our app. We handle encoding, bitrate optimization, and platform integration for you.",
  },
  {
    q: "Which platforms can I stream to?",
    a: "We support YouTube Live, Twitch, and custom RTMP destinations. You can stream to multiple platforms at once.",
  },
  {
    q: "Is there a free tier?",
    a: "Yes. You can start streaming for free with our basic plan. Upgrade when you need more features or higher quality.",
  },
];

function Landing() {
  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 antialiased">
      {/* Subtle gradient background */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950/30 pointer-events-none -z-10" />
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500/10 via-transparent to-transparent pointer-events-none -z-10" />

      <Header />

      {/* Hero */}
      <section className="relative max-w-6xl mx-auto px-6 pt-20 pb-32">
        <div className="max-w-3xl">
          <p className="text-indigo-400 font-medium text-sm tracking-wide uppercase mb-4">
            Live streaming, simplified
          </p>
          <h1 className="text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] mb-6">
            Go live to your audience in{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400">
              seconds
            </span>
          </h1>
          <p className="text-xl text-slate-400 leading-relaxed mb-10">
            Professional streaming without the complexity. Low latency, multi-platform, and built for creators who want to focus on what matters — their content.
          </p>
          <div className="flex flex-wrap gap-4">
            <button className="px-8 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors flex items-center gap-2">
              <span>▶</span>
              Start Streaming
            </button>
            <button className="px-8 py-4 border border-slate-600 hover:border-slate-500 text-slate-300 hover:text-white font-medium rounded-xl transition-colors">
              Watch demo
            </button>
          </div>
        </div>

      </section>

      {/* Features */}
      <section id="features" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-4">Everything you need to stream</h2>
        <p className="text-slate-400 text-lg mb-16 max-w-2xl">
          Built for creators. No fluff, no bloat — just the tools that make streaming smooth and professional.
        </p>
        <ul className="grid md:grid-cols-2 gap-8">
          {features.map((feature, i) => (
            <li
              key={i}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/30 hover:border-slate-700 transition-colors"
            >
              <div className="w-12 h-12 rounded-lg bg-slate-800 flex items-center justify-center text-2xl mb-4">
                {feature.icon}
              </div>
              <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
              <p className="text-slate-400 leading-relaxed">{feature.description}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* CTA block */}
      <section className="max-w-6xl mx-auto px-6 py-24">
        <div className="rounded-2xl border border-slate-800 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 p-12 md:p-16 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to go live?</h2>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Join creators who stream with Vento. No credit card required to get started.
          </p>
          <button className="px-10 py-4 bg-indigo-500 hover:bg-indigo-400 text-white font-semibold rounded-xl transition-colors">
            Start Streaming — It&apos;s Free
          </button>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="max-w-6xl mx-auto px-6 py-24 scroll-mt-20">
        <h2 className="text-3xl font-bold mb-4">Frequently asked questions</h2>
        <p className="text-slate-400 mb-12">Quick answers to common questions.</p>
        <dl className="space-y-6">
          {faqs.map((faq, i) => (
            <div
              key={i}
              className="p-6 rounded-xl border border-slate-800 bg-slate-900/30"
            >
              <dt className="font-semibold text-lg mb-2">{faq.q}</dt>
              <dd className="text-slate-400 leading-relaxed">{faq.a}</dd>
            </div>
          ))}
        </dl>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-sm">
              V
            </div>
            <span className="font-medium">Vento</span>
          </div>
          <div className="flex gap-8 text-sm text-slate-400">
            <a href="#" className="hover:text-white transition-colors">
              Privacy
            </a>
            <a href="#" className="hover:text-white transition-colors">
              Terms
            </a>
          </div>
        </div>
      </footer>
    </main>
  );
}

export default Landing;

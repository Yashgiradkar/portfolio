import React from "react";
import { motion } from "framer-motion";

/* ─── Data ──────────────────────────────────────────────────────── */

const problemsSolved = [
  {
    problem: "Agents hallucinate on company-specific knowledge",
    solution: "Grounded RAG answers strictly from your knowledge base — not LLM guesses.",
    icon: "🎯",
  },
  {
    problem: "Customers abandon when bots fail",
    solution: "Confidence-aware handoff routes complex queries to human agents instantly.",
    icon: "🤝",
  },
  {
    problem: "Support tickets pile up after hours",
    solution: "Autonomous AI resolves & auto-closes tickets 24/7 without human intervention.",
    icon: "⚡",
  },
  {
    problem: "Every SaaS customer needs a unique setup",
    solution: "Multi-tenant architecture isolates data, billing, and AI config per organization.",
    icon: "🏢",
  },
];

const coreCapabilities = [
  { icon: "🤖", name: "Real-Time AI Chat", value: "Convex Agents — persistent, stateful conversations" },
  { icon: "📚", name: "RAG Knowledge Base", value: "Embeddings + semantic reranking, zero hallucinations" },
  { icon: "🎙️", name: "Voice Support", value: "VAPI + WebRTC, sub-300ms bi-directional audio" },
  { icon: "🤝", name: "Human Handoff", value: "AI-triggered, zero context loss, live dashboard" },
  { icon: "🔑", name: "BYOK Security", value: "AWS Secrets Manager — no plaintext in DB, ever" },
  { icon: "🛠️", name: "Embeddable Widget", value: "< 5 KB script tag, deploy on any site in minutes" },
  { icon: "📈", name: "Operator Dashboard", value: "Live conversation monitoring & escalation control" },
  { icon: "🔐", name: "Auth + Teams", value: "Clerk SSO, RBAC, org management out of the box" },
  { icon: "💳", name: "Usage Billing", value: "Metered plans, seat limits, auto-sync via Clerk" },
  { icon: "🧠", name: "Multi-Model AI", value: "OpenAI, Anthropic, xAI Grok — swap without re-architecture" },
  { icon: "🧰", name: "Developer Toolkit", value: "Documented embed API for third-party integration" },
  { icon: "📊", name: "Observability", value: "Sentry tracing — LLM timeouts & fallbacks caught proactively" },
];

const stackPills = [
  "Next.js 15", "React 19", "Tailwind v4", "Convex", "VAPI",
  "AWS Secrets Manager", "Clerk", "shadcn/ui", "Turborepo", "Sentry",
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  show: (i = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.38, delay: i * 0.07 },
  }),
};

/* ─── Component ─────────────────────────────────────────────────── */

const AivonFlagship = () => {
  return (
    <div className='w-full space-y-12'>

      {/* ── 1. HERO ─────────────────────────────────────────────── */}
      <div className='space-y-5'>
        {/* Badges */}
        <div className='inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-gradient-to-r from-[#915EFF]/20 to-[#7945eb]/10 border border-[#915EFF]/50'>
          <span className='w-3.5 h-3.5 rounded-full bg-[#915EFF]' />
          <span className='text-[#dfd9ff] font-mono text-[11px] font-bold uppercase tracking-[0.15em]'>
            The AI Customer Support Platform
          </span>
        </div>

        {/* Headline */}
        <div>
          <h2 className='text-white font-black text-[28px] sm:text-[38px] lg:text-[44px] leading-[1.15] tracking-tight'>
            Turn your company's knowledge into{" "}
            <span className='text-transparent bg-clip-text bg-gradient-to-r from-[#915EFF] via-[#b395ff] to-white'>
              instant customer answers.
            </span>
          </h2>
          <p className='mt-3 text-secondary text-[15px] sm:text-[16px] max-w-2xl leading-relaxed'>
            <strong className='text-white'>Aivon</strong> is a production-grade, multi-tenant AI support platform that
            handles real customer conversations — with grounded AI, voice, and seamless human backup.
            Built for SaaS teams that can't afford hallucinations or downtime.
          </p>
        </div>

        {/* CTA Strip */}
        <div className='flex flex-col sm:flex-row items-start sm:items-center gap-3 p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-[#915EFF]/20 via-tertiary to-black-100 border border-[#915EFF]/30'>
          <div className='flex-1 space-y-0.5'>
            <p className='text-white font-semibold text-sm'>See it live in production</p>
            <p className='text-secondary text-xs font-mono'>aivon-dashboard.vercel.app</p>
          </div>
          <a
            href='https://aivon-dashboard.vercel.app/'
            target='_blank'
            rel='noopener noreferrer'
            className='bg-gradient-to-r from-[#915EFF] to-[#7945eb] hover:opacity-90 text-white font-bold text-sm px-5 py-2.5 rounded-xl shadow-lg shadow-[#915EFF]/25 flex items-center gap-2 transition-all active:scale-95 flex-shrink-0'
          >
            Launch Dashboard ↗
          </a>
        </div>
      </div>

      {/* ── 2. PROBLEMS SOLVED ──────────────────────────────────── */}
      <div className='space-y-4'>
        <p className='text-xs font-mono font-bold text-[#915EFF] uppercase tracking-widest'>
          Problems It Solves
        </p>
        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
          {problemsSolved.map((item, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial='hidden'
              whileInView='show'
              custom={i}
              viewport={{ once: true }}
              className='p-4 rounded-xl bg-tertiary/70 border border-white/[0.08] hover:border-[#915EFF]/40 transition-all group'
            >
              <div className='flex items-start gap-3'>
                <span className='text-xl flex-shrink-0 mt-0.5'>{item.icon}</span>
                <div className='space-y-1'>
                  <p className='text-secondary text-[11.5px] line-through decoration-white/25 leading-snug'>
                    {item.problem}
                  </p>
                  <p className='text-white font-semibold text-[13.5px] leading-snug group-hover:text-[#dfd9ff] transition-colors'>
                    {item.solution}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 3. CORE CAPABILITIES ────────────────────────────────── */}
      <div className='space-y-4'>
        <div className='flex items-center justify-between'>
          <p className='text-xs font-mono font-bold text-[#915EFF] uppercase tracking-widest'>
            What's Inside
          </p>
        </div>

        <div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5'>
          {coreCapabilities.map((cap, i) => (
            <motion.div
              key={i}
              variants={fadeUp}
              initial='hidden'
              whileInView='show'
              custom={i * 0.4}
              viewport={{ once: true }}
              className='flex items-center gap-3 p-3.5 rounded-xl bg-black-100/80 border border-white/[0.06] hover:border-[#915EFF]/35 transition-all group cursor-default'
            >
              <span className='text-base w-8 h-8 flex items-center justify-center rounded-lg bg-tertiary border border-white/10 flex-shrink-0'>
                {cap.icon}
              </span>
              <div className='min-w-0'>
                <p className='text-white font-semibold text-[12.5px] group-hover:text-[#dfd9ff] transition-colors leading-tight'>
                  {cap.name}
                </p>
                <p className='text-secondary text-[11px] leading-snug mt-0.5'>
                  {cap.value}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* ── 4. STACK PILLS ──────────────────────────────────────── */}
      <div className='flex flex-col sm:flex-row sm:items-center gap-3 pt-4 border-t border-white/[0.08]'>
        <p className='text-[11px] font-mono text-secondary uppercase tracking-widest flex-shrink-0'>
          Built with
        </p>
        <div className='flex flex-wrap gap-2'>
          {stackPills.map((tech) => (
            <span
              key={tech}
              className='px-2.5 py-1 text-[11px] font-mono rounded-lg bg-tertiary/60 border border-white/10 text-secondary hover:text-white hover:border-[#915EFF]/40 transition-colors cursor-default'
            >
              {tech}
            </span>
          ))}
        </div>
      </div>

    </div>
  );
};

export default AivonFlagship;

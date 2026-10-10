"use client";
import { motion, type Variants } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { ArrowUpRight, Check, ArrowLeftRight, Repeat2, Shield, Zap } from "lucide-react";
import { useWallet } from "@/context/WalletContext";

const fade = (delay = 0): Variants => ({
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.55, delay } },
});

// Geometric shape components inspired by ZetaChain-style decorations
const Geo = {
  Circle: ({ className }: { className: string }) => (
    <div className={`rounded-full ${className}`} />
  ),
  Square: ({ className }: { className: string }) => (
    <div className={`${className}`} />
  ),
  Ring: ({ className }: { className: string }) => (
    <div className={`rounded-full border-[3px] ${className}`} />
  ),
  Dot: ({ className }: { className: string }) => (
    <div className={`rounded-full ${className}`} />
  ),
  Triangle: ({ className, color }: { className: string; color: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <polygon points="12,2 22,22 2,22" fill={color} />
    </svg>
  ),
  Diamond: ({ className, color }: { className: string; color: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <polygon points="12,1 23,12 12,23 1,12" fill={color} />
    </svg>
  ),
  Plus: ({ className, color }: { className: string; color: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <rect x="10" y="0" width="4" height="24" fill={color} />
      <rect x="0" y="10" width="24" height="4" fill={color} />
    </svg>
  ),
};

export default function LandingPage() {
  const { connectWallet, isConnected, walletAddress } = useWallet();
  return (
    <div className="min-h-screen bg-[#F5F6F8] text-[#1C1C1E] relative overflow-hidden">

      {/* ── Decorative geometry layer ── */}
      {/* Top-left cluster */}
      <Geo.Circle className="absolute top-10 left-6 w-14 h-14 bg-[#6D5DF6] opacity-80" />
      <Geo.Circle className="absolute top-10 left-16 w-14 h-14 bg-[#FF6B6B] opacity-80 -translate-x-4" />
      <Geo.Dot className="absolute top-8 left-36 w-2 h-2 bg-[#4DA3FF] opacity-70" />
      <Geo.Plus color="#6D5DF6" className="absolute top-24 left-40 w-5 h-5 opacity-40" />

      {/* Top-right cluster */}
      <Geo.Diamond color="#4DA3FF" className="absolute top-16 right-24 w-8 h-8 opacity-60" />
      <Geo.Triangle color="#FFB347" className="absolute top-8 right-12 w-6 h-6 opacity-70" />
      <Geo.Circle className="absolute top-20 right-10 w-5 h-5 bg-[#34D399] opacity-60" />
      <Geo.Dot className="absolute top-36 right-32 w-3 h-3 bg-[#FF6B6B] opacity-60" />
      <Geo.Ring className="absolute top-4 right-40 w-10 h-10 border-[#6D5DF6] opacity-30" />

      {/* Mid-left */}
      <Geo.Triangle color="#34D399" className="absolute top-1/3 left-4 w-7 h-7 opacity-40" />
      <Geo.Dot className="absolute top-1/2 left-10 w-2.5 h-2.5 bg-[#FFB347] opacity-50" />
      <Geo.Ring className="absolute top-[45%] left-20 w-14 h-14 border-[#4DA3FF] opacity-20" />

      {/* Mid-right */}
      <Geo.Circle className="absolute top-[38%] right-6 w-4 h-4 bg-[#6D5DF6] opacity-40" />
      <Geo.Diamond color="#34D399" className="absolute top-[50%] right-16 w-6 h-6 opacity-30" />
      <Geo.Plus color="#FF6B6B" className="absolute top-[42%] right-32 w-5 h-5 opacity-30" />

      {/* Bottom cluster */}
      <Geo.Circle className="absolute bottom-32 left-8 w-10 h-10 bg-[#FFB347] opacity-50" />
      <Geo.Triangle color="#6D5DF6" className="absolute bottom-20 left-24 w-8 h-8 opacity-40" />
      <Geo.Dot className="absolute bottom-40 right-8 w-3 h-3 bg-[#34D399] opacity-60" />
      <Geo.Diamond color="#FF6B6B" className="absolute bottom-24 right-20 w-7 h-7 opacity-40" />
      <Geo.Ring className="absolute bottom-12 right-40 w-12 h-12 border-[#FFB347] opacity-25" />
      <Geo.Plus color="#4DA3FF" className="absolute bottom-48 left-40 w-4 h-4 opacity-35" />

      {/* ── Header ── */}
      <header className="relative z-10 mx-auto max-w-6xl px-6 pt-10 pb-4 flex items-center justify-between">
        <div className="flex flex-col gap-1.5">
          <div className="inline-flex w-fit items-center gap-1.5 rounded-full border border-[#DEDAFF] bg-[#F0EEFF] px-3 py-1">
            <span className="h-1.5 w-1.5 rounded-full bg-[#6D5DF6]" />
            <span className="text-[11px] font-semibold tracking-wide text-[#6D5DF6] uppercase">Powered by Arc</span>
          </div>
          <Image
            src="/branding/settlex-website-header-black.png"
            alt="Settle Exchange"
            width={160}
            height={32}
            className="h-8 w-auto object-contain"
            priority
            unoptimized
          />
        </div>
        {isConnected ? (
          <Link
            href="/contacts"
            className="rounded-full bg-[#1C1C1E] px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#374151] transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">{walletAddress ? `${walletAddress.slice(0,6)}…${walletAddress.slice(-4)}` : 'Open App'}</span>
            <span className="sm:hidden">App</span>
            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </Link>
        ) : (
          <button
            onClick={() => connectWallet()}
            className="rounded-full bg-[#6D5DF6] px-3 py-1.5 sm:px-5 sm:py-2.5 text-xs sm:text-sm font-semibold text-white hover:bg-[#5a4de0] transition-colors flex items-center gap-1"
          >
            <span className="hidden sm:inline">Connect Wallet</span>
            <span className="sm:hidden">Connect</span>
            <ArrowUpRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
          </button>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 pt-16 pb-8">
        <div className="flex flex-col lg:flex-row items-center gap-12">

          {/* Left: copy */}
          <div className="flex-1 max-w-xl">
            <motion.div initial="hidden" animate="visible" variants={fade(0)}>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 mb-6 shadow-sm">
                <span className="h-2 w-2 rounded-full bg-[#34D399]" />
                <span className="text-xs font-medium text-[#6B7280]">Live on Arc Mainnet</span>
              </div>
            </motion.div>

            <motion.h1
              initial="hidden" animate="visible" variants={fade(0.08)}
              className="text-5xl md:text-6xl font-bold leading-[1.05] tracking-[-0.03em] text-[#1C1C1E] mb-6"
            >
              Send USDC to&nbsp;people,<br />
              <span className="text-[#6D5DF6]">not addresses.</span>
            </motion.h1>

            <motion.p
              initial="hidden" animate="visible" variants={fade(0.16)}
              className="text-lg text-[#6B7280] leading-relaxed mb-8 max-w-md"
            >
              Settle Exchange turns wallet addresses into reusable contacts.
              Save once, send anytime — to any wallet, on any supported chain.
            </motion.p>

            <motion.div
              initial="hidden" animate="visible" variants={fade(0.22)}
              className="flex items-center gap-3 flex-wrap"
            >
              <Link
                href="/contacts"
                className="rounded-full bg-[#1C1C1E] px-7 py-3.5 font-semibold text-white shadow-[0_8px_24px_rgba(0,0,0,0.18)] hover:bg-[#333] transition-all flex items-center gap-2"
              >
                Launch App <ArrowUpRight className="h-4 w-4" />
              </Link>
              <a
                href="https://github.com/Skillfulworld/settlex"
                target="_blank"
                rel="noreferrer"
                className="rounded-full border border-[#E5E7EB] bg-white px-7 py-3.5 font-semibold text-[#1C1C1E] hover:bg-[#F5F6F8] transition-all"
              >
                GitHub
              </a>
            </motion.div>

            {/* Quick stats */}
            <motion.div
              initial="hidden" animate="visible" variants={fade(0.3)}
              className="mt-10 flex items-center gap-6 flex-wrap"
            >
              {[
                { label: 'Arc Mainnet', dot: '#6D5DF6' },
                { label: 'USDC Native Gas', dot: '#34D399' },
                { label: 'CCTP Bridge', dot: '#4DA3FF' },
                { label: 'On-chain Points', dot: '#FFB347' },
              ].map(({ label, dot }) => (
                <div key={label} className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: dot }} />
                  <span className="text-xs font-medium text-[#6B7280]">{label}</span>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Right: phone mockup */}
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="relative flex-shrink-0"
          >
            {/* Geometric accents around phone */}
            <Geo.Circle className="absolute -top-6 -left-6 w-10 h-10 bg-[#6D5DF6] opacity-70 z-10" />
            <Geo.Circle className="absolute -top-6 -left-2 w-10 h-10 bg-[#FF6B6B] opacity-70 z-10" />
            <Geo.Diamond color="#FFB347" className="absolute -bottom-4 -right-4 w-8 h-8 opacity-60 z-10" />
            <Geo.Ring className="absolute -bottom-8 -left-8 w-16 h-16 border-[#4DA3FF] opacity-40 z-10" />
            <Geo.Plus color="#34D399" className="absolute top-1/2 -right-8 w-6 h-6 opacity-50 z-10" />
            <Geo.Dot className="absolute top-12 -right-4 w-3 h-3 bg-[#6D5DF6] opacity-60 z-10" />

            {/* Phone frame */}
            <div className="w-[260px] h-[520px] rounded-[44px] border-[7px] border-[#1C1C1E] bg-white shadow-[0_32px_80px_rgba(0,0,0,0.18)] overflow-hidden relative">
              {/* Notch */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-7 bg-[#1C1C1E] rounded-b-2xl z-10" />

              {/* App header */}
              <div className="bg-[#16334F] px-4 pt-10 pb-3 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 rounded bg-[#6D5DF6]/30 flex items-center justify-center">
                    <span className="text-[8px] font-bold text-white">S</span>
                  </div>
                  <span className="text-[11px] font-bold text-white">Settle Exchange</span>
                </div>
                <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-2 py-1">
                  <div className="w-4 h-4 rounded-full bg-[#EDEBFF] flex items-center justify-center">
                    <span className="text-[6px] text-[#6D5DF6] font-bold">W</span>
                  </div>
                  <span className="text-[9px] text-white/80">0xc5c6...dfd8</span>
                </div>
              </div>

              {/* Balance card */}
              <div className="mx-3 mt-3 rounded-2xl bg-gradient-to-br from-[#6D5DF6] to-[#8a7ef9] p-4 text-white shadow-lg">
                <div className="text-[9px] opacity-70 font-medium uppercase tracking-wide mb-1">USDC Balance</div>
                <div className="text-2xl font-bold">5.45 USDC</div>
                <div className="text-[9px] mt-1.5 opacity-60">Arc Mainnet · 0.01 USDC gas</div>
              </div>

              {/* Quick actions */}
              <div className="flex justify-around px-4 mt-3">
                {[
                  { icon: ArrowUpRight, label: 'Send', color: '#6D5DF6' },
                  { icon: Repeat2, label: 'Swap', color: '#4DA3FF' },
                  { icon: ArrowLeftRight, label: 'Bridge', color: '#34D399' },
                ].map(({ icon: Icon, label, color }) => (
                  <div key={label} className="flex flex-col items-center gap-1">
                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center" style={{ backgroundColor: color + '20' }}>
                      <Icon className="w-4 h-4" style={{ color }} />
                    </div>
                    <span className="text-[8px] font-medium text-[#6B7280]">{label}</span>
                  </div>
                ))}
              </div>

              {/* Contacts list */}
              <div className="px-3 mt-3">
                <div className="text-[9px] font-semibold text-[#6B7280] uppercase tracking-wide mb-1.5 px-1">Recent Contacts</div>
                {[
                  { name: 'Alice', addr: '0xAb3...1f2', color: '#6D5DF6' },
                  { name: 'Bob', addr: '0x9c1...4e7', color: '#4DA3FF' },
                  { name: 'Carol', addr: '0xFe2...8a3', color: '#34D399' },
                ].map(({ name, addr, color }) => (
                  <div key={name} className="flex items-center gap-2 p-2 rounded-xl hover:bg-gray-50 mb-1">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ backgroundColor: color }}>
                      {name[0]}
                    </div>
                    <div className="flex-1">
                      <div className="text-[10px] font-semibold text-[#1C1C1E]">{name}</div>
                      <div className="text-[8px] text-[#6B7280]">{addr}</div>
                    </div>
                    <ArrowUpRight className="w-3 h-3 text-[#6B7280]" />
                  </div>
                ))}
              </div>

              {/* Bottom nav */}
              <div className="absolute bottom-0 left-0 right-0 flex justify-around items-center bg-[#1E293B] py-2 px-2">
                {[
                  { icon: '👤', label: 'Contacts' },
                  { icon: '↗', label: 'Send' },
                  { icon: '⇄', label: 'Swap' },
                  { icon: '⭐', label: 'Points' },
                  { icon: '⚙', label: 'Settings' },
                ].map(({ icon, label }) => (
                  <div key={label} className="flex flex-col items-center gap-0.5">
                    <span className="text-[10px]">{icon}</span>
                    <span className="text-[6px] text-[#94A3B8]">{label}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Feature grid ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-20">
        <motion.div
          initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade(0)}
          className="mb-12 text-center"
        >
          <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-[#6D5DF6] mb-3">Everything in one place</p>
          <h2 className="text-4xl font-bold tracking-tight text-[#1C1C1E]">Built for everyday USDC</h2>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[
            {
              icon: <ArrowUpRight className="h-5 w-5" />,
              color: '#6D5DF6',
              bg: '#EDEBFF',
              title: 'Send to Contacts',
              desc: 'Save wallet addresses as contacts. Choose a person, not an address. Send USDC to anyone with a wallet — no Settle Exchange account needed on the receiving end.',
              shape: <Geo.Circle className="absolute top-3 right-3 w-6 h-6 bg-[#6D5DF6] opacity-20" />,
            },
            {
              icon: <Repeat2 className="h-5 w-5" />,
              color: '#4DA3FF',
              bg: '#EAF4FF',
              title: 'Swap on Arc',
              desc: 'Trade supported assets directly on Arc Mainnet using Uniswap V3 — without leaving the app. Fees paid in USDC, no extra gas token required.',
              shape: <Geo.Diamond color="#4DA3FF" className="absolute top-3 right-3 w-6 h-6 opacity-20" />,
            },
            {
              icon: <ArrowLeftRight className="h-5 w-5" />,
              color: '#34D399',
              bg: '#ECFDF5',
              title: 'Bridge USDC',
              desc: 'Move USDC between Arc, Ethereum, Base, Arbitrum, Optimism, Polygon, and Avalanche via CCTP V2 fast transfer (~8–20 seconds).',
              shape: <Geo.Triangle color="#34D399" className="absolute top-3 right-3 w-6 h-6 opacity-20" />,
            },
            {
              icon: <Zap className="h-5 w-5" />,
              color: '#FFB347',
              bg: '#FFF7ED',
              title: 'On-chain Points',
              desc: 'Check in daily, build streaks, and earn points stored permanently on Arc.',
              shape: <Geo.Plus color="#FFB347" className="absolute top-3 right-3 w-6 h-6 opacity-20" />,
            },
            {
              icon: <Shield className="h-5 w-5" />,
              color: '#FF6B6B',
              bg: '#FFF0F0',
              title: 'Non-custodial',
              desc: 'Settle Exchange never holds your funds. Every transaction is signed by your own wallet. No accounts, no passwords, no custodians.',
              shape: <Geo.Ring className="absolute top-3 right-3 w-8 h-8 border-[#FF6B6B] opacity-20" />,
            },
            {
              icon: <Check className="h-5 w-5" />,
              color: '#1C1C1E',
              bg: '#F3F4F6',
              title: 'USDC is the gas',
              desc: 'On Arc, USDC is the native gas token. One asset pays for everything — no ETH, no MATIC, no separate gas management.',
              shape: <Geo.Dot className="absolute top-4 right-4 w-5 h-5 bg-[#1C1C1E] opacity-10" />,
            },
          ].map(({ icon, color, bg, title, desc, shape }, i) => (
            <motion.div
              key={title}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fade(i * 0.05)}
              className="relative rounded-3xl border border-[#E5E7EB] bg-white p-6 shadow-[0_4px_16px_rgba(0,0,0,0.05)] overflow-hidden hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all"
            >
              {shape}
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: bg, color }}>
                {icon}
              </div>
              <h3 className="text-base font-bold text-[#1C1C1E] mb-2">{title}</h3>
              <p className="text-sm text-[#6B7280] leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── Problem / Solution ── */}
      <section className="relative z-10 mx-auto max-w-6xl px-6 py-10">
        <div className="grid md:grid-cols-2 gap-5">
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade(0)}
            className="relative rounded-3xl border border-[#E5E7EB] bg-white p-8 overflow-hidden"
          >
            <Geo.Circle className="absolute top-0 right-0 w-24 h-24 bg-[#FF6B6B] opacity-10 translate-x-8 -translate-y-8" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#9CA3AF] mb-3">The Problem</p>
            <p className="text-2xl font-bold text-[#1C1C1E] mb-3 leading-tight">Wallet addresses are made for machines, not people.</p>
            <p className="text-[#6B7280] text-sm leading-relaxed">Every time you pay someone in crypto you copy a 42-character hex string. One typo and the money is gone. There is no undo.</p>
          </motion.div>
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fade(0.08)}
            className="relative rounded-3xl border border-[#DEDAFF] bg-[#F8F7FF] p-8 overflow-hidden"
          >
            <Geo.Circle className="absolute top-0 right-0 w-24 h-24 bg-[#6D5DF6] opacity-15 translate-x-8 -translate-y-8" />
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-[#6D5DF6] mb-3">The Solution</p>
            <p className="text-2xl font-bold text-[#1C1C1E] mb-3 leading-tight">Settle Exchange fixes that.</p>
            <p className="text-[#6B7280] text-sm leading-relaxed">Save a wallet address once, give it a name, and send to that person forever. A contact book for your on-chain life.</p>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="relative z-10 mt-20 border-t border-[#E5E7EB] bg-white">
        <div className="mx-auto max-w-6xl px-6 py-12 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex flex-col items-center md:items-start gap-3">
            <Image
              src="/branding/settlex-website-header-black.png"
              alt="Settle Exchange"
              width={140}
              height={28}
              className="h-7 w-auto object-contain"
              unoptimized
            />
            <p className="text-sm text-[#6B7280]">A USDC payment layer on Arc.</p>
          </div>

          <div className="flex flex-col items-center gap-4">
            <p className="text-xs text-[#9CA3AF] uppercase tracking-widest font-semibold">Built by</p>
            <a
              href="https://x.com/zkfenrir"
              target="_blank"
              rel="noreferrer"
              className="flex flex-col items-center gap-2 group"
            >
              <img
                src="https://unavatar.io/twitter/zkfenrir"
                alt="zkfenrir"
                className="w-12 h-12 rounded-full border-2 border-[#6D5DF6] group-hover:scale-105 transition-transform"
              />
              <span className="text-sm font-semibold text-[#1C1C1E] group-hover:text-[#6D5DF6] transition-colors">@zkfenrir</span>
            </a>
          </div>

          <div className="flex flex-col items-center md:items-end gap-2 text-sm">
            <a href="https://github.com/Skillfulworld/settlex" target="_blank" rel="noreferrer" className="text-[#6B7280] hover:text-[#1C1C1E] transition-colors">GitHub</a>
            <a href="https://www.arc.io/" target="_blank" rel="noreferrer" className="text-[#6B7280] hover:text-[#1C1C1E] transition-colors">Arc</a>
            <a href="https://docs.arc.io/" target="_blank" rel="noreferrer" className="text-[#6B7280] hover:text-[#1C1C1E] transition-colors">Arc Docs</a>
            <Link href="/contacts" className="text-[#6D5DF6] font-semibold hover:opacity-80 transition-colors">Launch App →</Link>
          </div>
        </div>
        <div className="border-t border-[#E5E7EB] py-4 text-center text-xs text-[#9CA3AF]">
          Settle Exchange is independent and not operated by Circle, Arc, or CCTP. Users are responsible for their own wallets and transactions.
        </div>
      </footer>
    </div>
  );
}

"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Code as GithubIcon, Check } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[var(--md-sys-color-background)] text-[var(--md-sys-color-on-background)]">
      {/* Hero */}
      <section className="container mx-auto flex flex-col items-center justify-center pt-24 pb-16 px-4 text-center">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-[#F3F4F6] px-3 py-1 mb-6">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#6D5DF6] to-[#D64545]"></span>
          <span className="text-xs font-medium text-[#6B7280]">Send USDC on Arc</span>
        </motion.div>
        <motion.h1 initial="hidden" animate="visible" variants={fadeIn} className="text-5xl md:text-7xl font-bold mb-6 tracking-tight max-w-3xl">
          Send USDC like a message to your contacts.
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeIn} className="text-xl text-[#6B7280] mb-10 max-w-lg">
          No signup required. Just a wallet address.
        </motion.p>
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="flex gap-4">
          <Link href="/contacts" className="rounded-full bg-gradient-to-r from-[#6D5DF6] to-[#D64545] px-8 py-4 font-semibold text-white shadow-lg hover:opacity-90 transition-all">
            Launch App
          </Link>
          <a href="https://github.com" target="_blank" rel="noreferrer" className="rounded-full border border-[#E5E7EB] bg-white px-8 py-4 font-semibold hover:bg-[#F9FAFB] transition-all flex items-center gap-2">
            <GithubIcon className="h-4 w-4" />
            GitHub
          </a>
        </motion.div>
      </section>

      {/* Phone Mockup Placeholder */}
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="flex justify-center px-4 mb-24">
        <div className="w-64 h-[500px] rounded-[40px] border-8 border-[#1C1C1E] bg-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 w-full h-8 bg-black rounded-b-2xl"></div>
          <div className="p-4 pt-12 text-sm">
            <div className="text-2xl font-bold mb-8">Contacts</div>
            <div className="space-y-4">
                <div className="h-16 rounded-2xl border border-[#E5E7EB] bg-white p-2 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-r from-[#6D5DF6] to-[#D64545]"></div>
                    <div className="w-20 h-4 bg-[#F3F4F6] rounded"></div>
                </div>
                <div className="h-16 rounded-2xl border border-[#E5E7EB] bg-white p-2 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-[#FF7A59]"></div>
                    <div className="w-20 h-4 bg-[#F3F4F6] rounded"></div>
                </div>
            </div>
          </div>
        </div>
      </motion.section>

      {/* Problem & Solution */}
      <section className="py-24 px-4 container mx-auto">
        <div className="grid md:grid-cols-2 gap-12">
            <div className="p-12 rounded-[32px] border border-[#E5E7EB] bg-white shadow-sm text-center">
                <h2 className="text-sm font-semibold text-[#6B7280] mb-2 uppercase tracking-widest">Problem</h2>
                <p className="text-3xl font-semibold mb-2">Most payment apps lock users in.</p>
                <p className="text-[#6B7280]">You can only send money to people already using the same app.</p>
            </div>
            <div className="p-12 rounded-[32px] border border-[#E5E7EB] bg-gradient-to-b from-[#EDEBFF] to-white shadow-sm text-center">
                <h2 className="text-sm font-semibold text-[#6D5DF6] mb-2 uppercase tracking-widest">Solution</h2>
                <p className="text-3xl font-semibold mb-2">ContactFi fixes that.</p>
                <p className="text-[#6B7280]">Send USDC to anyone with a wallet.</p>
            </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 container mx-auto">
        <div className="grid md:grid-cols-3 gap-8">
            {[
                { title: 'Save Contacts', desc: 'Never copy wallet addresses again.' },
                { title: 'One-Tap Send', desc: 'Choose a contact. Send instantly.' },
                { title: 'Mobile First', desc: 'Designed for everyday crypto payments.' }
            ].map((f, i) => (
                <div key={i} className="rounded-[28px] border border-[#E5E7EB] bg-white p-8 shadow-sm">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-r from-[#6D5DF6] to-[#D64545] text-white flex items-center justify-center mb-6">
                        <Check className="h-6 w-6" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">{f.title}</h3>
                    <p className="text-[#6B7280]">{f.desc}</p>
                </div>
            ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 text-center border-t border-[#E5E7EB]">
        <Link href="https://x.com/ZkFenrir1" target="_blank" className="flex flex-col items-center gap-3">
          <img src="https://unavatar.io/twitter/ZkFenrir1" alt="ZkFenrir1" className="w-12 h-12 rounded-full border-2 border-[#6D5DF6]" />
          <span className="font-medium">ZkFenrir1</span>
        </Link>
        <div className="mt-6">
            <Link href="https://github.com" target="_blank" className="text-[#6B7280] hover:text-[#1C1C1E]">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}

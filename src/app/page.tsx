"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";
import { Code as GithubIcon, Check, ArrowUpRight, Copy } from "lucide-react";

const fadeIn = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6 } },
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#F9FAFB] text-[var(--md-sys-color-on-background)] relative overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-blue-100 rounded-full blur-[200px] opacity-30"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[50%] bg-purple-100 rounded-full blur-[200px] opacity-30"></div>
        <div className="absolute bottom-[-10%] left-[20%] w-[40%] h-[40%] bg-pink-100 rounded-full blur-[200px] opacity-30"></div>
      
      {/* Header */}
      <header className="container mx-auto px-4 pt-12 pb-6 relative z-10">
        <div className="flex flex-col gap-2">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-[#EDEBFF] bg-[#F9F7FF] px-3 py-1">
              <span className="text-xs font-medium text-[#6D5DF6]">Powered by Arc</span>
            </div>
            <div className="w-[180px] h-[36px]">
                <Image src="/branding/settlex-website-header-black.svg" alt="SettleX" width={180} height={36} className="h-full w-auto object-contain" unoptimized />
            </div>
        </div>
      </header>

      {/* Hero */}
      <section className="container mx-auto flex flex-col items-center justify-center pt-16 pb-16 px-4 text-center relative z-10">
        <motion.div initial="hidden" animate="visible" variants={fadeIn} className="inline-flex items-center gap-2 rounded-full border border-[#E5E7EB] bg-white px-3 py-1 mb-6">
          <span className="h-2 w-2 rounded-full bg-gradient-to-r from-[#6D5DF6] to-[#D64545]"></span>
          <span className="text-xs font-medium text-[#6B7280]">Send USDC on Arc</span>
        </motion.div>
        <motion.h1 initial="hidden" animate="visible" variants={fadeIn} className="text-5xl md:text-7xl font-bold mb-6 tracking-tight max-w-3xl">
          Send USDC like a message to your contacts.
        </motion.h1>
        <motion.p initial="hidden" animate="visible" variants={fadeIn} className="text-xl text-[#6B7280] mb-10 max-w-lg">
          No signup. Just your contacts.
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
      <motion.section initial="hidden" animate="visible" variants={fadeIn} className="flex justify-center px-4 mb-24 relative z-10">
        <div className="w-64 h-[500px] rounded-[40px] border-8 border-[#1C1C1E] bg-white shadow-2xl overflow-hidden relative">
          <div className="absolute top-0 w-full h-8 bg-black rounded-b-2xl"></div>
          <div className="p-4 pt-12 text-sm space-y-4">
            <div className="bg-gradient-to-br from-[#6D5DF6] to-[#8a7ef9] p-4 rounded-3xl text-white shadow-lg">
                <div className="text-xs opacity-80">Total Balance</div>
                <div className="text-2xl font-bold">$1,240.50</div>
                <div className="text-xs mt-2 opacity-80 font-mono">0xc5c6...dfd8</div>
            </div>
            <div className="text-sm font-bold text-gray-500">Recent Transactions</div>
            <div className="space-y-2">
                <div className="bg-gray-50 p-2 flex items-center gap-3 border border-gray-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center font-bold text-blue-600">J</div>
                    <div className="flex-1 font-semibold text-xs">Jane Doe</div>
                    <ArrowUpRight className="w-4 h-4 text-red-500"/>
                </div>
                <div className="bg-gray-50 p-2 flex items-center gap-3 border border-gray-100 rounded-2xl">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center font-bold text-purple-600">A</div>
                    <div className="flex-1 font-semibold text-xs">Alice</div>
                    <Check className="w-4 h-4 text-green-500"/>
                </div>
            </div>
            <div className="absolute bottom-4 left-4 right-4 bg-[#6D5DF6] text-white p-3 rounded-2xl text-center font-bold text-sm">Send</div>
          </div>
        </div>
      </motion.section>

      {/* Problem & Solution */}
      <section className="py-24 px-4 container mx-auto relative z-10">
        <div className="grid md:grid-cols-2 gap-12">
            <div className="p-12 rounded-[32px] border border-[#E5E7EB] bg-gradient-to-b from-white to-[#EBF8FF] shadow-sm text-center">
                <h2 className="text-sm font-semibold text-[#6B7280] mb-2 uppercase tracking-widest">Problem</h2>
                <p className="text-3xl font-semibold mb-2">Most payment apps lock users in.</p>
                <p className="text-[#6B7280]">You can only send money to people already using the same app.</p>
            </div>
            <div className="p-12 rounded-[32px] border border-[#E5E7EB] bg-gradient-to-b from-white to-[#F3EBFF] shadow-sm text-center">
                <h2 className="text-sm font-semibold text-[#6D5DF6] mb-2 uppercase tracking-widest">Solution</h2>
                <p className="text-3xl font-semibold mb-2">Settle Exchange fixes that.</p>
                <p className="text-[#6B7280]">Send USDC to anyone with a wallet.</p>
            </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-4 container mx-auto relative z-10">
        <div className="grid md:grid-cols-3 gap-8">
            {[
                { title: 'Save Contacts', desc: 'Never copy wallet addresses again.' },
                { title: 'One-Tap Send', desc: 'Choose a contact. Send instantly.' },
                { title: 'Mobile First', desc: 'Designed for everyday crypto payments.' }
            ].map((f, i) => (
                <div key={i} className="rounded-[28px] border border-[#E5E7EB] bg-gradient-to-b from-white to-[#F5F3FF] p-8 shadow-sm">
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
      <footer className="py-12 text-center border-t border-[#E5E7EB] bg-gradient-to-b from-white to-[#FFF5F7] relative z-10">
        <div className='flex flex-col items-center gap-2 mb-4'>
            <span className='text-sm text-[#6B7280]'>Built by</span>
            <Link href="https://x.com/ZkFenrir1" target="_blank" className="flex flex-col items-center gap-3">
            <img src="https://unavatar.io/twitter/ZkFenrir1" alt="ZkFenrir1" className="w-12 h-12 rounded-full border-2 border-[#6D5DF6]" />
            <span className="font-medium">ZkFenrir1</span>
            </Link>
        </div>
        <div>
            <Link href="https://github.com" target="_blank" className="text-[#6B7280] hover:text-[#1C1C1E]">GitHub</Link>
        </div>
      </footer>
    </div>
  );
}

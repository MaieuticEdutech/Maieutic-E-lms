"use client";

import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff, ChevronDown, Check } from "lucide-react";

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState("Admin");
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const roles = ["Admin", "Instructor", "Student"];

  return (
    <div className="min-h-screen flex bg-white">
      {/* LEFT SIDE */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#f5f3ff] relative overflow-hidden items-center justify-center">
        <div className="absolute top-20 left-20 w-72 h-72 bg-purple-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-indigo-200/20 rounded-full blur-3xl" />

        <div className="absolute top-24 left-16 bg-white rounded-2xl shadow-lg p-5 w-44 z-10">
          <div className="text-sm text-gray-500 mb-1">Profit</div>
          <div className="text-xs text-gray-400 mb-3">Last Month</div>
          <svg width="120" height="50" viewBox="0 0 120 50">
            <polyline fill="none" stroke="#06b6d4" strokeWidth="2.5" points="0,40 20,30 40,35 60,20 80,28 100,15 120,8" />
            <circle cx="120" cy="8" r="4" fill="#06b6d4" />
          </svg>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold text-gray-900">624k</span>
            <span className="text-xs font-medium text-emerald-500">+8.24%</span>
          </div>
        </div>

        <div className="absolute top-1/2 right-16 bg-white rounded-2xl shadow-lg p-5 w-44 z-10">
          <div className="text-sm text-gray-500 mb-1">Order</div>
          <div className="text-xs text-gray-400 mb-3">Last week</div>
          <div className="flex items-end gap-1.5 h-10">
            {[40, 65, 25, 50, 35, 70, 55].map((h, i) => (
              <div key={i} className="flex-1 rounded-t-sm" style={{ height: `${h}%`, backgroundColor: i === 5 ? "#8b5cf6" : "#ddd6fe" }} />
            ))}
          </div>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-xl font-bold text-gray-900">124k</span>
            <span className="text-xs font-medium text-emerald-500">+12.6%</span>
          </div>
        </div>

        <div className="relative z-0">
          <div className="w-48 h-80 relative">
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-28 bg-[#f5d0b5] rounded-3xl">
              <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-26 h-16 bg-[#2d2d2d] rounded-t-3xl rounded-b-lg" />
              <div className="absolute top-14 left-5 w-3 h-3 bg-[#2d2d2d] rounded-full" />
              <div className="absolute top-14 right-5 w-3 h-3 bg-[#2d2d2d] rounded-full" />
              <div className="absolute top-20 left-1/2 -translate-x-1/2 w-6 h-2 bg-[#c98a7a] rounded-full" />
            </div>
            <div className="absolute top-26 left-1/2 -translate-x-1/2 w-8 h-6 bg-[#f5d0b5]" />
            <div className="absolute top-32 left-1/2 -translate-x-1/2 w-36 h-44 bg-[#7c3aed] rounded-2xl">
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-1 h-20 bg-[#6d28d9] opacity-30" />
            </div>
            <div className="absolute top-36 -left-4 w-10 h-32 bg-[#f5d0b5] rounded-full transform rotate-12" />
            <div className="absolute top-36 -right-4 w-10 h-32 bg-[#f5d0b5] rounded-full transform -rotate-12" />
            <div className="absolute top-52 -left-2 w-6 h-8 bg-[#374151] rounded-lg" />
            <div className="absolute top-72 left-1/2 -translate-x-1/2 w-32 h-40 bg-[#374151] rounded-t-xl">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1 h-full bg-[#2d2d2d] opacity-30" />
            </div>
            <div className="absolute bottom-0 left-4 w-12 h-6 bg-[#1f2937] rounded-full" />
            <div className="absolute bottom-0 right-4 w-12 h-6 bg-[#1f2937] rounded-full" />
          </div>
        </div>

        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 border-2 border-purple-200/40 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 border border-purple-200/20 rounded-full" />
      </div>

      {/* RIGHT SIDE */}
      <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-20">
        <div className="w-full max-w-md">
          <div className="flex items-center gap-2 mb-12">
            <div className="w-8 h-8 bg-[#8b5cf6] rounded-lg flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
            </div>
            <span className="text-2xl font-bold text-gray-800">LearnHub</span>
          </div>

          <div className="mb-8">
            <p className="text-xs font-semibold tracking-[0.25em] text-[#8b5cf6] uppercase mb-3">LearnHub Access</p>
            <h1 className="text-3xl font-semibold text-gray-900 mb-2">Sign in to your workspace</h1>
            <p className="text-gray-500 text-sm leading-relaxed">Use your tenant domain and role so LearnHub can send you to the right experience.</p>
          </div>

          <form className="space-y-5">
            {/* LOGIN AS DROPDOWN */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Login as</label>
              <div className="relative">
                <button type="button" onClick={() => setDropdownOpen(!dropdownOpen)}
                  className={`w-full flex items-center justify-between px-4 py-3 border rounded-xl text-left text-gray-900 bg-white transition ${dropdownOpen ? "border-[#8b5cf6] ring-2 ring-[#8b5cf6]/20" : "border-gray-200 hover:border-gray-300"}`}>
                  <span className="text-gray-700">{role}</span>
                  <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${dropdownOpen ? "rotate-180" : ""}`} />
                </button>
                {dropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setDropdownOpen(false)} />
                    <div className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-gray-100 rounded-xl shadow-xl z-20 overflow-hidden py-1">
                      {roles.map((r) => (
                        <button key={r} type="button" onClick={() => { setRole(r); setDropdownOpen(false); }}
                          className={`w-full flex items-center justify-between px-4 py-3 text-left text-sm transition ${role === r ? "bg-[#ede9fe] text-[#8b5cf6] font-medium" : "text-gray-700 hover:bg-gray-50"}`}>
                          {r}
                          {role === r && <Check className="w-4 h-4 text-[#8b5cf6]" />}
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Domain</label>
              <input type="text" placeholder="Enter your domain" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition" />
              <p className="text-xs text-gray-400 mt-1.5">Your LearnHub workspace name.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <input type="email" placeholder="Enter your email" className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
              <div className="relative">
                <input type={showPassword ? "text" : "password"} placeholder="Enter your password" className="w-full px-4 py-3 pr-12 border border-gray-200 rounded-xl text-sm outline-none focus:border-[#8b5cf6] focus:ring-2 focus:ring-[#8b5cf6]/20 transition" />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition">
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-[#8b5cf6] focus:ring-[#8b5cf6]" />
                <span className="text-sm text-gray-600">Remember me</span>
              </label>
              <Link href="#" className="text-sm text-[#8b5cf6] hover:text-[#7c3aed] font-medium">Forgot password?</Link>
            </div>

            <button type="submit" className="w-full bg-[#a78bfa] hover:bg-[#8b5cf6] text-white font-semibold py-3.5 rounded-xl transition-colors">Login</button>
          </form>
        </div>
      </div>
    </div>
  );
}
"use client";

import Sidebar from "@/components/Sidebar";
import { PlayCircle, Award, Clock } from "lucide-react";

export default function StudentDashboard() {
  const myCourses = [
    { title: "Python for Beginners", progress: 72, lastAccessed: "2 hours ago", color: "bg-blue-500" },
    { title: "Web Development", progress: 65, lastAccessed: "1 day ago", color: "bg-emerald-500" },
    { title: "Data Science Mastery", progress: 60, lastAccessed: "3 days ago", color: "bg-purple-500" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="student" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-gray-900">Hello, Rohit Sharma 👋</h1>
            <p className="text-gray-500 mt-1">Ready to continue your learning journey?</p>
          </div>

          <div className="bg-white rounded-xl p-6 shadow-sm border mb-8">
            <h2 className="text-lg font-semibold mb-4">Continue Learning</h2>
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600">
                <PlayCircle className="w-8 h-8" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Python for Beginners</h3>
                <p className="text-sm text-gray-500">Module 4: Loops</p>
                <div className="flex items-center gap-3 mt-2">
                  <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                    <div className="h-full bg-blue-500 rounded-full" style={{ width: "72%" }} />
                  </div>
                  <span className="text-xs text-gray-500">72% complete</span>
                </div>
              </div>
              <button className="px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700">Continue</button>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Overall Progress</h2>
              <div className="flex items-center justify-center py-4">
                <div className="relative w-32 h-32">
                  <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
                    <path className="text-gray-100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                    <path className="text-emerald-500" strokeDasharray="68, 100" d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="currentColor" strokeWidth="3" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-gray-900">68%</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">My Courses</h2>
              <div className="grid sm:grid-cols-3 gap-4">
                {myCourses.map((c, i) => (
                  <div key={i} className="border rounded-xl p-4 hover:shadow-md transition">
                    <div className={`w-10 h-10 ${c.color} rounded-lg flex items-center justify-center text-white font-bold mb-3`}>{c.title[0]}</div>
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">{c.title}</h3>
                    <div className="w-full h-1.5 bg-gray-100 rounded-full overflow-hidden mb-2">
                      <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{c.progress}%</span>
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {c.lastAccessed}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
"use client";

import Sidebar from "@/components/Sidebar";
import { BookOpen, Users, BarChart3, Award } from "lucide-react";

export default function InstructorDashboard() {
  const stats = [
    { label: "My Courses", value: 5, icon: <BookOpen className="w-5 h-5" />, color: "bg-blue-500" },
    { label: "Total Students", value: 427, icon: <Users className="w-5 h-5" />, color: "bg-purple-500" },
    { label: "Avg Progress", value: "68%", icon: <BarChart3 className="w-5 h-5" />, color: "bg-emerald-500" },
    { label: "Avg Score", value: "76%", icon: <Award className="w-5 h-5" />, color: "bg-amber-500" },
  ];

  const activities = [
    { text: "Student A completed Module 3", time: "10m ago" },
    { text: "Student B attempted Quiz 2", time: "30m ago" },
    { text: "Student C completed Final Test", time: "1h ago" },
    { text: "Student D enrolled in the course", time: "2h ago" },
    { text: "Student E scored 85% in Quiz 1", time: "3h ago" },
  ];

  const courseProgress = [
    { title: "Python for Beginners", progress: 72 },
    { title: "Web Development", progress: 65 },
    { title: "Data Science", progress: 60 },
    { title: "Machine Learning", progress: 55 },
    { title: "UI/UX Design", progress: 40 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="instructor" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Instructor Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {stats.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className={`w-10 h-10 ${s.color} rounded-lg flex items-center justify-center text-white mb-4`}>{s.icon}</div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
              <div className="space-y-4">
                {activities.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-2 h-2 mt-2 rounded-full bg-blue-500" />
                    <div>
                      <div className="text-sm text-gray-800">{a.text}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{a.time}</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Course Progress Overview</h2>
              <div className="space-y-5">
                {courseProgress.map((c, i) => (
                  <div key={i}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="font-medium text-gray-700">{c.title}</span>
                      <span className="text-gray-500">{c.progress}%</span>
                    </div>
                    <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: `${c.progress}%` }} />
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
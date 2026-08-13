"use client";

import { useEffect, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Users, BookOpen, GraduationCap, IndianRupee, TrendingUp } from "lucide-react";

export default function AdminDashboard() {
  const [stats, setStats] = useState<any>({});
  const [recentRegs, setRecentRegs] = useState<any[]>([]);
  const [recentPurchases, setRecentPurchases] = useState<any[]>([]);

  useEffect(() => {
    setStats({ total_students: 1250, total_instructors: 85, total_courses: 128, total_revenue: 1245000, monthly_enrollments: 342 });
    setRecentRegs([
      { first_name: "Rohit", last_name: "Sharma", email: "rohit@gmail.com", course_title: "Python for Beginners", created_at: "5m ago" },
      { first_name: "Priya", last_name: "Patel", email: "priya@gmail.com", course_title: "Web Development", created_at: "30m ago" },
      { first_name: "Amit", last_name: "Kumar", email: "amit@gmail.com", course_title: "Data Science", created_at: "1h ago" },
      { first_name: "Neha", last_name: "Singh", email: "neha@gmail.com", course_title: "Python for Beginners", created_at: "2h ago" },
    ]);
    setRecentPurchases([
      { course_title: "Python for Beginners", first_name: "Rohit", last_name: "Sharma", amount: 2999, created_at: "5m ago" },
      { course_title: "Web Development", first_name: "Priya", last_name: "Patel", amount: 3499, created_at: "30m ago" },
      { course_title: "Data Science Mastery", first_name: "Amit", last_name: "Kumar", amount: 4999, created_at: "1h ago" },
    ]);
  }, []);

  const statCards = [
    { label: "Total Students", value: stats.total_students, change: "+12% this month", icon: <Users className="w-6 h-6" />, color: "bg-blue-500" },
    { label: "Total Instructors", value: stats.total_instructors, change: "+5% this month", icon: <GraduationCap className="w-6 h-6" />, color: "bg-purple-500" },
    { label: "Total Courses", value: stats.total_courses, change: "+10% this month", icon: <BookOpen className="w-6 h-6" />, color: "bg-emerald-500" },
    { label: "Total Revenue", value: `₹${(stats.total_revenue || 0).toLocaleString()}`, change: "+15% this month", icon: <IndianRupee className="w-6 h-6" />, color: "bg-amber-500" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Super Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((s, i) => (
              <div key={i} className="bg-white rounded-xl p-6 shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${s.color} rounded-lg flex items-center justify-center text-white`}>{s.icon}</div>
                  <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" /> {s.change}
                  </span>
                </div>
                <div className="text-2xl font-bold text-gray-900">{s.value}</div>
                <div className="text-sm text-gray-500 mt-1">{s.label}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Course Sales</h2>
              <div className="h-64 flex items-end gap-4 px-4">
                {[40, 65, 45, 80, 55, 90, 70].map((h, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2">
                    <div className="w-full bg-blue-100 rounded-t-lg relative" style={{ height: `${h}%` }}>
                      <div className="absolute bottom-0 left-0 right-0 bg-blue-500 rounded-t-lg" style={{ height: `${h * 0.7}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{['Jan','Feb','Mar','Apr','May','Jun','Jul'][i]}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <h2 className="text-lg font-semibold mb-4">Recent Registrations</h2>
              <div className="space-y-4">
                {recentRegs.map((r: any, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center text-sm font-bold text-gray-600">
                      {r.first_name[0]}{r.last_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 truncate">{r.first_name} {r.last_name}</div>
                      <div className="text-xs text-gray-500 truncate">{r.course_title}</div>
                    </div>
                    <span className="text-xs text-gray-400">{r.created_at}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="mt-8 bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Recent Purchases</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Course</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentPurchases.map((p: any, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm text-gray-900">{p.course_title}</td>
                    <td className="px-6 py-4 text-sm text-gray-600">{p.first_name} {p.last_name}</td>
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">₹{p.amount}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{p.created_at}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

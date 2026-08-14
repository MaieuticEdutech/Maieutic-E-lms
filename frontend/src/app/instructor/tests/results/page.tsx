"use client";

import Sidebar from "@/components/Sidebar";

export default function TestResults() {
  const topStudents = [
    { rank: 1, name: "Priya Patel", score: 45, percentage: 90, status: "Passed" },
    { rank: 2, name: "Amit Kumar", score: 42, percentage: 84, status: "Passed" },
    { rank: 3, name: "Neha Singh", score: 40, percentage: 80, status: "Passed" },
    { rank: 4, name: "Rohit Sharma", score: 38, percentage: 76, status: "Passed" },
    { rank: 5, name: "Vikram Joshi", score: 32, percentage: 64, status: "Passed" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="instructor" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Test Results</h1>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="text-sm text-gray-500 mb-1">Test</div>
              <div className="font-semibold text-gray-900">Python Basics Test</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="text-sm text-gray-500 mb-1">Total Students</div>
              <div className="text-2xl font-bold text-gray-900">320</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="text-sm text-gray-500 mb-1">Average Score</div>
              <div className="text-2xl font-bold text-gray-900">76%</div>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-sm border">
              <div className="text-sm text-gray-500 mb-1">Pass Percentage</div>
              <div className="text-2xl font-bold text-gray-900">68%</div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b">
              <h2 className="text-lg font-semibold">Top Students</h2>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Rank</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Student</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Score</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Percentage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {topStudents.map((s) => (
                  <tr key={s.rank} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">#{s.rank}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{s.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{s.score}/50</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{s.percentage}%</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{s.status}</span>
                    </td>
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
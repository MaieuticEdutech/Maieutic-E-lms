"use client";

import Sidebar from "@/components/Sidebar";
import { Plus, Eye } from "lucide-react";

export default function InstructorCourses() {
  const courses = [
    { id: 1, title: "Python for Beginners", students: 300, progress: 85, color: "bg-blue-500" },
    { id: 2, title: "Web Development", students: 250, progress: 72, color: "bg-emerald-500" },
    { id: 3, title: "Data Science", students: 150, progress: 60, color: "bg-purple-500" },
    { id: 4, title: "Machine Learning", students: 95, progress: 45, color: "bg-amber-500" },
    { id: 5, title: "UI/UX Design", students: 120, progress: 30, color: "bg-rose-500" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="instructor" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">My Courses</h1>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Course
            </button>
          </div>
          <div className="space-y-4">
            {courses.map((c) => (
              <div key={c.id} className="bg-white rounded-xl p-5 shadow-sm border flex items-center gap-5">
                <div className={`w-14 h-14 ${c.color} rounded-xl flex items-center justify-center text-white font-bold text-lg shrink-0`}>{c.title[0]}</div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{c.title}</h3>
                  <p className="text-sm text-gray-500 mt-0.5">{c.students} Students</p>
                  <div className="flex items-center gap-3 mt-2">
                    <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden max-w-xs">
                      <div className={`h-full ${c.color} rounded-full`} style={{ width: `${c.progress}%` }} />
                    </div>
                    <span className="text-xs text-gray-500">{c.progress}% avg progress</span>
                  </div>
                </div>
                <button className="flex items-center gap-1.5 px-4 py-2 border rounded-lg text-sm text-gray-600 hover:bg-gray-50">
                  <Eye className="w-4 h-4" /> View
                </button>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
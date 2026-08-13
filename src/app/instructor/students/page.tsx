"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { ChevronDown } from "lucide-react";

export default function InstructorStudents() {
  const [course, setCourse] = useState("Python for Beginners");
  const [student, setStudent] = useState("Rohit Sharma");

  const modules = [
    { name: "Module 1 - Introduction", progress: 100 },
    { name: "Module 2 - Python Basics", progress: 100 },
    { name: "Module 3 - Data Types", progress: 80 },
    { name: "Module 4 - Loops", progress: 60 },
    { name: "Module 5 - Functions", progress: 0 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="instructor" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Student Progress</h1>

          <div className="bg-white rounded-xl p-6 shadow-sm border mb-6">
            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Course</label>
                <select value={course} onChange={e => setCourse(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Python for Beginners</option>
                  <option>Web Development</option>
                  <option>Data Science</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Student</label>
                <select value={student} onChange={e => setStudent(e.target.value)} className="w-full px-4 py-2.5 border rounded-lg text-sm bg-white outline-none focus:ring-2 focus:ring-blue-500">
                  <option>Rohit Sharma</option>
                  <option>Priya Patel</option>
                  <option>Amit Kumar</option>
                </select>
              </div>
            </div>

            <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-xl mb-6">
              <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold">RS</div>
              <div>
                <div className="font-semibold text-gray-900">Rohit Sharma</div>
                <div className="text-sm text-gray-500">rohit@gmail.com</div>
              </div>
              <div className="ml-auto text-right">
                <div className="text-2xl font-bold text-gray-900">72%</div>
                <div className="text-xs text-gray-500">Overall Progress</div>
              </div>
            </div>

            <h3 className="font-semibold text-gray-900 mb-4">Module Progress</h3>
            <div className="space-y-4">
              {modules.map((m, i) => (
                <div key={i}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="text-gray-700">{m.name}</span>
                    <span className="text-gray-500">{m.progress}%</span>
                  </div>
                  <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${m.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
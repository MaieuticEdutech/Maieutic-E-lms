"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Search, Plus, Edit3, Trash2 } from "lucide-react";

export default function AdminInstructors() {
  const [search, setSearch] = useState("");
  const instructors = [
    { id: 1, name: "Rahul Verma", email: "rahul@gmail.com", courses: 3, students: 450, status: "Active" },
    { id: 2, name: "Amit Tadav", email: "amit@gmail.com", courses: 2, students: 300, status: "Active" },
    { id: 3, name: "Neha Sharma", email: "neha@gmail.com", courses: 2, students: 180, status: "Active" },
    { id: 4, name: "Priya Mehta", email: "priya@gmail.com", courses: 1, students: 120, status: "Active" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Instructors Management</h1>
            <button className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Add Instructor
            </button>
          </div>
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="p-4 border-b flex items-center gap-4">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input type="text" placeholder="Search instructors..." value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Courses</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {instructors.map((inst) => (
                  <tr key={inst.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-teal-100 rounded-full flex items-center justify-center text-teal-600 font-bold text-sm">{inst.name.split(' ').map(n=>n[0]).join('')}</div>
                        <span className="text-sm font-medium text-gray-900">{inst.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">{inst.email}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{inst.courses}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{inst.students}</td>
                    <td className="px-6 py-4"><span className="text-xs font-medium px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700">{inst.status}</span></td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <button className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"><Edit3 className="w-4 h-4" /></button>
                        <button className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"><Trash2 className="w-4 h-4" /></button>
                      </div>
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
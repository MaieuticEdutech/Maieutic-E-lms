"use client";

import { useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Search, Star, Clock, Users } from "lucide-react";

export default function BrowseCourses() {
  const [search, setSearch] = useState("");
  const courses = [
    { id: 1, title: "Python for Beginners", instructor: "Rahul Verma", price: 2999, rating: 4.8, students: 4320, duration: "12h", color: "from-blue-500 to-cyan-500" },
    { id: 2, title: "Web Development", instructor: "Amit Tadav", price: 3499, rating: 4.6, students: 2800, duration: "18h", color: "from-emerald-500 to-teal-500" },
    { id: 3, title: "Data Science Mastery", instructor: "Neha Sharma", price: 4999, rating: 4.9, students: 1500, duration: "24h", color: "from-purple-500 to-violet-500" },
    { id: 4, title: "UI/UX Design", instructor: "Priya Mehta", price: 2499, rating: 4.5, students: 1200, duration: "10h", color: "from-rose-500 to-pink-500" },
    { id: 5, title: "Machine Learning", instructor: "Rahul Verma", price: 5999, rating: 4.7, students: 950, duration: "20h", color: "from-amber-500 to-orange-500" },
    { id: 6, title: "React Complete Guide", instructor: "Amit Tadav", price: 2999, rating: 4.8, students: 2100, duration: "14h", color: "from-indigo-500 to-blue-600" },
  ];

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="student" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Browse Courses</h1>

          <div className="flex gap-4 mb-8">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input type="text" placeholder="Search courses..." value={search} onChange={e => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <select className="px-4 py-2.5 border rounded-lg text-sm bg-white outline-none">
              <option>All Categories</option>
              <option>Programming</option>
              <option>Design</option>
              <option>Data Science</option>
            </select>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {courses.map((c) => (
              <div key={c.id} className="bg-white rounded-xl border overflow-hidden hover:shadow-lg transition">
                <div className={`h-40 bg-gradient-to-br ${c.color} flex items-center justify-center`}>
                  <span className="text-4xl font-bold text-white/90">{c.title[0]}</span>
                </div>
                <div className="p-5">
                  <h3 className="font-semibold text-gray-900 mb-1">{c.title}</h3>
                  <p className="text-sm text-gray-500 mb-3">{c.instructor}</p>
                  <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                    <span className="flex items-center gap-1"><Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" /> {c.rating}</span>
                    <span className="flex items-center gap-1"><Users className="w-3.5 h-3.5" /> {c.students.toLocaleString()}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {c.duration}</span>
                  </div>
                  <div className="flex items-center justify-between pt-3 border-t">
                    <span className="text-lg font-bold text-gray-900">₹{c.price.toLocaleString()}</span>
                    <Link href={`/student/courses/${c.id}`} className="text-sm font-medium text-blue-600 hover:underline">View Details</Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
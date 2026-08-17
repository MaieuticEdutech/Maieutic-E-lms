"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Sidebar from "@/components/Sidebar";
import { Search, Plus, Edit3, Trash2, UserPlus, BookOpen, Users } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BACKEND = API.replace(/\/api\/?$/, "");

type Course = {
  id: number;
  title: string;
  instructor: string | null;
  price: string | number | null;
  students: number | null;
  status: string | null;
  category?: string | null;
  image_url?: string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

// A few gradient fallbacks for courses without an uploaded image.
const GRADIENTS = [
  "from-indigo-500 to-purple-600",
  "from-blue-500 to-cyan-500",
  "from-emerald-500 to-teal-600",
  "from-amber-500 to-orange-600",
  "from-pink-500 to-rose-600",
  "from-violet-500 to-fuchsia-600",
];

export default function AdminCourses() {
  const [search, setSearch] = useState("");
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API}/courses`);
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      const data = await res.json();
      setCourses(data.courses ?? []);
    } catch (error: unknown) {
      setError(`Could not load courses: ${getErrorMessage(error)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = courses.filter(
    (c) =>
      (c.title ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (c.instructor ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (id: number, title: string) => {
    if (!confirm(`Delete "${title}"?`)) return;
    try {
      const res = await fetch(`${API}/courses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setCourses((prev) => prev.filter((c) => c.id !== id));
    } catch (error: unknown) {
      alert(getErrorMessage(error) || "Could not delete the course.");
    }
  };

  const money = (p: Course["price"]) => `₹${Number(p ?? 0).toLocaleString("en-IN")}`;

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">Courses Management</h1>
            <Link href="/admin/courses/add" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium">
              <Plus className="w-4 h-4" /> Create Course
            </Link>
          </div>

          {error && <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>}

          {/* Search */}
          <div className="mb-6 flex items-center gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              />
            </div>
            <span className="text-sm text-gray-400">{loading ? "Loading…" : `${filtered.length} course${filtered.length === 1 ? "" : "s"}`}</span>
          </div>

          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 border">Loading courses…</div>
          ) : filtered.length === 0 ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 border">
              {courses.length === 0 ? "No courses yet. Click “Create Course” to add one." : `No courses match “${search}”.`}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {filtered.map((c, idx) => {
                const grad = GRADIENTS[idx % GRADIENTS.length];
                return (
                  <div key={c.id} className="bg-white rounded-xl shadow-sm border overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                    {/* Banner */}
                    <div className={`relative h-40 bg-gradient-to-br ${grad}`}>
                      {c.image_url ? (
                        <img src={`${BACKEND}${c.image_url}`} alt={c.title} className="absolute inset-0 w-full h-full object-cover" />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white">
                          <BookOpen className="w-10 h-10 opacity-80" />
                        </div>
                      )}
                      <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${c.status === "Published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                        {c.status || "Draft"}
                      </span>
                    </div>

                    {/* Body */}
                    <div className="p-4 flex-1 flex flex-col">
                      <h3 className="font-semibold text-gray-900 leading-snug line-clamp-2">{c.title}</h3>
                      <p className="text-sm text-gray-500 mt-1">{c.instructor || "—"}</p>
                      {c.category && <p className="text-xs text-gray-400 mt-0.5">{c.category}</p>}

                      <div className="flex items-center justify-between mt-3 text-sm">
                        <span className="font-medium text-gray-900">{money(c.price)}</span>
                        <span className="flex items-center gap-1 text-gray-500">
                          <Users className="w-4 h-4" /> {c.students ?? 0}
                        </span>
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2 mt-4 pt-3 border-t">
                        <Link href={`/admin/courses/${c.id}/enroll`} className="flex-1 flex items-center justify-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium py-2 rounded-lg hover:bg-blue-100">
                          <UserPlus className="w-4 h-4" /> Enroll
                        </Link>
                        <Link href={`/admin/courses/add?id=${c.id}`} title="Edit" className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg">
                          <Edit3 className="w-4 h-4" />
                        </Link>
                        <button onClick={() => handleDelete(c.id, c.title)} title="Delete" className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import { UserPlus, Upload, Trash2, ArrowLeft } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type RosterStudent = {
  id: number;
  name: string;
  email: string;
  progress: number | string;
  status: string;
  enrolled_at?: string;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

export default function EnrollLearners() {
  const router = useRouter();
  const params = useParams();
  const courseId = params?.id as string;

  const [courseTitle, setCourseTitle] = useState("");
  const [roster, setRoster] = useState<RosterStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // "Add a learner" form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [cRes, rRes] = await Promise.all([
        fetch(`${API}/courses/${courseId}`),
        fetch(`${API}/courses/${courseId}/students`),
      ]);
      if (cRes.ok) {
        const c = await cRes.json();
        setCourseTitle((c.course ?? c)?.title ?? "");
      }
      if (rRes.ok) {
        const r = await rRes.json();
        setRoster(r.students ?? []);
      }
    } catch (error: unknown) {
      setNotice({ type: "error", text: `Could not load: ${getErrorMessage(error)}` });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (courseId) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courseId]);

  // Shared: send a list of learners to the course enroll endpoint.
  const enrollLearners = async (learners: { name: string; email: string }[]) => {
    const res = await fetch(`${API}/courses/${courseId}/enroll`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ learners }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.message || `Request failed (${res.status})`);
    return data;
  };

  // Add a single learner
  const addUser = async () => {
    if (!name.trim() || !email.trim()) {
      setNotice({ type: "error", text: "Name and email are required." });
      return;
    }
    setBusy(true);
    setNotice(null);
    try {
      const data = await enrollLearners([{ name: name.trim(), email: email.trim() }]);
      setNotice({ type: "success", text: data.message || "Learner enrolled." });
      setName("");
      setEmail("");
      await load();
    } catch (error: unknown) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setBusy(false);
    }
  };

  // Bulk upload from CSV (name,email[,status])
  const onImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setNotice(null);
    setBusy(true);
    try {
      const text = await file.text();
      const rows = text
        .split(/\r?\n/)
        .map((l) => l.trim())
        .filter(Boolean)
        .map((l) => l.split(",").map((c) => c.trim()));

      if (rows.length && /name/i.test(rows[0][0]) && /email/i.test(rows[0][1] || "")) rows.shift();

      const learners = rows
        .map((cols) => ({ name: cols[0], email: cols[1] }))
        .filter((s) => s.name && s.email);

      if (!learners.length) {
        setNotice({ type: "error", text: "No valid rows found. CSV format: name,email" });
        return;
      }

      const data = await enrollLearners(learners);
      setNotice({ type: "success", text: data.message || "Learners enrolled." });
      await load();
    } catch (error: unknown) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const unenroll = async (studentId: number, studentName: string) => {
    if (!confirm(`Remove "${studentName}" from this course?`)) return;
    try {
      const res = await fetch(`${API}/enrollments`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ student_id: studentId, course_id: Number(courseId) }),
      });
      if (!res.ok) throw new Error(`Request failed (${res.status})`);
      setRoster((prev) => prev.filter((s) => s.id !== studentId));
    } catch (error: unknown) {
      setNotice({ type: "error", text: getErrorMessage(error) });
    }
  };

  const initials = (n: string) => n.split(" ").map((x) => x[0]).join("").slice(0, 2).toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-5xl mx-auto">
          <button onClick={() => router.push("/admin/courses")} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-2">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </button>
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            Enroll learners{courseTitle ? ` — ${courseTitle}` : ""}
          </h1>

          {notice && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${notice.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {notice.text}
            </div>
          )}

          {/* Two enroll options */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Add a user */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold">Add a learner</h2>
              </div>
              <div className="space-y-3">
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Full name" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Email" onKeyDown={(e) => e.key === "Enter" && addUser()} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <button onClick={addUser} disabled={busy} className="w-full bg-blue-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-blue-700 disabled:opacity-60">
                  {busy ? "Enrolling…" : "Enroll learner"}
                </button>
              </div>
              <p className="text-xs text-gray-400 mt-2">New learners are created automatically; existing ones (matched by email) are just enrolled.</p>
            </div>

            {/* Bulk upload */}
            <div className="bg-white rounded-xl p-6 shadow-sm border">
              <div className="flex items-center gap-2 mb-4 text-gray-800">
                <Upload className="w-5 h-5 text-blue-600" />
                <h2 className="text-base font-semibold">Bulk upload</h2>
              </div>
              <p className="text-sm text-gray-600 mb-3">Upload a CSV of learners to enroll them all into this course at once.</p>
              <button onClick={() => fileRef.current?.click()} disabled={busy} className="w-full border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 disabled:opacity-60 flex items-center justify-center gap-2">
                <Upload className="w-4 h-4" /> {busy ? "Uploading…" : "Choose CSV file"}
              </button>
              <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={onImport} />
              <p className="text-xs text-gray-400 mt-2">CSV format: <code>name,email</code> (one learner per line; a header row is auto-detected).</p>
            </div>
          </div>

          {/* Roster */}
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            <div className="px-6 py-4 border-b flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-800">Enrolled learners</h2>
              <span className="text-sm text-gray-400">{loading ? "Loading…" : `${roster.length} enrolled`}</span>
            </div>
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Progress</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">Loading…</td></tr>
                ) : roster.length === 0 ? (
                  <tr><td colSpan={5} className="px-6 py-10 text-center text-sm text-gray-400">No learners enrolled yet. Add one or upload a CSV above.</td></tr>
                ) : (
                  roster.map((s) => {
                    const prog = Number(s.progress ?? 0);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">{initials(s.name)}</div>
                            <span className="text-sm font-medium text-gray-900">{s.name}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">{s.email}</td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2">
                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                              <div className="h-full bg-blue-500 rounded-full" style={{ width: `${prog}%` }} />
                            </div>
                            <span className="text-xs text-gray-600">{prog}%</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${s.status === "Active" ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"}`}>{s.status}</span>
                        </td>
                        <td className="px-6 py-4">
                          <button onClick={() => unenroll(s.id, s.name)} title="Remove from course" className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Sidebar from "@/components/Sidebar";
import { Search, Plus, Edit3, Trash2, Upload, Download } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";

type Student = {
  id: number;
  name: string;
  email: string;
  status: string;
  courses?: number | string;
  progress?: number | string;
};

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return "An unexpected error occurred.";
}

export default function AdminStudents() {
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Add/Edit modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Student | null>(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    status: "Active",
  });
  const [saving, setSaving] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);

  const load = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API}/students`);

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      const data = await res.json();
      setStudents(data.students ?? []);
    } catch (error: unknown) {
      const message = getErrorMessage(error);

      setError(
        message
          ? `Could not load students: ${message}`
          : `Could not reach the backend at ${API}.`
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = students.filter(
    (s) =>
      (s.name ?? "").toLowerCase().includes(search.toLowerCase()) ||
      (s.email ?? "").toLowerCase().includes(search.toLowerCase())
  );

  // ---- Add / Edit ----

  const openAdd = () => {
    setEditing(null);

    setForm({
      name: "",
      email: "",
      status: "Active",
    });

    setModalOpen(true);
  };

  const openEdit = (s: Student) => {
    setEditing(s);

    setForm({
      name: s.name,
      email: s.email,
      status: s.status,
    });

    setModalOpen(true);
  };

  const saveStudent = async () => {
    if (!form.name.trim() || !form.email.trim()) {
      alert("Name and email are required.");
      return;
    }

    setSaving(true);

    try {
      const url = editing
        ? `${API}/students/${editing.id}`
        : `${API}/students`;

      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));

        throw new Error(
          body.message || `Request failed (${res.status})`
        );
      }

      setModalOpen(false);
      await load();
    } catch (error: unknown) {
      alert(getErrorMessage(error) || "Could not save student.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Delete "${name}"?`)) {
      return;
    }

    try {
      const res = await fetch(`${API}/students/${id}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        throw new Error(`Request failed (${res.status})`);
      }

      setStudents((prev) => prev.filter((s) => s.id !== id));
    } catch (error: unknown) {
      alert(getErrorMessage(error) || "Could not delete student.");
    }
  };

  // ---- Bulk import from CSV ----

  const onImport = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0];

    if (!file) {
      return;
    }

    setNotice(null);

    try {
      const text = await file.text();

      const rows = text
        .split(/\r?\n/)
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) =>
          line.split(",").map((c) => c.trim())
        );

      // Skip a header row if it looks like one.
      if (
        rows.length &&
        /name/i.test(rows[0][0]) &&
        /email/i.test(rows[0][1] || "")
      ) {
        rows.shift();
      }

      const list = rows
        .map((cols) => ({
          name: cols[0],
          email: cols[1],
          status: cols[2] || "Active",
        }))
        .filter((s) => s.name && s.email);

      if (!list.length) {
        alert(
          "No valid rows found. CSV format: name,email[,status]"
        );
        return;
      }

      const res = await fetch(`${API}/students/bulk`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          students: list,
        }),
      });

      const data = await res.json();

      setNotice(data.message || "Import complete.");

      await load();
    } catch (error: unknown) {
      alert(getErrorMessage(error) || "Import failed.");
    } finally {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
    }
  };

  // ---- Export current list to CSV ----

  const onExport = () => {
    const header = [
      "Name",
      "Email",
      "Courses",
      "Progress",
      "Status",
    ];

    const lines = [header.join(",")].concat(
      filtered.map((s) =>
        [
          s.name,
          s.email,
          Number(s.courses ?? 0),
          `${Number(s.progress ?? 0)}%`,
          s.status,
        ].join(",")
      )
    );

    const blob = new Blob([lines.join("\n")], {
      type: "text/csv",
    });

    const url = URL.createObjectURL(blob);

    const a = document.createElement("a");

    a.href = url;
    a.download = "students.csv";
    a.click();

    URL.revokeObjectURL(url);
  };

  const initials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />

      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">

          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              Students Management
            </h1>

            <div className="flex gap-3">

              <button
                onClick={openAdd}
                className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 text-sm font-medium"
              >
                <Plus className="w-4 h-4" />
                Add Student
              </button>

              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <Upload className="w-4 h-4" />
                Import CSV
              </button>

              <button
                onClick={onExport}
                className="flex items-center gap-2 border border-gray-200 bg-white text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium"
              >
                <Download className="w-4 h-4" />
                Export
              </button>

              <input
                ref={fileRef}
                type="file"
                accept=".csv,text/csv"
                className="hidden"
                onChange={onImport}
              />
            </div>
          </div>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">
              {error}
            </div>
          )}

          {notice && (
            <div className="mb-4 rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 px-4 py-3 text-sm">
              {notice}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">

            <div className="p-4 border-b flex items-center gap-4">

              <div className="relative flex-1 max-w-sm">

                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />

                <input
                  type="text"
                  placeholder="Search students..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              <span className="text-sm text-gray-400 ml-auto">
                {loading
                  ? "Loading…"
                  : `${filtered.length} student${
                      filtered.length === 1 ? "" : "s"
                    }`}
              </span>

            </div>

            <table className="w-full">

              <thead className="bg-gray-50">
                <tr>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Name
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Email
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Courses
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Progress
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Status
                  </th>

                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                    Action
                  </th>

                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">

                {loading ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-400"
                    >
                      Loading students…
                    </td>
                  </tr>
                ) : filtered.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-6 py-10 text-center text-sm text-gray-400"
                    >
                      {students.length === 0
                        ? "No students yet. Add one or import a CSV."
                        : `No students match “${search}”.`}
                    </td>
                  </tr>
                ) : (
                  filtered.map((s) => {
                    const prog = Number(s.progress ?? 0);

                    return (
                      <tr
                        key={s.id}
                        className="hover:bg-gray-50"
                      >

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-3">

                            <div className="w-9 h-9 bg-purple-100 rounded-full flex items-center justify-center text-purple-600 font-bold text-sm">
                              {initials(s.name)}
                            </div>

                            <span className="text-sm font-medium text-gray-900">
                              {s.name}
                            </span>

                          </div>

                        </td>

                        <td className="px-6 py-4 text-sm text-gray-600">
                          {s.email}
                        </td>

                        <td className="px-6 py-4 text-sm text-gray-900">
                          {Number(s.courses ?? 0)}
                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">

                              <div
                                className="h-full bg-blue-500 rounded-full"
                                style={{
                                  width: `${prog}%`,
                                }}
                              />

                            </div>

                            <span className="text-xs text-gray-600">
                              {prog}%
                            </span>

                          </div>

                        </td>

                        <td className="px-6 py-4">

                          <span
                            className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                              s.status === "Active"
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-red-50 text-red-700"
                            }`}
                          >
                            {s.status}
                          </span>

                        </td>

                        <td className="px-6 py-4">

                          <div className="flex items-center gap-2">

                            <button
                              onClick={() => openEdit(s)}
                              className="p-1.5 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>

                            <button
                              onClick={() =>
                                handleDelete(s.id, s.name)
                              }
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>

                          </div>

                        </td>

                      </tr>
                    );
                  })
                )}

              </tbody>

            </table>

          </div>

          <p className="text-xs text-gray-400 mt-3">
            CSV format for import:{" "}
            <code>name,email,status</code>{" "}
            (status optional; a header row is auto-detected).
          </p>

        </div>
      </main>

      {/* Add / Edit modal */}

      {modalOpen && (
        <div
          className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4"
          onClick={() => setModalOpen(false)}
        >

          <div
            className="bg-white rounded-xl w-full max-w-md p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >

            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {editing ? "Edit Student" : "Add Student"}
            </h2>

            <div className="space-y-4">

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Name{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      name: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email{" "}
                  <span className="text-red-500">*</span>
                </label>

                <input
                  type="email"
                  value={form.email}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      email: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />

              </div>

              <div>

                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>

                <select
                  value={form.status}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      status: e.target.value,
                    })
                  }
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>

              </div>

            </div>

            <div className="flex justify-end gap-3 mt-6">

              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50"
              >
                Cancel
              </button>

              <button
                onClick={saveStudent}
                disabled={saving}
                className="px-5 py-2 text-sm rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 disabled:opacity-60"
              >
                {saving
                  ? "Saving…"
                  : editing
                  ? "Save changes"
                  : "Add student"}
              </button>

            </div>

          </div>

        </div>
      )}

    </div>
  );
}
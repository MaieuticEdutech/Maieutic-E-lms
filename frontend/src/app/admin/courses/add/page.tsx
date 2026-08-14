"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";

// Point this at your Express backend. Override with NEXT_PUBLIC_API_URL in .env.local if needed.
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
// Backend origin (without the /api) — used to display uploaded files.
const BACKEND = API.replace(/\/api\/?$/, "");

const CATEGORIES = [
  "Programming",
  "Web Development",
  "Data Science",
  "Design",
  "Business",
  "Marketing",
  "Other",
];
const LANGUAGES = ["English", "Hindi", "Gujarati", "Spanish", "French"];

// ---- Course format options (matches Moodle) ----
const FORMATS = [
  { value: "custom", label: "Custom sections" },
  { value: "topics", label: "Topics" },
  { value: "weekly", label: "Weekly" },
  { value: "single", label: "Single activity" },
  { value: "social", label: "Social" },
];
const HIDDEN_SECTIONS = [
  { value: "invisible", label: "Hidden sections are completely invisible" },
  { value: "collapsed", label: "Hidden sections are shown in collapsed form" },
];
const COURSE_LAYOUTS = [
  { value: "one_page", label: "Show all sections on one page" },
  { value: "per_page", label: "Show one section per page" },
];
const MODULE_COUNTS = Array.from({ length: 21 }, (_, i) => i); // 0..20

// The three uploadable slots per module.
const MODULE_SLOTS: { key: "pdf_url" | "video_url" | "assessment_url"; label: string; accept: string }[] = [
  { key: "pdf_url", label: "PDF", accept: ".pdf,.doc,.docx,.ppt,.pptx" },
  { key: "video_url", label: "Video", accept: ".mp4,.webm,.ogg,.mov,.avi,.mkv,video/*" },
  { key: "assessment_url", label: "Assessment", accept: ".pdf,.doc,.docx" },
];

type ModuleDraft = {
  id?: number; // present when it already exists in the DB (edit mode)
  title: string;
  pdf_url: string;
  video_url: string;
  assessment_url: string;
};

// Local YYYY-MM-DD for a default start date (today).
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

export default function AddEditCourse() {
  const router = useRouter();

  const [courseId, setCourseId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modules built on this page.
  const [modules, setModules] = useState<ModuleDraft[]>([]);
  const [deletedIds, setDeletedIds] = useState<number[]>([]);
  const [moduleBusy, setModuleBusy] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    instructor: "",
    category: "Programming",
    language: "English",
    price: "",
    short_description: "",
    full_description: "",
    visibility: "show", // "show" | "hide"
    start_date: todayISO(),
    end_date_enabled: false,
    end_date: "",
    image_url: "",
    // ---- Course format ----
    format: "custom",
    num_modules: 4,
    hidden_sections: "invisible",
    course_layout: "one_page",
  });

  // Edit mode: pre-fill the course AND its modules.
  useEffect(() => {
    const id = new URLSearchParams(window.location.search).get("id");
    if (!id) return;

    setCourseId(Number(id));
    setLoading(true);
    Promise.all([
      fetch(`${API}/courses/${id}`).then((r) => (r.ok ? r.json() : null)),
      fetch(`${API}/courses/${id}/modules`).then((r) => (r.ok ? r.json() : null)),
    ])
      .then(([cData, mData]) => {
        if (cData) {
          const c = cData.course ?? cData;
          setForm((f) => ({
            ...f,
            title: c.title ?? "",
            instructor: c.instructor ?? "",
            category: c.category ?? "Programming",
            language: c.language ?? "English",
            price: c.price != null ? String(c.price) : "",
            short_description: c.short_description ?? "",
            full_description: c.full_description ?? "",
            visibility: c.visibility ?? (c.published === false ? "hide" : "show"),
            start_date: c.start_date ? String(c.start_date).slice(0, 10) : f.start_date,
            end_date_enabled: !!c.end_date,
            end_date: c.end_date ? String(c.end_date).slice(0, 10) : "",
            image_url: c.image_url ?? "",
            format: c.format ?? "custom",
            num_modules: c.num_modules ?? 4,
            hidden_sections: c.hidden_sections ?? "invisible",
            course_layout: c.course_layout ?? "one_page",
          }));
        }
        if (mData?.modules) {
          setModules(
            mData.modules.map((m: any) => ({
              id: m.id,
              title: m.title ?? "",
              pdf_url: m.pdf_url ?? "",
              video_url: m.video_url ?? "",
              assessment_url: m.assessment_url ?? "",
            }))
          );
        }
      })
      .catch(() => setMessage({ type: "error", text: "Could not load this course. Is the backend running?" }))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: any) => setForm((f) => ({ ...f, [key]: value }));

  // ---- Course image upload ----
  const handleImage = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setMessage(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      const res = await fetch(`${API}/upload`, { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Upload failed (${res.status})`);
      }
      const data = await res.json();
      update("image_url", data.url);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message ? `Image upload failed: ${err.message}` : "Image upload failed." });
    } finally {
      setUploading(false);
    }
  };

  // ---- Module helpers ----
  const addModule = () =>
    setModules((prev) => [
      ...prev,
      { title: `Module ${prev.length + 1}`, pdf_url: "", video_url: "", assessment_url: "" },
    ]);

  const updateModule = (index: number, key: keyof ModuleDraft, value: string) =>
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));

  const removeModule = (index: number) => {
    setModules((prev) => {
      const mod = prev[index];
      if (mod?.id) setDeletedIds((d) => [...d, mod.id as number]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // Upload a file for one module slot; store the returned URL in local state.
  const uploadModuleFile = async (index: number, key: "pdf_url" | "video_url" | "assessment_url", file: File) => {
    const busyKey = `${index}-${key}`;
    setModuleBusy(busyKey);
    setMessage(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch(`${API}/upload/file`, { method: "POST", body: fd });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Upload failed (${res.status})`);
      }
      const { url } = await res.json();
      updateModule(index, key, url);
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "File upload failed." });
    } finally {
      setModuleBusy(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!form.title.trim()) {
      setMessage({ type: "error", text: "Course title is required." });
      return;
    }

    setSaving(true);
    try {
      // 1) Save the course.
      const url = courseId ? `${API}/courses/${courseId}` : `${API}/courses`;
      const method = courseId ? "PUT" : "POST";
      const payload = {
        title: form.title,
        instructor: form.instructor,
        category: form.category,
        language: form.language,
        price: form.price === "" ? 0 : Number(form.price),
        short_description: form.short_description,
        full_description: form.full_description,
        visibility: form.visibility,
        published: form.visibility === "show",
        start_date: form.start_date || null,
        end_date: form.end_date_enabled && form.end_date ? form.end_date : null,
        image_url: form.image_url || null,
        format: form.format,
        num_modules: Number(form.num_modules),
        hidden_sections: form.hidden_sections,
        course_layout: form.course_layout,
      };

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.message || `Request failed (${res.status})`);
      }
      const data = await res.json().catch(() => ({}));
      const cid = courseId ?? data?.course?.id;

      // 2) Sync the modules against that course.
      if (cid) {
        for (const mod of modules) {
          const body = JSON.stringify({
            title: mod.title || "Untitled module",
            pdf_url: mod.pdf_url || null,
            video_url: mod.video_url || null,
            assessment_url: mod.assessment_url || null,
          });
          if (mod.id) {
            await fetch(`${API}/modules/${mod.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body });
          } else {
            await fetch(`${API}/courses/${cid}/modules`, { method: "POST", headers: { "Content-Type": "application/json" }, body });
          }
        }
        for (const did of deletedIds) {
          await fetch(`${API}/modules/${did}`, { method: "DELETE" });
        }
      }

      setMessage({ type: "success", text: courseId ? "Course updated successfully." : "Course created successfully." });
      setTimeout(() => router.push("/admin/courses"), 800);
    } catch (err: any) {
      setMessage({
        type: "error",
        text: err?.message ? `Could not save: ${err.message}` : `Could not reach the backend at ${API}.`,
      });
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent";

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {courseId ? "Edit Course" : "Add / Edit Course"}
            </h1>
            <button type="button" onClick={() => router.push("/admin/courses")} className="text-sm text-gray-500 hover:text-gray-700">
              ← Back to Courses
            </button>
          </div>

          {message && (
            <div className={`mb-6 rounded-lg px-4 py-3 text-sm ${message.type === "success" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" : "bg-red-50 text-red-700 border border-red-200"}`}>
              {message.text}
            </div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl p-8 shadow-sm border text-center text-gray-500">Loading course…</div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input type="text" value={form.title} onChange={(e) => update("title", e.target.value)} placeholder="Python for Beginners" className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Short Description</label>
                <input type="text" value={form.short_description} onChange={(e) => update("short_description", e.target.value)} placeholder="Learn Python from scratch with hands-on examples." className={inputClass} />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Description</label>
                <textarea value={form.full_description} onChange={(e) => update("full_description", e.target.value)} rows={5} placeholder="This course is designed for beginners…" className={inputClass + " resize-y"} />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={form.category} onChange={(e) => update("category", e.target.value)} className={inputClass}>
                    {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                  <select value={form.language} onChange={(e) => update("language", e.target.value)} className={inputClass}>
                    {LANGUAGES.map((l) => (<option key={l} value={l}>{l}</option>))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Instructor</label>
                  <input type="text" value={form.instructor} onChange={(e) => update("instructor", e.target.value)} placeholder="Rahul Verma" className={inputClass} />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
                  <input type="number" min="0" value={form.price} onChange={(e) => update("price", e.target.value)} placeholder="2999" className={inputClass} />
                </div>
              </div>

              {/* ---- Course settings ---- */}
              <div className="pt-2 border-t">
                <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-3">Course settings</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course visibility</label>
                    <select value={form.visibility} onChange={(e) => update("visibility", e.target.value)} className={inputClass}>
                      <option value="show">Show</option>
                      <option value="hide">Hide</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Course start date</label>
                    <input type="date" value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className={inputClass} />
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course end date</label>
                  <div className="flex items-center gap-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700">
                      <input type="checkbox" checked={form.end_date_enabled} onChange={(e) => update("end_date_enabled", e.target.checked)} className="w-4 h-4 text-indigo-600 rounded border-gray-300 focus:ring-indigo-500" />
                      Enable
                    </label>
                    <input type="date" value={form.end_date} disabled={!form.end_date_enabled} onChange={(e) => update("end_date", e.target.value)} className={inputClass + (form.end_date_enabled ? "" : " opacity-50 cursor-not-allowed")} />
                  </div>
                </div>
              </div>

              {/* ---- Course format ---- */}
              <div className="pt-2 border-t">
                <h3 className="text-sm font-semibold text-gray-800 mt-4 mb-3">Course format</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Format</label>
                    <select value={form.format} onChange={(e) => update("format", e.target.value)} className={inputClass}>
                      {FORMATS.map((f) => (<option key={f.value} value={f.value}>{f.label}</option>))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Number of modules</label>
                    <select value={form.num_modules} onChange={(e) => update("num_modules", Number(e.target.value))} className={inputClass}>
                      {MODULE_COUNTS.map((n) => (<option key={n} value={n}>{n}</option>))}
                    </select>
                  </div>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Hidden sections</label>
                  <select value={form.hidden_sections} onChange={(e) => update("hidden_sections", e.target.value)} className={inputClass}>
                    {HIDDEN_SECTIONS.map((h) => (<option key={h.value} value={h.value}>{h.label}</option>))}
                  </select>
                </div>
                <div className="mt-5">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Course layout</label>
                  <select value={form.course_layout} onChange={(e) => update("course_layout", e.target.value)} className={inputClass}>
                    {COURSE_LAYOUTS.map((l) => (<option key={l.value} value={l.value}>{l.label}</option>))}
                  </select>
                </div>
              </div>

              {/* ---- Modules (each has PDF, Video, Assessment) ---- */}
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between mt-4 mb-3">
                  <h3 className="text-sm font-semibold text-gray-800">Modules</h3>
                  <button type="button" onClick={addModule} className="text-sm bg-indigo-50 text-indigo-700 px-3 py-1.5 rounded-lg hover:bg-indigo-100 font-medium">
                    + Add module
                  </button>
                </div>

                {modules.length === 0 ? (
                  <p className="text-sm text-gray-400 py-2">No modules yet. Click “Add module” to create Module 1.</p>
                ) : (
                  <div className="space-y-4">
                    {modules.map((mod, index) => (
                      <div key={index} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <span className="text-xs font-semibold text-gray-400">{index + 1}.</span>
                          <input
                            type="text"
                            value={mod.title}
                            onChange={(e) => updateModule(index, "title", e.target.value)}
                            placeholder={`Module ${index + 1} title`}
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button type="button" onClick={() => removeModule(index)} className="text-xs text-red-600 hover:underline px-2">
                            Remove
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {MODULE_SLOTS.map((slot) => {
                            const val = mod[slot.key];
                            const busy = moduleBusy === `${index}-${slot.key}`;
                            return (
                              <div key={slot.key} className="border border-gray-200 rounded-md p-3">
                                <div className="text-xs font-medium text-gray-700 mb-2">
                                  {slot.label} {val ? <span className="text-emerald-600">✓</span> : null}
                                </div>
                                {val ? (
                                  <div className="text-xs">
                                    <a href={`${BACKEND}${val}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                                      View
                                    </a>
                                    <span className="mx-1 text-gray-300">|</span>
                                    <label className="text-gray-500 hover:text-gray-700 cursor-pointer">
                                      Replace
                                      <input type="file" accept={slot.accept} className="hidden" onChange={(e) => e.target.files?.[0] && uploadModuleFile(index, slot.key, e.target.files[0])} />
                                    </label>
                                    <span className="mx-1 text-gray-300">|</span>
                                    <button type="button" onClick={() => updateModule(index, slot.key, "")} className="text-red-500 hover:text-red-700">
                                      Remove
                                    </button>
                                  </div>
                                ) : (
                                  <label className={`flex items-center justify-center text-xs border border-dashed rounded py-2 cursor-pointer ${busy ? "border-indigo-300 text-indigo-500" : "border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"}`}>
                                    {busy ? "Uploading…" : `Upload ${slot.label}`}
                                    <input type="file" accept={slot.accept} className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && uploadModuleFile(index, slot.key, e.target.files[0])} />
                                  </label>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* ---- Course image ---- */}
              <div className="pt-2 border-t">
                <label className="block text-sm font-bold text-gray-700 mt-4 mb-2">Course image</label>
                {form.image_url ? (
                  <div className="mb-3">
                    <img src={`${BACKEND}${form.image_url}`} alt="Course" className="w-48 h-28 object-cover rounded-lg border" />
                    <button type="button" onClick={() => update("image_url", "")} className="mt-2 text-xs text-red-600 hover:underline">
                      Remove image
                    </button>
                  </div>
                ) : null}
                <input type="file" accept=".jpg,.jpeg,.png,.gif,.svg,.webp,image/*" onChange={handleImage} className="block text-sm text-gray-600 file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100" />
                <p className="text-xs text-gray-400 mt-1">{uploading ? "Uploading…" : "Accepted: .jpg .jpeg .png .gif .svg .webp (max 5 MB)"}</p>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t">
                <button type="button" onClick={() => router.push("/admin/courses")} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
                  Cancel
                </button>
                <button type="submit" disabled={saving || uploading} className="px-5 py-2 text-sm rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700 disabled:opacity-60">
                  {saving ? "Saving…" : "Save Course"}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}

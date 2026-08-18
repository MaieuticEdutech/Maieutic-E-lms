"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ClipboardList,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Music,
  PlayCircle,
  Plus,
  Search,
  Settings2,
  Trash2,
  X,
} from "lucide-react";

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

// What the "Add an activity or resource" picker offers. Keep the keys in step
// with ACTIVITY_TYPES in backend/routes/activities.js.
const ACTIVITY_TYPES: {
  type: string;
  label: string;
  Icon: typeof FileText;
  accept?: string; // absent means the item takes a URL instead of a file
}[] = [
  { type: "pdf", label: "File / PDF", Icon: FileText, accept: ".pdf,.doc,.docx,.ppt,.pptx" },
  { type: "video", label: "Video", Icon: PlayCircle, accept: ".mp4,.webm,.ogg,.mov,.avi,.mkv,video/*" },
  { type: "audio", label: "Audio", Icon: Music, accept: ".mp3,.wav,.m4a,.aac,.ogg,audio/*" },
  { type: "assignment", label: "Assignment", Icon: ClipboardList, accept: ".pdf,.doc,.docx" },
  { type: "quiz", label: "Quiz", Icon: HelpCircle, accept: ".pdf,.doc,.docx" },
  { type: "link", label: "URL / Link", Icon: LinkIcon },
];

const typeInfo = (type: string) => ACTIVITY_TYPES.find((t) => t.type === type) ?? ACTIVITY_TYPES[0];

// One item inside a module or unit. `key` is a local-only handle so React and
// the upload spinner can track drafts that have no database id yet.
type ActivityDraft = {
  id?: number;
  key: string;
  type: string;
  title: string;
  description: string;
  url: string;
};

let draftSeq = 0;
const nextKey = () => `draft-${++draftSeq}`;

// A unit is a sub-module: it holds its own activities and lives inside a module.
// On the backend both are rows in `modules`; a unit just has parent_id set.
type UnitDraft = {
  id?: number; // present when it already exists in the DB (edit mode)
  title: string;
  activities: ActivityDraft[];
};

type ModuleDraft = UnitDraft & {
  units: UnitDraft[];
};

// Which module/unit the picker was opened for. uIndex null means the module itself.
type PickerTarget = { mIndex: number; uIndex: number | null };

// Local YYYY-MM-DD for a default start date (today).
function todayISO() {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

// The list of activities inside one module or unit, plus the button that opens
// the picker. Rendered at both levels, so each gets the same controls.
function ActivityList({
  activities,
  onAdd,
  onEdit,
  onRemove,
}: {
  activities: ActivityDraft[];
  onAdd: () => void;
  onEdit: (act: ActivityDraft) => void;
  onRemove: (key: string) => void;
}) {
  return (
    <div>
      {activities.length > 0 && (
        <div className="space-y-2 mb-3">
          {activities.map((act) => {
            const info = typeInfo(act.type);
            return (
              <div key={act.key} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <info.Icon className="w-4 h-4 text-indigo-500 shrink-0" />

                {/* Click the name to reopen its settings. */}
                <button type="button" onClick={() => onEdit(act)} className="flex-1 min-w-0 text-left">
                  <span className="block text-sm text-gray-900 truncate hover:text-indigo-600">{act.title}</span>
                  {act.description && (
                    <span className="block text-xs text-gray-400 truncate">{act.description}</span>
                  )}
                </button>

                <span className="text-[11px] uppercase tracking-wide text-gray-400 shrink-0">{info.label}</span>
                {act.url ? (
                  <span className="text-[11px] text-emerald-600 shrink-0">✓</span>
                ) : (
                  <span className="text-[11px] text-amber-600 shrink-0">{info.accept ? "no file" : "no link"}</span>
                )}

                <button type="button" onClick={() => onEdit(act)} title="Settings" className="p-1 text-gray-400 hover:text-indigo-600 shrink-0">
                  <Settings2 className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => onRemove(act.key)} title="Remove" className="p-1 text-gray-400 hover:text-red-600 shrink-0">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <button
        type="button"
        onClick={onAdd}
        className="w-full flex items-center justify-center gap-1.5 text-sm text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-dashed border-emerald-200 rounded-lg py-2 font-medium"
      >
        <Plus className="w-4 h-4" /> Add an activity or resource
      </button>
    </div>
  );
}

// The settings screen for one activity — the "New Quiz" form, shown after a type
// is picked and again whenever an existing item is reopened.
function ActivityForm({
  draft,
  isNew,
  onUpload,
  onSave,
  onCancel,
}: {
  draft: ActivityDraft;
  isNew: boolean;
  onUpload: (file: File) => Promise<string | null>;
  onSave: (draft: ActivityDraft) => void;
  onCancel: () => void;
}) {
  const info = typeInfo(draft.type);
  const [title, setTitle] = useState(draft.title);
  const [description, setDescription] = useState(draft.description);
  const [url, setUrl] = useState(draft.url);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const choose = async (file: File) => {
    setBusy(true);
    const uploaded = await onUpload(file);
    setBusy(false);
    if (uploaded) setUrl(uploaded);
  };

  const submit = () => {
    if (!title.trim()) {
      setError("Name is required.");
      return;
    }
    onSave({ ...draft, title: title.trim(), description: description.trim(), url });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-auto">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mt-10 mb-10">
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-orange-600">
            {isNew ? "New" : "Edit"} {info.label}
          </h3>
          <button type="button" onClick={onCancel} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <h4 className="text-sm font-semibold text-orange-600 mb-4">General</h4>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-3 py-2 text-sm">{error}</div>
          )}

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                setError(null);
              }}
              placeholder={`${info.label} name`}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea
              rows={5}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What this is about, instructions for learners, and so on."
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {/* File-backed types get an upload; a link takes a URL instead. */}
          {info.accept ? (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{info.label} file</label>
              {url ? (
                <div className="flex items-center gap-3 text-sm">
                  <a href={`${BACKEND}${url}`} target="_blank" rel="noreferrer" className="text-indigo-600 hover:underline">
                    View uploaded file
                  </a>
                  <label className="text-gray-500 hover:text-gray-700 cursor-pointer text-xs">
                    Replace
                    <input type="file" accept={info.accept} className="hidden" onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])} />
                  </label>
                  <button type="button" onClick={() => setUrl("")} className="text-red-500 hover:text-red-700 text-xs">
                    Remove
                  </button>
                </div>
              ) : (
                <label className={`flex items-center justify-center text-sm border border-dashed rounded-lg py-3 cursor-pointer ${busy ? "border-indigo-300 text-indigo-500" : "border-gray-300 text-gray-500 hover:border-indigo-400 hover:text-indigo-600"}`}>
                  {busy ? "Uploading…" : `Upload ${info.label}`}
                  <input type="file" accept={info.accept} className="hidden" disabled={busy} onChange={(e) => e.target.files?.[0] && choose(e.target.files[0])} />
                </label>
              )}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">URL</label>
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://…"
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 px-5 py-4 border-t">
          <button type="button" onClick={submit} disabled={busy} className="px-4 py-2 text-sm rounded-lg bg-orange-600 text-white font-medium hover:bg-orange-700 disabled:opacity-60">
            Save and return to course
          </button>
          <button type="button" onClick={onCancel} className="px-4 py-2 text-sm rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50">
            Cancel
          </button>
          <span className="ml-auto text-xs text-red-500">* Required</span>
        </div>
      </div>
    </div>
  );
}

// The Moodle-style picker: search box over a grid of activity types.
function ActivityPicker({ onPick, onClose }: { onPick: (type: string) => void; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const shown = ACTIVITY_TYPES.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/40 p-4 overflow-auto" onClick={onClose}>
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mt-10" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-5 py-4 border-b">
          <h3 className="text-lg font-semibold text-orange-600">Add an activity or resource</h3>
          <button type="button" onClick={onClose} className="p-1 text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5">
          <div className="relative mb-5">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              autoFocus
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search"
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>

          {shown.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-8">Nothing matches “{search}”.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {shown.map(({ type, label, Icon }) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onPick(type)}
                  className="flex flex-col items-center gap-2 border border-gray-200 rounded-lg p-4 hover:border-indigo-400 hover:bg-indigo-50"
                >
                  <Icon className="w-7 h-7 text-indigo-500" />
                  <span className="text-xs text-center text-gray-700">{label}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
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
  const [deletedActivityIds, setDeletedActivityIds] = useState<number[]>([]);
  const [picker, setPicker] = useState<PickerTarget | null>(null);
  // The activity whose settings form is open, if any.
  const [editing, setEditing] = useState<{ target: PickerTarget; draft: ActivityDraft; isNew: boolean } | null>(null);

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
          // The backend nests units under their module; mirror that shape here.
          const toDraft = (m: any): UnitDraft => ({
            id: m.id,
            title: m.title ?? "",
            activities: (m.activities ?? []).map((a: any) => ({
              id: a.id,
              key: nextKey(),
              type: a.type,
              title: a.title ?? "",
              description: a.description ?? "",
              url: a.url ?? "",
            })),
          });
          setModules(
            mData.modules.map((m: any) => ({
              ...toDraft(m),
              units: (m.units ?? []).map(toDraft),
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
      { title: `Module ${prev.length + 1}`, activities: [], units: [] },
    ]);

  const updateModule = (index: number, key: keyof ModuleDraft, value: string) =>
    setModules((prev) => prev.map((m, i) => (i === index ? { ...m, [key]: value } : m)));

  const removeModule = (index: number) => {
    setModules((prev) => {
      const mod = prev[index];
      // Deleting a module on the backend takes its units with it, so only the
      // module id needs to go on the delete list.
      if (mod?.id) setDeletedIds((d) => [...d, mod.id as number]);
      return prev.filter((_, i) => i !== index);
    });
  };

  // ---- Unit (sub-module) helpers ----
  const addUnit = (mIndex: number) =>
    setModules((prev) =>
      prev.map((m, i) =>
        i === mIndex
          ? {
              ...m,
              units: [...m.units, { title: `Unit ${m.units.length + 1}`, activities: [] }],
            }
          : m
      )
    );

  const updateUnit = (mIndex: number, uIndex: number, key: keyof UnitDraft, value: string) =>
    setModules((prev) =>
      prev.map((m, i) =>
        i === mIndex
          ? { ...m, units: m.units.map((u, j) => (j === uIndex ? { ...u, [key]: value } : u)) }
          : m
      )
    );

  const removeUnit = (mIndex: number, uIndex: number) =>
    setModules((prev) =>
      prev.map((m, i) => {
        if (i !== mIndex) return m;
        const unit = m.units[uIndex];
        if (unit?.id) setDeletedIds((d) => [...d, unit.id as number]);
        return { ...m, units: m.units.filter((_, j) => j !== uIndex) };
      })
    );

  // Upload one file and hand back its URL, or null if it failed.
  const uploadFile = async (file: File): Promise<string | null> => {
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
      return url;
    } catch (err: any) {
      setMessage({ type: "error", text: err?.message || "File upload failed." });
      return null;
    }
  };

  // ---- Activity helpers ----
  // Every change funnels through here so modules and units share one code path;
  // uIndex null means the module itself rather than a unit inside it.
  const mapActivities = (target: PickerTarget, fn: (list: ActivityDraft[]) => ActivityDraft[]) =>
    setModules((prev) =>
      prev.map((m, i) => {
        if (i !== target.mIndex) return m;
        if (target.uIndex === null) return { ...m, activities: fn(m.activities) };
        return {
          ...m,
          units: m.units.map((u, j) => (j === target.uIndex ? { ...u, activities: fn(u.activities) } : u)),
        };
      })
    );

  // Picking a type opens the settings form rather than adding the row straight
  // away, so the name and description are filled in first.
  const startNewActivity = (target: PickerTarget, type: string) => {
    setPicker(null);
    setEditing({
      target,
      isNew: true,
      draft: { key: nextKey(), type, title: "", description: "", url: "" },
    });
  };

  const editActivity = (target: PickerTarget, act: ActivityDraft) =>
    setEditing({ target, isNew: false, draft: act });

  // Called when the settings form is saved: append a new row or replace the edited one.
  const commitActivity = (draft: ActivityDraft) => {
    if (!editing) return;
    const { target, isNew } = editing;
    mapActivities(target, (list) =>
      isNew ? [...list, draft] : list.map((a) => (a.key === draft.key ? draft : a))
    );
    setEditing(null);
  };

  const removeActivity = (target: PickerTarget, key: string) =>
    mapActivities(target, (list) => {
      const gone = list.find((a) => a.key === key);
      if (gone?.id) setDeletedActivityIds((d) => [...d, gone.id as number]);
      return list.filter((a) => a.key !== key);
    });

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

      // 2) Sync the modules — and the units and activities inside them.
      if (cid) {
        const json = { "Content-Type": "application/json" };

        // Save one module/unit row, then the activities that hang off it.
        const saveActivities = async (ownerId: number, activities: ActivityDraft[]) => {
          for (const act of activities) {
            const actBody = JSON.stringify({
              type: act.type,
              title: act.title || typeInfo(act.type).label,
              description: act.description || null,
              url: act.url || null,
            });
            if (act.id) {
              await fetch(`${API}/activities/${act.id}`, { method: "PUT", headers: json, body: actBody });
            } else {
              await fetch(`${API}/modules/${ownerId}/activities`, { method: "POST", headers: json, body: actBody });
            }
          }
        };

        for (const mod of modules) {
          const body = JSON.stringify({ title: mod.title || "Untitled module" });

          // A new module has no id yet, and its units need one as their
          // parent_id, so keep the id the backend hands back.
          let moduleId = mod.id;
          if (moduleId) {
            await fetch(`${API}/modules/${moduleId}`, { method: "PUT", headers: json, body });
          } else {
            const created = await fetch(`${API}/courses/${cid}/modules`, { method: "POST", headers: json, body });
            const createdData = await created.json().catch(() => ({}));
            moduleId = createdData?.module?.id;
          }
          if (!moduleId) continue; // the module did not save; skip what it holds

          await saveActivities(moduleId, mod.activities);

          for (const unit of mod.units) {
            const unitBody = JSON.stringify({
              title: unit.title || "Untitled unit",
              parent_id: moduleId,
            });

            let unitId = unit.id;
            if (unitId) {
              await fetch(`${API}/modules/${unitId}`, { method: "PUT", headers: json, body: unitBody });
            } else {
              const created = await fetch(`${API}/courses/${cid}/modules`, { method: "POST", headers: json, body: unitBody });
              const createdData = await created.json().catch(() => ({}));
              unitId = createdData?.module?.id;
            }
            if (unitId) await saveActivities(unitId, unit.activities);
          }
        }

        // Deleting a module or unit clears its activities server-side, so only
        // individually removed activities need their own call.
        for (const aid of deletedActivityIds) {
          await fetch(`${API}/activities/${aid}`, { method: "DELETE" });
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
                          <input
                            type="text"
                            value={mod.title}
                            onChange={(e) => updateModule(index, "title", e.target.value)}
                            placeholder="Module title"
                            className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <button type="button" onClick={() => removeModule(index)} className="text-xs text-red-600 hover:underline px-2">
                            Remove
                          </button>
                        </div>

                        <ActivityList
                          activities={mod.activities}
                          onAdd={() => setPicker({ mIndex: index, uIndex: null })}
                          onEdit={(act) => editActivity({ mIndex: index, uIndex: null }, act)}
                          onRemove={(key) => removeActivity({ mIndex: index, uIndex: null }, key)}
                        />

                        {/* ---- Units (sub-modules) inside this module ---- */}
                        <div className="mt-4 pl-4 border-l-2 border-indigo-100">
                          <div className="flex items-center justify-between mb-2">
                            <h4 className="text-xs font-semibold text-gray-600">
                              Units{mod.units.length > 0 ? ` (${mod.units.length})` : ""}
                            </h4>
                            <button type="button" onClick={() => addUnit(index)} className="text-xs bg-gray-100 text-gray-700 px-2.5 py-1 rounded-md hover:bg-gray-200 font-medium">
                              + Add unit
                            </button>
                          </div>

                          {mod.units.length === 0 ? (
                            <p className="text-xs text-gray-400 pb-1">
                              No units yet. Add units to split this module into smaller parts.
                            </p>
                          ) : (
                            <div className="space-y-3">
                              {mod.units.map((unit, uIndex) => (
                                <div key={uIndex} className="border border-gray-200 rounded-md p-3 bg-gray-50">
                                  <div className="flex items-center gap-2 mb-2">
                                    <span className="text-xs font-semibold text-gray-400">{uIndex + 1}.</span>
                                    <input
                                      type="text"
                                      value={unit.title}
                                      onChange={(e) => updateUnit(index, uIndex, "title", e.target.value)}
                                      placeholder={`Unit ${uIndex + 1} title`}
                                      className="flex-1 border border-gray-300 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                    />
                                    <button type="button" onClick={() => removeUnit(index, uIndex)} className="text-xs text-red-600 hover:underline px-2">
                                      Remove
                                    </button>
                                  </div>

                                  <ActivityList
                                    activities={unit.activities}
                                    onAdd={() => setPicker({ mIndex: index, uIndex })}
                                    onEdit={(act) => editActivity({ mIndex: index, uIndex }, act)}
                                    onRemove={(key) => removeActivity({ mIndex: index, uIndex }, key)}
                                  />
                                </div>
                              ))}
                            </div>
                          )}
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

      {picker && <ActivityPicker onPick={(type) => startNewActivity(picker, type)} onClose={() => setPicker(null)} />}

      {editing && (
        <ActivityForm
          key={editing.draft.key}
          draft={editing.draft}
          isNew={editing.isNew}
          onUpload={uploadFile}
          onSave={commitActivity}
          onCancel={() => setEditing(null)}
        />
      )}
    </div>
  );
}

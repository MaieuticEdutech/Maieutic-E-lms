"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Sidebar from "@/components/Sidebar";
import {
  ArrowLeft,
  BookOpen,
  ChevronDown,
  ChevronRight,
  ClipboardList,
  Edit3,
  FileText,
  HelpCircle,
  Link as LinkIcon,
  Music,
  PlayCircle,
  UserPlus,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
const BACKEND = API.replace(/\/api\/?$/, "");

type Activity = {
  id: number;
  type: string;
  title: string;
  description: string | null;
  url: string | null;
};

type Unit = {
  id: number;
  title: string;
  activities: Activity[];
};

// A module is a unit that carries its own units (see backend/routes/modules.js).
type Module = Unit & { units: Unit[] };

type Course = {
  id: number;
  title: string;
  instructor?: string | null;
  category?: string | null;
  short_description?: string | null;
  image_url?: string | null;
  status?: string | null;
};

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : "An unexpected error occurred.";
}

// Icon and label per activity type; mirrors ACTIVITY_TYPES in the course editor.
const TYPE_INFO: Record<string, { label: string; Icon: typeof FileText }> = {
  pdf: { label: "PDF", Icon: FileText },
  video: { label: "Video", Icon: PlayCircle },
  audio: { label: "Audio", Icon: Music },
  assignment: { label: "Assignment", Icon: ClipboardList },
  quiz: { label: "Quiz", Icon: HelpCircle },
  link: { label: "Link", Icon: LinkIcon },
};

const infoFor = (type: string) => TYPE_INFO[type] ?? { label: type, Icon: FileText };

// The activities and resources inside a module or a unit.
function ActivityRows({ activities }: { activities: Activity[] }) {
  if (activities.length === 0) {
    return <span className="text-xs text-gray-400">No activities or resources yet</span>;
  }
  return (
    <div className="space-y-1.5">
      {activities.map((act) => {
        const { label, Icon } = infoFor(act.type);
        // A link activity stores an absolute URL; an upload stores a /uploads path.
        const href = act.url ? (act.type === "link" ? act.url : `${BACKEND}${act.url}`) : null;
        return (
          <div key={act.id} className="flex items-start gap-2">
            <Icon className="w-4 h-4 text-indigo-500 shrink-0 mt-0.5" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer" className="text-sm text-indigo-700 hover:underline">
                    {act.title}
                  </a>
                ) : (
                  <span className="text-sm text-gray-700">{act.title}</span>
                )}
                <span className="text-[11px] uppercase tracking-wide text-gray-400">{label}</span>
                {!href && <span className="text-[11px] text-amber-600">no file</span>}
              </div>
              {act.description && <p className="text-xs text-gray-500 mt-0.5">{act.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function CourseDetail() {
  const params = useParams();
  const courseId = params?.id as string;

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modules start expanded so the units are visible straight away; this holds
  // the ids the user has clicked shut.
  const [collapsed, setCollapsed] = useState<number[]>([]);

  useEffect(() => {
    if (!courseId) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [cRes, mRes] = await Promise.all([
          fetch(`${API}/courses/${courseId}`),
          fetch(`${API}/courses/${courseId}/modules`),
        ]);
        if (!cRes.ok) throw new Error(`Could not load the course (${cRes.status})`);

        const cData = await cRes.json();
        const mData = mRes.ok ? await mRes.json() : { modules: [] };
        if (cancelled) return;

        setCourse(cData.course ?? cData);
        setModules(
          (mData.modules ?? []).map((m: Module) => ({
            ...m,
            activities: m.activities ?? [],
            units: (m.units ?? []).map((u) => ({ ...u, activities: u.activities ?? [] })),
          }))
        );
      } catch (err: unknown) {
        if (!cancelled) setError(getErrorMessage(err));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [courseId]);

  const toggle = (id: number) =>
    setCollapsed((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const totalUnits = modules.reduce((sum, m) => sum + m.units.length, 0);

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="super_admin" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-4xl mx-auto">
          <Link href="/admin/courses" className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-700 mb-4">
            <ArrowLeft className="w-4 h-4" /> Back to Courses
          </Link>

          {error && (
            <div className="mb-4 rounded-lg border border-red-200 bg-red-50 text-red-700 px-4 py-3 text-sm">{error}</div>
          )}

          {loading ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 border">Loading course…</div>
          ) : !course ? (
            <div className="bg-white rounded-xl p-12 text-center text-gray-400 border">This course could not be found.</div>
          ) : (
            <>
              {/* ---- Course header ---- */}
              <div className="bg-white rounded-xl shadow-sm border overflow-hidden mb-6">
                <div className="relative h-48 bg-gradient-to-br from-indigo-500 to-purple-600">
                  {course.image_url ? (
                    <img src={`${BACKEND}${course.image_url}`} alt={course.title} className="absolute inset-0 w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-white">
                      <BookOpen className="w-12 h-12 opacity-80" />
                    </div>
                  )}
                  <span className={`absolute top-3 right-3 text-xs font-medium px-2.5 py-1 rounded-full ${course.status === "Published" ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"}`}>
                    {course.status || "Draft"}
                  </span>
                </div>

                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">{course.title}</h1>
                      <p className="text-sm text-gray-500 mt-1">
                        {course.instructor || "—"}
                        {course.category ? ` · ${course.category}` : ""}
                      </p>
                      {course.short_description && (
                        <p className="text-sm text-gray-600 mt-2">{course.short_description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <Link href={`/admin/courses/${course.id}/enroll`} className="inline-flex items-center gap-1.5 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-blue-100">
                        <UserPlus className="w-4 h-4" /> Enroll
                      </Link>
                      <Link href={`/admin/courses/add?id=${course.id}`} className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 text-sm font-medium px-3 py-2 rounded-lg hover:bg-emerald-100">
                        <Edit3 className="w-4 h-4" /> Edit
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              {/* ---- Modules, each expandable to reveal its units ---- */}
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-lg font-semibold text-gray-900">Course Content</h2>
                <span className="text-sm text-gray-400">
                  {modules.length} module{modules.length === 1 ? "" : "s"} · {totalUnits} unit{totalUnits === 1 ? "" : "s"}
                </span>
              </div>

              {modules.length === 0 ? (
                <div className="bg-white rounded-xl p-10 text-center text-gray-400 border">
                  No modules yet.{" "}
                  <Link href={`/admin/courses/add?id=${course.id}`} className="text-indigo-600 hover:underline">
                    Add modules and units
                  </Link>
                  .
                </div>
              ) : (
                <div className="space-y-3">
                  {modules.map((mod) => {
                    const isOpen = !collapsed.includes(mod.id);
                    return (
                      <div key={mod.id} className="bg-white rounded-xl shadow-sm border overflow-hidden">
                        {/* Click the module name to show or hide its units. */}
                        <button
                          type="button"
                          onClick={() => toggle(mod.id)}
                          aria-expanded={isOpen}
                          className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50"
                        >
                          {isOpen ? (
                            <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-gray-400 shrink-0" />
                          )}
                          <span className="flex-1 font-medium text-gray-900">{mod.title}</span>
                          <span className="text-xs text-gray-400">
                            {mod.units.length} unit{mod.units.length === 1 ? "" : "s"}
                          </span>
                        </button>

                        {isOpen && (
                          <div className="px-4 pb-4 border-t pt-3">
                            <div className="mb-3">
                              <ActivityRows activities={mod.activities} />
                            </div>

                            {mod.units.length === 0 ? (
                              <p className="text-xs text-gray-400 pl-4 border-l-2 border-gray-100">
                                No units in this module yet.
                              </p>
                            ) : (
                              <div className="space-y-2 pl-4 border-l-2 border-indigo-100">
                                {mod.units.map((unit, uIndex) => (
                                  <div key={unit.id} className="bg-gray-50 rounded-lg px-3 py-2.5">
                                    <div className="flex items-center gap-2 mb-1.5">
                                      <span className="text-xs font-semibold text-gray-400">{uIndex + 1}.</span>
                                      <span className="text-sm font-medium text-gray-800">{unit.title}</span>
                                    </div>
                                    <ActivityRows activities={unit.activities} />
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}

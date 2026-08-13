"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, BookOpen, Users, GraduationCap, Settings,
  FileText, BarChart3, ClipboardList, Award, HelpCircle, LogOut,
  ChevronLeft, ChevronRight
} from "lucide-react";
import { useState } from "react";

const navConfig: Record<string, { label: string; href: string; icon: React.ReactNode }[]> = {
  super_admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Courses", href: "/admin/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Students", href: "/admin/students", icon: <Users className="w-5 h-5" /> },
    { label: "Instructors", href: "/admin/instructors", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Enrollments", href: "#", icon: <ClipboardList className="w-5 h-5" /> },
    { label: "Payments", href: "#", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Reports", href: "#", icon: <FileText className="w-5 h-5" /> },
    { label: "Settings", href: "#", icon: <Settings className="w-5 h-5" /> },
  ],
  admin: [
    { label: "Dashboard", href: "/admin/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Courses", href: "/admin/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Students", href: "/admin/students", icon: <Users className="w-5 h-5" /> },
    { label: "Instructors", href: "/admin/instructors", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Settings", href: "#", icon: <Settings className="w-5 h-5" /> },
  ],
  instructor: [
    { label: "Dashboard", href: "/instructor/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "My Courses", href: "/instructor/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "Students", href: "/instructor/students", icon: <Users className="w-5 h-5" /> },
    { label: "Tests", href: "/instructor/tests/create", icon: <FileText className="w-5 h-5" /> },
    { label: "Results", href: "/instructor/tests/results", icon: <BarChart3 className="w-5 h-5" /> },
    { label: "Profile", href: "#", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Settings", href: "#", icon: <Settings className="w-5 h-5" /> },
  ],
  student: [
    { label: "Dashboard", href: "/student/dashboard", icon: <LayoutDashboard className="w-5 h-5" /> },
    { label: "Browse Courses", href: "/student/courses", icon: <BookOpen className="w-5 h-5" /> },
    { label: "My Courses", href: "/student/my-courses", icon: <Award className="w-5 h-5" /> },
    { label: "Tests", href: "#", icon: <FileText className="w-5 h-5" /> },
    { label: "Certificates", href: "#", icon: <Award className="w-5 h-5" /> },
    { label: "Profile", href: "#", icon: <GraduationCap className="w-5 h-5" /> },
    { label: "Settings", href: "#", icon: <Settings className="w-5 h-5" /> },
  ],
};

export default function Sidebar({ role = "student" }: { role?: string }) {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const items = navConfig[role] || navConfig.student;

  return (
    <aside className={`h-screen bg-slate-900 text-white flex flex-col transition-all duration-300 ${collapsed ? "w-20" : "w-64"}`}>
      <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-teal-500 rounded-lg flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 50 30"><polygon points="0,15 25,0 25,30" fill="#991b1b"/><polygon points="25,0 50,15 25,30" fill="#14b8a6"/></svg>
            </div>
            <span className="font-bold text-lg">LMS</span>
          </div>
        )}
        <button onClick={() => setCollapsed(!collapsed)} className="p-1 hover:bg-slate-800 rounded">
          {collapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronLeft className="w-5 h-5" />}
        </button>
      </div>

      <nav className="flex-1 py-4 space-y-1 px-3">
        {items.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.label} href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition ${
                active ? "bg-teal-600 text-white" : "text-slate-400 hover:bg-slate-800 hover:text-white"
              }`}>
              {item.icon}
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-800 space-y-1">
        <button className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-white text-sm w-full">
          <HelpCircle className="w-5 h-5" />
          {!collapsed && <span>Help</span>}
        </button>
        <button className="flex items-center gap-3 px-3 py-2.5 text-slate-400 hover:text-red-400 text-sm w-full"
          onClick={() => { localStorage.removeItem('token'); window.location.href = '/login'; }}>
          <LogOut className="w-5 h-5" />
          {!collapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
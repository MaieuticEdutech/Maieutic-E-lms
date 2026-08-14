"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";

export default function CreateTest() {
  const [activeTab, setActiveTab] = useState("details");

  return (
    <div className="flex min-h-screen bg-gray-50">
      <Sidebar role="instructor" />
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Test</h1>

          <div className="bg-white rounded-xl shadow-sm border">
            <div className="flex border-b">
              {["details", "questions", "settings"].map((tab) => (
                <button key={tab} onClick={() => setActiveTab(tab)}
                  className={`px-6 py-3 text-sm font-medium capitalize border-b-2 transition ${activeTab === tab ? "border-blue-600 text-blue-600" : "border-transparent text-gray-500 hover:text-gray-700"}`}>
                  {tab}
                </button>
              ))}
            </div>

            <div className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Test Title</label>
                <input type="text" placeholder="e.g. Python Basics Test" className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea rows={3} placeholder="This test covers Python basics..." className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Total Marks</label>
                  <input type="number" defaultValue={50} className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Duration (min)</label>
                  <input type="number" defaultValue={60} className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Passing %</label>
                  <input type="number" defaultValue={50} className="w-full px-4 py-2.5 border rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input type="checkbox" id="published" className="w-4 h-4 rounded text-blue-600" />
                <label htmlFor="published" className="text-sm text-gray-700">Published</label>
              </div>
              <div className="flex justify-end">
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-lg text-sm font-medium hover:bg-blue-700">Next</button>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
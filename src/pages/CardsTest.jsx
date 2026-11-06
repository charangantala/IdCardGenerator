import React, { useState } from 'react';
import IdCard from '../components/IdCard/IdCard';
import { SAMPLE_STUDENTS, SAMPLE_TEMPLATES } from '../utils/sampleData';

export default function CardsTest() {
  // Configurable template for card 1 so the user can test changing JSON live
  const [activeTemplate, setActiveTemplate] = useState({ ...SAMPLE_TEMPLATES.classicBlue });
  const [selectedStudentIndex, setSelectedStudentIndex] = useState(0);

  const student1 = SAMPLE_STUDENTS[0];
  const student2 = SAMPLE_STUDENTS[1];
  const student3 = SAMPLE_STUDENTS[2];

  return (
    <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8 space-y-10">
      {/* Page Title */}
      <div className="border-b pb-4">
        <div className="flex flex-wrap justify-between items-center gap-4">
          <div>
            <span className="text-xs font-bold text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded">
              Phase 1 Deliverable
            </span>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mt-1">
              Reusable IdCard Showcase
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Pure presentational <code className="text-blue-700 bg-blue-50 px-1 py-0.5 rounded font-mono text-xs">IdCard</code> component driven by student and template JSON props.
            </p>
          </div>
        </div>
      </div>

      {/* Section 1: 3 Pre-configured Sample Templates Side-by-Side */}
      <section>
        <div className="mb-4">
          <h2 className="text-xl font-bold text-gray-800">
            1. Three Sample Colleges & Templates Side-by-Side
          </h2>
          <p className="text-xs text-gray-500">
            Demonstrates Vertical vs. Horizontal layouts, photo shapes (Circle, Rounded, Square), custom colors, and fonts.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          {/* Card 1: Classic Navy Vertical */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b">
              <span className="font-semibold text-xs text-gray-700">MIT College (Navy Blue)</span>
              <span className="text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded font-bold uppercase">
                Vertical • Circle Photo
              </span>
            </div>
            <div className="py-2">
              <IdCard student={student1} template={SAMPLE_TEMPLATES.classicBlue} />
            </div>
            <div className="w-full mt-4 p-2.5 bg-slate-50 rounded-lg text-[11px] text-gray-500 font-mono">
              Font: Poppins | Primary: #1e3a8a | Shape: Circle
            </div>
          </div>

          {/* Card 2: Modern Emerald Horizontal */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b">
              <span className="font-semibold text-xs text-gray-700">Apex Tech (Emerald)</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded font-bold uppercase">
                Horizontal • Rounded Photo
              </span>
            </div>
            <div className="py-2 overflow-x-auto max-w-full">
              <IdCard student={student2} template={SAMPLE_TEMPLATES.modernEmerald} />
            </div>
            <div className="w-full mt-4 p-2.5 bg-slate-50 rounded-lg text-[11px] text-gray-500 font-mono">
              Font: Montserrat | Primary: #065f46 | Shape: Rounded
            </div>
          </div>

          {/* Card 3: Crimson Tech Vertical */}
          <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm flex flex-col items-center">
            <div className="w-full flex items-center justify-between mb-4 pb-2 border-b">
              <span className="font-semibold text-xs text-gray-700">Stanford Eng (Crimson)</span>
              <span className="text-[10px] bg-rose-100 text-rose-800 px-2 py-0.5 rounded font-bold uppercase">
                Vertical • Square Photo
              </span>
            </div>
            <div className="py-2">
              <IdCard student={student3} template={SAMPLE_TEMPLATES.crimsonTech} />
            </div>
            <div className="w-full mt-4 p-2.5 bg-slate-50 rounded-lg text-[11px] text-gray-500 font-mono">
              Font: Inter | Primary: #991b1b | Shape: Square
            </div>
          </div>
        </div>
      </section>

      {/* Section 2: Interactive Live Template Tweaker */}
      <section className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-xl font-bold text-gray-900">
            2. Live Verification: Change Template JSON in Real-Time
          </h2>
          <p className="text-xs text-gray-500">
            Test the acceptance criterion: <em>"Changing the template JSON visibly changes the card."</em>
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Controls on Left */}
          <div className="lg:col-span-6 space-y-4 bg-slate-50 p-5 rounded-xl border border-slate-200">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">
                Quick Template Presets
              </span>
              <div className="flex space-x-1.5">
                <button
                  type="button"
                  onClick={() => setActiveTemplate({ ...SAMPLE_TEMPLATES.classicBlue })}
                  className="px-2.5 py-1 text-xs bg-blue-600 text-white font-medium rounded hover:bg-blue-700 shadow-xs"
                >
                  Navy Blue
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplate({ ...SAMPLE_TEMPLATES.modernEmerald })}
                  className="px-2.5 py-1 text-xs bg-emerald-700 text-white font-medium rounded hover:bg-emerald-800 shadow-xs"
                >
                  Emerald
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTemplate({ ...SAMPLE_TEMPLATES.crimsonTech })}
                  className="px-2.5 py-1 text-xs bg-rose-700 text-white font-medium rounded hover:bg-rose-800 shadow-xs"
                >
                  Crimson
                </button>
              </div>
            </div>

            {/* Layout Toggle */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Card Layout
              </label>
              <div className="flex space-x-2">
                {['vertical', 'horizontal'].map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => setActiveTemplate((prev) => ({ ...prev, layout: l }))}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize border ${
                      activeTemplate.layout === l
                        ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                        : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Pickers */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Primary Color
                </label>
                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border">
                  <input
                    type="color"
                    value={activeTemplate.colors.primary}
                    onChange={(e) =>
                      setActiveTemplate((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, primary: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono text-gray-700 uppercase">
                    {activeTemplate.colors.primary}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Secondary Accent Color
                </label>
                <div className="flex items-center space-x-2 bg-white p-1.5 rounded-lg border">
                  <input
                    type="color"
                    value={activeTemplate.colors.secondary}
                    onChange={(e) =>
                      setActiveTemplate((prev) => ({
                        ...prev,
                        colors: { ...prev.colors, secondary: e.target.value },
                      }))
                    }
                    className="w-8 h-8 rounded border cursor-pointer p-0"
                  />
                  <span className="text-xs font-mono text-gray-700 uppercase">
                    {activeTemplate.colors.secondary}
                  </span>
                </div>
              </div>
            </div>

            {/* Font & Photo Shape */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Typography Font
                </label>
                <select
                  value={activeTemplate.font}
                  onChange={(e) =>
                    setActiveTemplate((prev) => ({ ...prev, font: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="Poppins">Poppins</option>
                  <option value="Inter">Inter</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Roboto">Roboto</option>
                  <option value="Open Sans">Open Sans</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Photo Shape
                </label>
                <select
                  value={activeTemplate.photoShape}
                  onChange={(e) =>
                    setActiveTemplate((prev) => ({ ...prev, photoShape: e.target.value }))
                  }
                  className="w-full text-xs p-2 rounded-lg border border-gray-300 bg-white"
                >
                  <option value="circle">Circle (Round)</option>
                  <option value="rounded">Rounded Rectangle</option>
                  <option value="square">Square (Sharp)</option>
                </select>
              </div>
            </div>

            {/* Corner Radius & QR Toggle */}
            <div className="grid grid-cols-2 gap-4 items-center">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Corner Radius: {activeTemplate.cornerRadius}px
                </label>
                <input
                  type="range"
                  min="0"
                  max="24"
                  value={activeTemplate.cornerRadius}
                  onChange={(e) =>
                    setActiveTemplate((prev) => ({
                      ...prev,
                      cornerRadius: Number(e.target.value),
                    }))
                  }
                  className="w-full accent-blue-600"
                />
              </div>

              <div className="pt-4">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={activeTemplate.showQR}
                    onChange={(e) =>
                      setActiveTemplate((prev) => ({ ...prev, showQR: e.target.checked }))
                    }
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <span className="text-xs font-semibold text-gray-700">
                    Include Verification QR
                  </span>
                </label>
              </div>
            </div>

            {/* Student Switcher */}
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Select Preview Student
              </label>
              <div className="grid grid-cols-3 gap-2">
                {SAMPLE_STUDENTS.map((st, i) => (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => setSelectedStudentIndex(i)}
                    className={`p-2 text-left rounded-lg border text-xs transition-colors ${
                      selectedStudentIndex === i
                        ? 'border-blue-600 bg-blue-50 font-semibold text-blue-800'
                        : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="truncate font-bold">{st.name}</div>
                    <div className="truncate text-[10px] text-gray-500">{st.collegeCode}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Live Preview Display on Right */}
          <div className="lg:col-span-6 flex flex-col items-center justify-center bg-slate-100 p-8 rounded-2xl border border-slate-200 min-h-[480px]">
            <span className="text-[11px] font-bold uppercase tracking-wider text-gray-400 mb-4">
              Real-Time Output Preview
            </span>
            <div className="max-w-full overflow-x-auto py-2">
              <IdCard
                student={SAMPLE_STUDENTS[selectedStudentIndex]}
                template={activeTemplate}
              />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}


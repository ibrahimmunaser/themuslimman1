"use client";

import { useState } from "react";
import { CheckCircle2, Video, FileText, BookOpen, Map } from "lucide-react";
import { Badge } from "@/components/ui/badge";

type TabType = "video" | "briefing" | "study-guide" | "mindmap";

export function Part1Preview() {
  const [activeTab, setActiveTab] = useState<TabType>("video");

  return (
    <>
      {/* Part 1 Preview Content */}
      <div className="rounded-2xl border border-gold/20 bg-surface overflow-hidden mb-6">
        <div className="p-4 bg-surface-raised border-b border-border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs text-text-muted uppercase tracking-wider">Free Preview</p>
              <h3 className="text-lg font-bold text-text">Part 1: Pre-Islamic Arabia</h3>
            </div>
            <Badge variant="gold" size="sm">Free</Badge>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border overflow-x-auto">
          {[
            { id: "video" as TabType, label: "Video" },
            { id: "briefing" as TabType, label: "Briefing" },
            { id: "study-guide" as TabType, label: "Study Guide" },
            { id: "mindmap" as TabType, label: "Mindmap" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium transition-colors flex-shrink-0 ${
                activeTab === tab.id
                  ? "border-b-2 border-gold text-gold bg-gold/5"
                  : "text-text-muted hover:text-text hover:bg-surface-raised"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="min-h-[400px]">
          {/* Video Tab */}
          {activeTab === "video" && (
            <div>
              <div className="aspect-video bg-ink">
                <iframe
                  className="w-full h-full"
                  src="https://www.youtube.com/embed/dQw4w9WgXcQ"
                  title="Part 1: Pre-Islamic Arabia"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>
              <div className="p-6">
                <h4 className="font-semibold text-text mb-3">What You'll Learn:</h4>
                <ul className="space-y-2 mb-6">
                  {[
                    "Why Arabia's geography mattered before Islam",
                    "The tribal system and how it shaped society",
                    "Trade routes and Arabia's economic role",
                    "The surrounding empires: Byzantine and Persian influence",
                    "Religious landscape: polytheism, Christianity, Judaism",
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-sm text-text-secondary">
                      <CheckCircle2 className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
                      {item}
                    </li>
                  ))}
                </ul>

                <div className="p-4 rounded-lg bg-gold-bg border border-gold/20">
                  <p className="text-sm text-text-secondary italic">
                    <span className="font-semibold text-text">First Win Promise:</span> Within this first lesson, you'll understand why Arabia's geography, tribes, trade routes, and surrounding empires mattered before revelation began.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Briefing Tab */}
          {activeTab === "briefing" && (
            <div className="p-6">
              <div className="prose prose-invert max-w-none">
                <h4 className="text-lg font-bold text-text mb-4">Part 1: Pre-Islamic Arabia — Briefing</h4>
                
                <div className="space-y-4 text-sm text-text-secondary leading-relaxed">
                  <p>
                    Before the birth of Prophet Muhammad ﷺ, the Arabian Peninsula was a land shaped by harsh geography, tribal loyalty, and strategic trade routes. Understanding this context is essential to appreciating how Islam emerged and transformed the region.
                  </p>

                  <div className="bg-surface-raised p-4 rounded-lg border border-border">
                    <h5 className="font-semibold text-text mb-2">Geographic Context</h5>
                    <p>
                      Arabia is a vast desert peninsula, bordered by the Red Sea to the west and the Persian Gulf to the east. Most of the land is harsh and uninhabitable, with scattered oases serving as vital centers of settlement and agriculture.
                    </p>
                  </div>

                  <div className="bg-surface-raised p-4 rounded-lg border border-border">
                    <h5 className="font-semibold text-text mb-2">Tribal Structure</h5>
                    <p>
                      Arab society was organized around tribes (qabilah), with loyalty to one's tribe being paramount. Honor, courage, and hospitality were highly valued. This tribal system would both challenge and be transformed by Islam's message of universal brotherhood.
                    </p>
                  </div>

                  <div className="bg-surface-raised p-4 rounded-lg border border-border">
                    <h5 className="font-semibold text-text mb-2">Trade & Economy</h5>
                    <p>
                      Makkah and Madinah were key stops on trade routes connecting Yemen, Syria, and beyond. The Quraysh tribe controlled Makkah and grew wealthy from trade and pilgrimage to the Kaaba.
                    </p>
                  </div>

                  <div className="bg-surface-raised p-4 rounded-lg border border-border">
                    <h5 className="font-semibold text-text mb-2">Religious Landscape</h5>
                    <p>
                      Most Arabs practiced polytheism, worshipping idols housed in the Kaaba. Jewish and Christian communities also existed, particularly in Yemen and the north. Some individuals, known as hanifs, rejected idolatry and sought monotheism.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Study Guide Tab */}
          {activeTab === "study-guide" && (
            <div className="p-6">
              <h4 className="text-lg font-bold text-text mb-4">Part 1: Study Guide</h4>
              
              <div className="space-y-6">
                <div>
                  <h5 className="font-semibold text-text mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center">1</span>
                    Key Questions
                  </h5>
                  <ul className="space-y-2 ml-8">
                    {[
                      "Why was Arabia's location strategically important?",
                      "How did the tribal system shape Arab society?",
                      "What role did the Kaaba play in pre-Islamic Arabia?",
                      "How did trade influence Makkan society?",
                      "What religions existed in Arabia before Islam?",
                    ].map((q) => (
                      <li key={q} className="text-sm text-text-secondary flex items-start gap-2">
                        <span className="text-gold mt-1">•</span>
                        {q}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <h5 className="font-semibold text-text mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center">2</span>
                    Key Terms to Know
                  </h5>
                  <div className="grid sm:grid-cols-2 gap-3 ml-8">
                    {[
                      { term: "Qabilah", def: "Tribe or clan" },
                      { term: "Jahiliyyah", def: "Period of ignorance (pre-Islam)" },
                      { term: "Hanif", def: "Monotheist rejecting idolatry" },
                      { term: "Quraysh", def: "Dominant tribe of Makkah" },
                    ].map((item) => (
                      <div key={item.term} className="p-3 rounded-lg bg-surface-raised border border-border">
                        <p className="font-semibold text-gold text-sm">{item.term}</p>
                        <p className="text-xs text-text-muted">{item.def}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h5 className="font-semibold text-text mb-3 flex items-center gap-2">
                    <span className="w-6 h-6 rounded-full bg-gold/20 text-gold text-xs flex items-center justify-center">3</span>
                    Reflection Points
                  </h5>
                  <ul className="space-y-2 ml-8">
                    {[
                      "How did geography influence Arab culture and values?",
                      "What parallels exist between pre-Islamic tribal loyalty and modern nationalism?",
                      "Why was monotheism so rare in this environment?",
                    ].map((r) => (
                      <li key={r} className="text-sm text-text-secondary flex items-start gap-2">
                        <span className="text-gold mt-1">→</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Mindmap Tab */}
          {activeTab === "mindmap" && (
            <div className="p-6">
              <h4 className="text-lg font-bold text-text mb-4">Part 1: Visual Mindmap</h4>
              
              <div className="bg-surface-raised border border-border rounded-xl p-8">
                <div className="text-center mb-8">
                  <div className="inline-block px-6 py-3 rounded-lg bg-gold/10 border-2 border-gold/30">
                    <p className="font-bold text-text text-lg">Pre-Islamic Arabia</p>
                  </div>
                </div>

                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      title: "Geography",
                      items: ["Desert Peninsula", "Scattered Oases", "Red Sea & Gulf", "Trade Routes"],
                      color: "blue",
                    },
                    {
                      title: "Society",
                      items: ["Tribal Structure", "Oral Tradition", "Honor Culture", "Blood Feuds"],
                      color: "purple",
                    },
                    {
                      title: "Economy",
                      items: ["Trade", "Livestock", "Agriculture", "Pilgrimage"],
                      color: "green",
                    },
                    {
                      title: "Religion",
                      items: ["Polytheism", "Judaism", "Christianity", "Hanifs"],
                      color: "orange",
                    },
                  ].map((branch) => (
                    <div key={branch.title} className="relative">
                      <div className="p-4 rounded-lg border border-border bg-surface">
                        <h5 className="font-bold text-text mb-3 flex items-center gap-2">
                          <div className={`w-3 h-3 rounded-full bg-${branch.color}-500/50`} />
                          {branch.title}
                        </h5>
                        <ul className="space-y-2">
                          {branch.items.map((item) => (
                            <li key={item} className="text-sm text-text-secondary flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-gold" />
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 text-center">
                  <p className="text-xs text-text-muted italic">
                    This simplified mindmap shows the four main aspects covered in Part 1
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* What You Get in Every Part */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { icon: <Video className="w-5 h-5" />, label: "Full Video Lesson" },
          { icon: <FileText className="w-5 h-5" />, label: "Briefing Document" },
          { icon: <BookOpen className="w-5 h-5" />, label: "Study Guide" },
          { icon: <Map className="w-5 h-5" />, label: "Visual Mindmap" },
        ].map((item) => (
          <div key={item.label} className="flex items-center gap-3 p-4 rounded-xl border border-border bg-surface">
            <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/20 flex items-center justify-center text-gold">
              {item.icon}
            </div>
            <span className="text-sm font-medium text-text">{item.label}</span>
          </div>
        ))}
      </div>
    </>
  );
}

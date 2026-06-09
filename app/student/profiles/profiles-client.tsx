"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Plus, Edit2, Trash2, ArrowLeft,
  Video, BookOpen, Brain, ClipboardCheck,
  Image, Map, FileText, Layers, BarChart2,
  ChevronRight, Check,
} from "lucide-react";
import {
  createProfile,
  updateProfile,
  deleteProfile,
  switchProfile,
} from "@/app/actions/profiles";

// ─── Types ────────────────────────────────────────────────────

interface ProfileStats {
  completedParts: number;
  totalParts: number;
  completionPercent: number;
  videosCompleted: number;
  briefingsOpened: number;
  slidesViewed: number;
  infographicsViewed: number;
  mindmapsViewed: number;
  audioCompleted: number;
  flashcardsStudied: number;
  quizzesPassed: number;
  factsViewed: number;
  lastActivity: Date | null;
}

interface ProfileData {
  id: string;
  displayName: string;
  avatar: string | null;
  isDefault: boolean;
  createdAt: Date;
  stats: ProfileStats;
}

interface ProfilesClientProps {
  profiles: ProfileData[];
  isFamily: boolean;
  profileLimit: number;
  currentUserId: string;
  activeProfileId: string | null;
}

// Avatar options
const AVATARS = [
  "🌙", "⭐", "📖", "🌿", "🕌", "🦋",
  "🌸", "🏅", "🌺", "🎯", "📚", "✨",
  "🦁", "🐬", "🦅", "🌊", "🏔️", "🌍",
];

// Distinct tile background colors per slot (Netflix-style)
const TILE_COLORS = [
  "from-amber-900/80 to-amber-800/40",
  "from-violet-900/80 to-violet-800/40",
  "from-teal-900/80 to-teal-800/40",
  "from-rose-900/80 to-rose-800/40",
  "from-sky-900/80 to-sky-800/40",
];

// ─── Main component ───────────────────────────────────────────

export function ProfilesClient({
  profiles,
  isFamily,
  profileLimit,
  activeProfileId,
}: ProfilesClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [selectedProfile, setSelectedProfile] = useState<ProfileData | null>(null);
  const [mode, setMode] = useState<"list" | "new" | "edit" | "detail">("list");
  const [formName, setFormName] = useState("");
  const [formAvatar, setFormAvatar] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [switchingId, setSwitchingId] = useState<string | null>(null);

  const canAddMore = profiles.length < profileLimit;

  function showMessage(msg: string) {
    setActionMessage(msg);
    setTimeout(() => setActionMessage(null), 3000);
  }

  function openNewForm() {
    setFormName("");
    setFormAvatar(null);
    setFormError(null);
    setMode("new");
  }

  function openEditForm(profile: ProfileData) {
    setSelectedProfile(profile);
    setFormName(profile.displayName);
    setFormAvatar(profile.avatar);
    setFormError(null);
    setMode("edit");
  }

  function openDetail(profile: ProfileData) {
    setSelectedProfile(profile);
    setMode("detail");
  }

  async function handleCreate() {
    if (!formName.trim()) { setFormError("Please enter a name."); return; }
    startTransition(async () => {
      const result = await createProfile(formName.trim(), formAvatar ?? undefined);
      if (result.success) { setMode("list"); showMessage("Profile created."); router.refresh(); }
      else setFormError(result.error ?? "Failed to create profile.");
    });
  }

  async function handleUpdate() {
    if (!selectedProfile) return;
    if (!formName.trim()) { setFormError("Please enter a name."); return; }
    startTransition(async () => {
      const result = await updateProfile(selectedProfile.id, { displayName: formName.trim(), avatar: formAvatar });
      if (result.success) { setMode("list"); showMessage("Profile updated."); router.refresh(); }
      else setFormError(result.error ?? "Failed to update profile.");
    });
  }

  async function handleDelete(profileId: string) {
    startTransition(async () => {
      const result = await deleteProfile(profileId);
      if (result.success) { setConfirmDelete(null); setMode("list"); showMessage("Profile deleted."); router.refresh(); }
      else showMessage(result.error ?? "Failed to delete profile.");
    });
  }

  async function handleSwitch(profileId: string) {
    setSwitchingId(profileId);
    startTransition(async () => {
      await switchProfile(profileId);
      router.push("/seerah");
    });
  }

  // ── Detail view ────────────────────────────────────────────────────────────

  if (mode === "detail" && selectedProfile) {
    const s = selectedProfile.stats;
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-8 max-w-2xl mx-auto">
        <button onClick={() => setMode("list")} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back to profiles
        </button>

        <div className="flex items-center gap-4 mb-8">
          <div className={`w-16 h-16 rounded-xl bg-gradient-to-br ${TILE_COLORS[profiles.findIndex(p => p.id === selectedProfile.id) % TILE_COLORS.length]} flex items-center justify-center text-3xl border border-white/10`}>
            {selectedProfile.avatar ?? (
              <span className="text-xl font-bold text-white/80">
                {selectedProfile.displayName.slice(0, 2).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">{selectedProfile.displayName}</h1>
            <p className="text-xs text-zinc-500 mt-0.5">{selectedProfile.isDefault ? "Primary profile" : "Learner profile"}</p>
          </div>
        </div>

        <div className="bg-zinc-900 rounded-xl border border-zinc-800 p-5 mb-4">
          <h2 className="text-xs font-semibold text-zinc-500 mb-3 uppercase tracking-wider">Overall Progress</h2>
          <div className="flex items-end gap-3 mb-3">
            <span className="text-4xl font-bold text-amber-400">{s.completionPercent}%</span>
            <span className="text-zinc-500 text-sm pb-1">{s.completedParts}/{s.totalParts} lessons</span>
          </div>
          <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-amber-500 rounded-full transition-all" style={{ width: `${s.completionPercent}%` }} />
          </div>
          {s.lastActivity && (
            <p className="text-xs text-zinc-600 mt-3">Last active: {new Date(s.lastActivity).toLocaleDateString()}</p>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {[
            { label: "Videos",       value: s.videosCompleted,    icon: Video,          color: "text-blue-400" },
            { label: "Briefings",    value: s.briefingsOpened,    icon: BookOpen,       color: "text-green-400" },
            { label: "Slides",       value: s.slidesViewed,       icon: Layers,         color: "text-purple-400" },
            { label: "Infographics", value: s.infographicsViewed, icon: Image,          color: "text-pink-400" },
            { label: "Mind Maps",    value: s.mindmapsViewed,     icon: Map,            color: "text-teal-400" },
            { label: "Audio",        value: s.audioCompleted,     icon: FileText,       color: "text-orange-400" },
            { label: "Flashcards",   value: s.flashcardsStudied,  icon: Brain,          color: "text-amber-400" },
            { label: "Quizzes",      value: s.quizzesPassed,      icon: ClipboardCheck, color: "text-red-400" },
            { label: "Facts",        value: s.factsViewed,        icon: FileText,       color: "text-indigo-400" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="bg-zinc-900 rounded-xl border border-zinc-800 p-4 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center flex-shrink-0">
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
              <div>
                <p className="text-xs text-zinc-500">{label}</p>
                <p className="text-sm font-bold text-white">{value}<span className="text-zinc-600 font-normal text-xs"> / 100</span></p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex gap-3">
          <button onClick={() => openEditForm(selectedProfile)} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white text-sm font-medium transition-colors">
            <Edit2 className="w-4 h-4" />Edit Profile
          </button>
          <button onClick={() => handleSwitch(selectedProfile.id)} disabled={isPending} className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors disabled:opacity-50">
            Learn as {selectedProfile.displayName}
          </button>
        </div>
      </div>
    );
  }

  // ── Form (new / edit) ──────────────────────────────────────────────────────

  if (mode === "new" || mode === "edit") {
    const isEdit = mode === "edit";
    return (
      <div className="min-h-screen bg-zinc-950 px-4 py-8 max-w-lg mx-auto">
        <button onClick={() => setMode("list")} className="flex items-center gap-2 text-zinc-400 hover:text-white mb-6 transition-colors text-sm">
          <ArrowLeft className="w-4 h-4" />Back
        </button>

        <h1 className="text-xl font-bold text-white mb-6">
          {isEdit ? "Edit Profile" : "Create New Profile"}
        </h1>

        <div className="mb-5">
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">
            Name <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            placeholder="e.g. Ahmad, Maryam, Dad…"
            maxLength={50}
            className="w-full px-4 py-2.5 bg-zinc-900 border border-zinc-700 focus:border-amber-500 rounded-lg text-white placeholder:text-zinc-600 outline-none transition-colors"
          />
        </div>

        <div className="mb-5">
          <label className="block text-sm font-medium text-zinc-300 mb-1.5">Avatar (optional)</label>
          <div className="grid grid-cols-9 gap-2">
            {AVATARS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => setFormAvatar(formAvatar === emoji ? null : emoji)}
                className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center transition-all ${
                  formAvatar === emoji
                    ? "bg-amber-500/20 border-2 border-amber-500"
                    : "bg-zinc-800 border border-zinc-700 hover:border-amber-500/50"
                }`}
              >
                {emoji}
              </button>
            ))}
          </div>
          {formAvatar && (
            <button type="button" onClick={() => setFormAvatar(null)} className="mt-2 text-xs text-zinc-500 hover:text-zinc-300 transition-colors">
              Clear avatar
            </button>
          )}
        </div>

        {formError && (
          <p className="mb-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-2.5">{formError}</p>
        )}

        <div className="flex gap-3">
          <button type="button" onClick={() => setMode("list")} className="flex-1 px-4 py-2.5 rounded-lg border border-zinc-700 text-zinc-300 hover:text-white hover:border-zinc-500 text-sm font-medium transition-colors">
            Cancel
          </button>
          <button type="button" onClick={isEdit ? handleUpdate : handleCreate} disabled={isPending || !formName.trim()} className="flex-1 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm transition-colors disabled:opacity-50">
            {isPending ? "Saving…" : isEdit ? "Save Changes" : "Create Profile"}
          </button>
        </div>

        {isEdit && selectedProfile && !selectedProfile.isDefault && profiles.length > 1 && (
          <div className="mt-8 pt-6 border-t border-zinc-800">
            {confirmDelete === selectedProfile.id ? (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
                <p className="text-sm text-red-400 mb-3">
                  Delete &ldquo;{selectedProfile.displayName}&rdquo;? Their progress data will be permanently removed.
                </p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmDelete(null)} className="flex-1 px-3 py-2 rounded-lg border border-zinc-700 text-zinc-400 text-sm hover:text-white transition-colors">Cancel</button>
                  <button onClick={() => handleDelete(selectedProfile.id)} disabled={isPending} className="flex-1 px-3 py-2 rounded-lg bg-red-600 hover:bg-red-500 text-white text-sm font-medium transition-colors disabled:opacity-50">
                    {isPending ? "Deleting…" : "Delete Profile"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setConfirmDelete(selectedProfile.id)} className="flex items-center gap-2 text-sm text-red-400/70 hover:text-red-400 transition-colors">
                <Trash2 className="w-4 h-4" />Delete this profile
              </button>
            )}
          </div>
        )}
      </div>
    );
  }

  // ── Netflix-style profile grid ─────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-start px-4 py-12">

      {/* Header */}
      <div className="text-center mb-10">
        <h1 className="text-3xl font-bold text-white tracking-tight">Who&apos;s learning?</h1>
        {isFamily && (
          <p className="text-zinc-500 text-sm mt-2">Family Access · up to {profileLimit} learner profiles</p>
        )}
      </div>

      {/* Action message */}
      {actionMessage && (
        <div className="mb-6 px-4 py-2.5 bg-green-500/10 border border-green-500/20 rounded-lg text-sm text-green-400">
          {actionMessage}
        </div>
      )}

      {/* Profile tiles */}
      <div className="flex flex-wrap justify-center gap-6 max-w-3xl">
        {profiles.map((profile, idx) => {
          const isActive = profile.id === activeProfileId;
          const isSwitching = switchingId === profile.id && isPending;
          const initials = profile.displayName.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
          const tileGradient = TILE_COLORS[idx % TILE_COLORS.length];

          return (
            <div key={profile.id} className="flex flex-col items-center gap-3 group">
              {/* Square tile */}
              <div className="relative">
                <button
                  onClick={() => handleSwitch(profile.id)}
                  disabled={isPending}
                  className={`
                    w-32 h-32 rounded-xl bg-gradient-to-br ${tileGradient}
                    flex items-center justify-center text-5xl
                    border-2 transition-all duration-200
                    ${isActive
                      ? "border-amber-400 shadow-lg shadow-amber-500/30 scale-105"
                      : "border-transparent hover:border-white/30 hover:scale-105 hover:brightness-125"
                    }
                    disabled:cursor-wait
                  `}
                  title={`Learn as ${profile.displayName}`}
                >
                  {isSwitching ? (
                    <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : profile.avatar ? (
                    profile.avatar
                  ) : (
                    <span className="text-2xl font-bold text-white/80">{initials}</span>
                  )}

                  {/* Active checkmark badge */}
                  {isActive && !isSwitching && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-amber-400 flex items-center justify-center shadow-md">
                      <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />
                    </div>
                  )}
                </button>

                {/* Hover action bar — edit + stats */}
                <div className="absolute inset-x-0 -bottom-1 flex items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  <button
                    onClick={(e) => { e.stopPropagation(); openEditForm(profile); }}
                    className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-md"
                    title="Edit profile"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); openDetail(profile); }}
                    className="w-7 h-7 rounded-full bg-zinc-900 border border-zinc-700 hover:border-zinc-500 flex items-center justify-center text-zinc-400 hover:text-white transition-colors shadow-md"
                    title="View progress"
                  >
                    <BarChart2 className="w-3 h-3" />
                  </button>
                </div>
              </div>

              {/* Name + progress */}
              <div className="text-center">
                <p className={`text-sm font-semibold transition-colors ${isActive ? "text-amber-400" : "text-zinc-200 group-hover:text-white"}`}>
                  {profile.displayName}
                </p>
                <div className="flex items-center gap-1.5 mt-1 justify-center">
                  {/* Mini progress dots or bar */}
                  <div className="w-16 h-1 bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${profile.stats.completionPercent}%` }} />
                  </div>
                  <span className="text-[10px] text-zinc-600">{profile.stats.completionPercent}%</span>
                </div>
                {isActive && (
                  <span className="inline-block mt-1 text-[10px] font-semibold text-amber-500 uppercase tracking-wider">
                    Active
                  </span>
                )}
                {profile.isDefault && !isActive && (
                  <span className="inline-block mt-1 text-[10px] text-zinc-600 uppercase tracking-wider">
                    Primary
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Add profile tile */}
        {canAddMore && isFamily && (
          <div className="flex flex-col items-center gap-3 group">
            <button
              onClick={openNewForm}
              className="w-32 h-32 rounded-xl border-2 border-dashed border-zinc-700 hover:border-amber-500/50 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:bg-zinc-900/60"
            >
              <Plus className="w-8 h-8 text-zinc-600 group-hover:text-amber-500 transition-colors" />
            </button>
            <p className="text-sm text-zinc-600 group-hover:text-zinc-400 transition-colors">Add Profile</p>
          </div>
        )}
      </div>

      {/* Manage link */}
      <div className="mt-12 flex flex-col items-center gap-3">
        {isFamily && (
          <p className="text-xs text-zinc-600">Click a profile to start learning · hover to edit or view progress</p>
        )}
        {!isFamily && (
          <div className="mt-4 p-4 bg-amber-500/5 border border-amber-500/15 rounded-xl max-w-sm text-center">
            <p className="text-sm font-semibold text-amber-400 mb-1">Want profiles for the whole family?</p>
            <p className="text-xs text-zinc-500 mb-3">Family Access gives up to 5 separate learner profiles with independent progress tracking.</p>
            <Link href="/checkout?plan=family-trial" className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-black text-sm font-bold transition-colors">
              Upgrade to Family Access <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, Settings, Check, LogOut } from "lucide-react";
import { switchProfile } from "@/app/actions/profiles";
import { IslamicPatternBackground } from "@/components/motion";

// Each slot index gets a distinct gradient so the grid looks alive
const SLOT_GRADIENTS = [
  "from-amber-700 to-amber-900",
  "from-emerald-700 to-emerald-900",
  "from-blue-700 to-blue-900",
  "from-violet-700 to-violet-900",
  "from-rose-700 to-rose-900",
];

interface Profile {
  id: string;
  displayName: string;
  avatar: string | null;
  isDefault: boolean;
}

interface ProfilePickerClientProps {
  profiles: Profile[];
  profileLimit: number;        // 5 for family, 1 for individual
  isFamily: boolean;
  activeProfileId: string | null;
}

export function ProfilePickerClient({
  profiles,
  profileLimit,
  isFamily,
  activeProfileId,
}: ProfilePickerClientProps) {
  const router = useRouter();
  const [selecting, setSelecting] = useState<string | null>(null);

  async function handleSelect(profileId: string) {
    if (selecting) return;
    // Don't attempt to switch mock/preview profiles
    if (profileId.startsWith("mock-")) return;
    setSelecting(profileId);
    try {
      const result = await switchProfile(profileId);
      if (!result.success) {
        setSelecting(null);
        return;
      }
      // Small delay so the selection animation plays before navigation
      await new Promise((r) => setTimeout(r, 320));
      // Full navigation so server re-renders with the new profile cookie
      window.location.href = "/seerah";
    } catch {
      setSelecting(null);
    }
  }

  // Build slots: existing profiles first, then empty "Add Profile" slots
  const slots = Array.from({ length: profileLimit }, (_, i) => profiles[i] ?? null);

  async function handleSignOut() {
    try { await fetch("/api/auth/signout", { method: "POST" }); } catch {}
    window.location.href = "/login";
  }

  return (
    <div className="relative min-h-screen bg-zinc-950 flex flex-col items-center justify-center px-4 py-16 overflow-hidden">
      {/* Subtle Islamic pattern */}
      <IslamicPatternBackground className="absolute inset-0" opacity={0.03} />

      {/* Top edge gold line */}
      <div className="absolute top-0 inset-x-0 h-[1px] bg-gradient-to-r from-transparent via-gold/40 to-transparent" />


      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0, 0, 0.2, 1] }}
        className="text-center mb-12 sm:mb-16"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/images/logodashboard.png"
          alt="Complete Seerah"
          className="w-10 h-10 rounded-xl mx-auto mb-6 opacity-80"
        />
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white tracking-tight">
          Who is learning today?
        </h1>
        {isFamily && (
          <p className="text-zinc-500 text-sm mt-2">
            Select your learner profile — each one keeps its own progress.
          </p>
        )}
      </motion.div>

      {/* Profile grid */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1, ease: [0, 0, 0.2, 1] }}
        className="grid grid-cols-3 sm:grid-cols-5 gap-y-8 gap-x-6 sm:gap-x-8 md:gap-x-10 w-full max-w-xs sm:max-w-3xl justify-items-center mx-auto"
      >
        {slots.map((profile, idx) =>
          profile ? (
            <ProfileSlot
              key={profile.id}
              profile={profile}
              gradient={SLOT_GRADIENTS[idx % SLOT_GRADIENTS.length]}
              isActive={profile.id === activeProfileId}
              isSelecting={selecting === profile.id}
              anySelecting={!!selecting}
              onSelect={() => handleSelect(profile.id)}
            />
          ) : (
            isFamily && (
              <AddProfileSlot
                key={`empty-${idx}`}
                anySelecting={!!selecting}
              />
            )
          )
        )}
      </motion.div>

      {/* Bottom actions */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.35 }}
        className="mt-12 sm:mt-16 flex items-center gap-2"
      >
        {isFamily && (
          <a
            href="/student/profiles"
            className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-4 py-2 rounded-lg hover:bg-zinc-800/60"
          >
            <Settings className="w-4 h-4" />
            Manage profiles
          </a>
        )}
        {isFamily && <span className="text-zinc-700 text-xs">·</span>}
        <button
          onClick={handleSignOut}
          className="inline-flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors px-4 py-2 rounded-lg hover:bg-zinc-800/60"
        >
          <LogOut className="w-4 h-4" />
          Sign out
        </button>
      </motion.div>
    </div>
  );
}

// ── Single filled profile slot ────────────────────────────────────────────────

interface ProfileSlotProps {
  profile: Profile;
  gradient: string;
  isActive: boolean;
  isSelecting: boolean;
  anySelecting: boolean;
  onSelect: () => void;
}

function ProfileSlot({
  profile,
  gradient,
  isActive,
  isSelecting,
  anySelecting,
  onSelect,
}: ProfileSlotProps) {
  const [hovered, setHovered] = useState(false);

  const initials = profile.displayName
    .split(" ")
    .map((w) => w[0] ?? "")
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <motion.button
      type="button"
      onClick={onSelect}
      disabled={anySelecting}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className="flex flex-col items-center gap-3 group outline-none disabled:cursor-default"
      aria-label={`Select ${profile.displayName}`}
    >
      {/* Avatar circle */}
      <div className="relative">
        {/* Selection glow ring */}
        <AnimatePresence>
          {(isActive || isSelecting) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.85 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="absolute -inset-[3px] rounded-full border-2 border-gold"
              style={{ boxShadow: "0 0 18px rgba(200,169,110,0.45)" }}
            />
          )}
        </AnimatePresence>

        <div
          className={`relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center overflow-hidden transition-shadow ${
            hovered ? "shadow-2xl shadow-black/60" : ""
          }`}
        >
          {/* Pattern overlay inside avatar */}
          <div
            className="absolute inset-0 opacity-10"
            style={{
              backgroundImage:
                "repeating-linear-gradient(45deg,rgba(255,255,255,0.08) 0,rgba(255,255,255,0.08) 1px,transparent 0,transparent 50%)",
              backgroundSize: "16px 16px",
            }}
          />

          {profile.avatar ? (
            <span className="relative text-3xl sm:text-4xl">{profile.avatar}</span>
          ) : (
            <span className="relative text-xl sm:text-2xl font-bold text-white/90">
              {initials}
            </span>
          )}

          {/* Selecting spinner overlay */}
          <AnimatePresence>
            {isSelecting && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full"
              >
                <Check className="w-8 h-8 text-gold" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Name */}
      <div className="text-center">
        <p
          className={`text-sm font-semibold transition-colors max-w-[96px] truncate ${
            isActive
              ? "text-gold"
              : hovered
              ? "text-white"
              : "text-zinc-300"
          }`}
        >
          {profile.displayName}
        </p>
        {profile.isDefault && (
          <span className="text-[10px] text-zinc-600 mt-0.5 block">Primary</span>
        )}
        {isSelecting && (
          <span className="text-[10px] text-gold mt-0.5 block font-medium">Loading…</span>
        )}
      </div>
    </motion.button>
  );
}

// ── Empty "Add Profile" slot ──────────────────────────────────────────────────

function AddProfileSlot({ anySelecting }: { anySelecting: boolean }) {
  return (
    <motion.a
      href="/student/profiles?action=new"
      whileHover={anySelecting ? undefined : { scale: 1.08 }}
      whileTap={anySelecting ? undefined : { scale: 0.95 }}
      transition={{ duration: 0.15 }}
      className={`flex flex-col items-center gap-3 group outline-none ${anySelecting ? "pointer-events-none opacity-40" : ""}`}
      aria-label="Add new profile"
    >
      {/* Dashed circle */}
      <div className="w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-2 border-dashed border-zinc-700 group-hover:border-gold/50 group-hover:bg-zinc-800/40 flex items-center justify-center transition-all">
        <Plus className="w-8 h-8 text-zinc-600 group-hover:text-gold/70 transition-colors" />
      </div>
      <p className="text-sm font-medium text-zinc-600 group-hover:text-zinc-400 transition-colors max-w-[96px] truncate text-center">
        Add Profile
      </p>
    </motion.a>
  );
}

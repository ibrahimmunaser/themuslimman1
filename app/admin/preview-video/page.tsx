import { requireAdmin } from "@/lib/auth";
import { getPartPageData } from "@/lib/part-content-cache";
import { getPartById } from "@/lib/content";
import { LazyVideoPlayer } from "@/components/part/lazy-video-player";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Preview Video" };

interface Props {
  searchParams: Promise<{ part?: string }>;
}

export default async function AdminPreviewVideoPage({ searchParams }: Props) {
  await requireAdmin();
  const { part } = await searchParams;
  const partNumber = Math.max(1, parseInt(part ?? "7", 10) || 7);

  const partBase = getPartById(`part-${partNumber}`);
  const { videoUrl, thumbnailUrl } = await getPartPageData(partNumber);

  return (
    <div className="min-h-screen bg-[#0a0a0a] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Link
            href="/admin/dashboard"
            className="inline-flex items-center gap-1.5 text-zinc-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Admin Dashboard
          </Link>

          <div className="flex items-center gap-2 text-xs text-amber-400 bg-amber-400/10 border border-amber-400/20 rounded-lg px-3 py-1.5">
            <AlertTriangle className="w-3.5 h-3.5" />
            Admin preview — bypasses progression locks
          </div>
        </div>

        {/* Part picker */}
        <div className="mb-4 flex items-center gap-3">
          <span className="text-zinc-400 text-sm">Preview part:</span>
          <div className="flex gap-2 flex-wrap">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((n) => (
              <Link
                key={n}
                href={`/admin/preview-video?part=${n}`}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  n === partNumber
                    ? "bg-amber-500/20 text-amber-400 border border-amber-500/40"
                    : "bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700"
                }`}
              >
                {n}
              </Link>
            ))}
            <span className="text-zinc-600 text-sm self-center">… or add ?part=N to the URL</span>
          </div>
        </div>

        {/* Title */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-white">
            Part {partNumber}{partBase ? `: ${partBase.title}` : ""}
          </h1>
          {partBase?.subtitle && (
            <p className="text-zinc-400 text-sm mt-0.5">{partBase.subtitle}</p>
          )}
        </div>

        {/* Video */}
        <div className="rounded-2xl overflow-hidden bg-zinc-900 border border-zinc-800">
          <LazyVideoPlayer
            partNumber={partNumber}
            title={partBase?.title}
            poster={thumbnailUrl}
            videoUrl={videoUrl}
            previewMode
          />
        </div>

        {!videoUrl && (
          <p className="mt-4 text-center text-zinc-500 text-sm">
            No video found for Part {partNumber} in R2. Check the bucket.
          </p>
        )}
      </div>
    </div>
  );
}

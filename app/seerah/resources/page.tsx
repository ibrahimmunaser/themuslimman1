import { redirect } from "next/navigation";
import { getCachedStudent } from "@/lib/auth-cache";
import { hasActiveCourseAccess } from "@/lib/access";
import { getActiveProfileId } from "@/app/actions/profiles";
import { prisma } from "@/lib/db";
import { ResourcesTabs } from "@/components/resources/resources-tabs";
import { VideoResourceContent } from "@/components/resources/video-resource-content";
import { AudioResourceContent } from "@/components/resources/audio-resource-content";
import { TextResourceContent } from "@/components/resources/text-resource-content";
import { SimpleResourceContent } from "@/components/resources/simple-resource-content";
import { QuizResourceContent } from "@/components/resources/quiz-resource-content";
import { PARTS } from "@/lib/content";
import { getThumbnailUrls } from "@/lib/r2";

export const metadata = { title: "Resource Library | Complete Seerah" };
export const dynamic = "force-dynamic";

export default async function SeerahResourcesPage() {
  // getCachedStudent() deduplicates this call with the parent layout's auth
  // query — no extra DB round-trip on this page.
  const user = await getCachedStudent();
  if (!user.studentProfileId) redirect("/");

  // Run access check and profile ID lookup in parallel — both only need user.id.
  const [hasAccess, learnerProfileId] = await Promise.all([
    hasActiveCourseAccess(user.id, user.hasPaid),
    user.activeProfileId
      ? Promise.resolve(user.activeProfileId)
      : getActiveProfileId(user.id),
  ]);
  if (!hasAccess) redirect("/pricing");

  const userPlan = "complete" as const;

  // Fetch progress and thumbnail URLs in parallel, scoped to active profile.
  const [progress, thumbnails] = await Promise.all([
    prisma.partProgress.findMany({
      where: { learnerProfileId },
      select: {
        partNumber: true,
        videoWatchPercent: true,
        videoCompleted: true,
        openedAssets: true,
        quizCompleted: true,
        quizPassed: true,
        quizBestScore: true,
        quizAttempts: true,
        status: true,
      },
    }),
    getThumbnailUrls(PARTS.map((p) => p.partNumber)),
  ]);

  const progressMap = Object.fromEntries(
    progress.map((p) => [p.partNumber, p])
  );

  // Normalize legacy asset IDs at parse time so old DB records are counted
  // correctly: "facts" and "statement_of_facts" → "statement-of-facts".
  const normalizeAssetId = (id: string): string => {
    if (id === "facts" || id === "statement_of_facts") return "statement-of-facts";
    return id;
  };

  // Pre-parse openedAssets once per row to avoid repeated JSON.parse calls.
  const parsedOpenedAssets: Map<number, string[]> = new Map(
    progress.map((p) => {
      try {
        const raw: string[] = p.openedAssets ? JSON.parse(p.openedAssets as string) : [];
        return [p.partNumber, raw.map(normalizeAssetId)];
      } catch {
        return [p.partNumber, []];
      }
    })
  );

  const getAssetProgressMap = (assetType: string) =>
    Object.fromEntries(
      progress.map((p) => [p.partNumber, (parsedOpenedAssets.get(p.partNumber) ?? []).includes(assetType)])
    );

  const getAssetCompletedCount = (assetType: string) =>
    progress.filter((p) => (parsedOpenedAssets.get(p.partNumber) ?? []).includes(assetType)).length;

  // Video stats
  const videoCompletedCount = progress.filter((p) => p.videoCompleted).length;
  const videoInProgressCount = progress.filter(
    (p) => p.videoWatchPercent > 0 && !p.videoCompleted
  ).length;
  const videoContinueWatching = progress
    .filter((p) => p.videoWatchPercent > 0 && !p.videoCompleted)
    .sort((a, b) => b.videoWatchPercent - a.videoWatchPercent)[0];

  // Quiz stats
  const quizCompletedCount = progress.filter((p) => p.quizCompleted).length;
  const quizPassedCount = progress.filter((p) => p.quizPassed).length;
  const quizTotalAttempts = progress.reduce((sum, p) => sum + (p.quizAttempts || 0), 0);
  // Average only rows where the user has a recorded best score.
  const quizScoredRows = progress.filter((p) => (p.quizAttempts || 0) > 0 && p.quizBestScore != null);
  const quizAvgScore = quizScoredRows.length > 0
    ? quizScoredRows.reduce((sum, p) => sum + (p.quizBestScore || 0), 0) / quizScoredRows.length
    : 0;

  // Progress map for quiz resource content
  const quizProgressMap = Object.fromEntries(
    progress.map(p => [p.partNumber, {
      quizCompleted: p.quizCompleted || false,
      quizBestScore: p.quizBestScore,
      quizPassed: p.quizPassed || false,
      quizAttempts: p.quizAttempts || 0,
    }])
  );

  // Asset progress maps
  const audioProgressMap = getAssetProgressMap("audio");
  const audioCompletedCount = getAssetCompletedCount("audio");

  const slidesProgressMap = getAssetProgressMap("slides");
  const slidesCompletedCount = getAssetCompletedCount("slides");

  const infographicsProgressMap = getAssetProgressMap("infographic");
  const infographicsCompletedCount = getAssetCompletedCount("infographic");

  const mindmapsProgressMap = getAssetProgressMap("mindmap");
  const mindmapsCompletedCount = getAssetCompletedCount("mindmap");

  const flashcardsProgressMap = getAssetProgressMap("flashcard");
  const flashcardsCompletedCount = getAssetCompletedCount("flashcard");

  const briefingsProgressMap = getAssetProgressMap("briefing");
  const briefingsCompletedCount = getAssetCompletedCount("briefing");

  const factsProgressMap = getAssetProgressMap("statement-of-facts");
  const factsCompletedCount = getAssetCompletedCount("statement-of-facts");

  return (
    <ResourcesTabs
        videosContent={
          <VideoResourceContent
            progressMap={progressMap}
            completedCount={videoCompletedCount}
            inProgressCount={videoInProgressCount}
            continueWatching={videoContinueWatching}
            thumbnails={thumbnails}
          />
        }
        audioContent={
          <AudioResourceContent
            progressMap={audioProgressMap}
            completedCount={audioCompletedCount}
            thumbnails={thumbnails}
          />
        }
        briefingsContent={
          <TextResourceContent
            title="Briefings"
            description="Concise summaries of each lesson"
            resourceType="briefing"
            progressMap={briefingsProgressMap}
            completedCount={briefingsCompletedCount}
            thumbnails={thumbnails}
          />
        }
        slidesContent={
          <SimpleResourceContent
            title="Slides"
            description="Professional presentation decks in three formats: Presented, Detailed, and Facts"
            resourceType="slides"
            progressMap={slidesProgressMap}
            completedCount={slidesCompletedCount}
            actionLabel="View"
            statusLabel="Viewed"
            thumbnails={thumbnails}
          />
        }
        infographicsContent={
          <SimpleResourceContent
            title="Infographics"
            description="Visual summaries in three formats: Concise, Standard, and Bento Grid"
            resourceType="infographic"
            progressMap={infographicsProgressMap}
            completedCount={infographicsCompletedCount}
            actionLabel="View"
            statusLabel="Viewed"
            thumbnails={thumbnails}
          />
        }
        mindmapsContent={
          <SimpleResourceContent
            title="Mind Maps"
            description="Visual mind maps connecting people, places, and events throughout the Seerah"
            resourceType="mindmap"
            progressMap={mindmapsProgressMap}
            completedCount={mindmapsCompletedCount}
            actionLabel="View"
            statusLabel="Viewed"
            thumbnails={thumbnails}
          />
        }
        flashcardsContent={
          <SimpleResourceContent
            title="Flashcards"
            description="Interactive flashcards for spaced repetition learning across three difficulty levels"
            resourceType="flashcard"
            progressMap={flashcardsProgressMap}
            completedCount={flashcardsCompletedCount}
            actionLabel="Study"
            statusLabel="Studied"
            thumbnails={thumbnails}
          />
        }
        quizzesContent={
          <QuizResourceContent
            progressMap={quizProgressMap}
            completedCount={quizCompletedCount}
            passedCount={quizPassedCount}
            avgScore={quizAvgScore}
            totalAttempts={quizTotalAttempts}
            thumbnails={thumbnails}
          />
        }
        factsContent={
          <TextResourceContent
            title="Facts"
            description="Key facts and information from each lesson"
            resourceType="statement-of-facts"
            progressMap={factsProgressMap}
            completedCount={factsCompletedCount}
            thumbnails={thumbnails}
          />
        }
    />
  );
}

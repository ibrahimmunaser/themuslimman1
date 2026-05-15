import { redirect } from "next/navigation";
import { requireStudent } from "@/lib/auth";
import { StudentLayout } from "@/components/student/student-layout";
import { prisma } from "@/lib/db";
import { ResourcesTabs } from "@/components/resources/resources-tabs";
import { VideoResourceContent } from "@/components/resources/video-resource-content";
import { AudioResourceContent } from "@/components/resources/audio-resource-content";
import { TextResourceContent } from "@/components/resources/text-resource-content";
import { SimpleResourceContent } from "@/components/resources/simple-resource-content";
import { QuizResourceContent } from "@/components/resources/quiz-resource-content";

export const metadata = { title: "Resource Library | Seerah Masterclass" };
export const dynamic = "force-dynamic";

export default async function SeerahResourcesPage() {
  const user = await requireStudent();
  if (!user.studentProfileId) redirect("/");

  const purchases = await prisma.purchase.findMany({
    where: { userId: user.id, status: "succeeded" },
  });

  if (purchases.length === 0) {
    redirect("/pricing");
  }

  const userPlan = "complete" as const;

  // Fetch all progress data for all resource types
  const progress = await prisma.partProgress.findMany({
    where: { userId: user.id },
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
  });

  const progressMap = Object.fromEntries(
    progress.map((p) => [p.partNumber, p])
  );

  // Helper function to check if asset was opened
  const getAssetProgressMap = (assetType: string) => {
    return Object.fromEntries(
      progress.map((p) => {
        try {
          const openedAssets = p.openedAssets ? JSON.parse(p.openedAssets as string) : [];
          return [p.partNumber, openedAssets.includes(assetType)];
        } catch {
          return [p.partNumber, false];
        }
      })
    );
  };

  const getAssetCompletedCount = (assetType: string) => {
    return progress.filter((p) => {
      try {
        const openedAssets = p.openedAssets ? JSON.parse(p.openedAssets as string) : [];
        return openedAssets.includes(assetType);
      } catch {
        return false;
      }
    }).length;
  };

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
  const quizAvgScore = quizCompletedCount > 0
    ? progress.reduce((sum, p) => sum + (p.quizBestScore || 0), 0) / quizCompletedCount
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
    <StudentLayout userPlan={userPlan} userName={user.fullName}>
      <ResourcesTabs
        videosContent={
          <VideoResourceContent
            progressMap={progressMap}
            completedCount={videoCompletedCount}
            inProgressCount={videoInProgressCount}
            continueWatching={videoContinueWatching}
          />
        }
        audioContent={
          <AudioResourceContent
            progressMap={audioProgressMap}
            completedCount={audioCompletedCount}
          />
        }
        briefingsContent={
          <TextResourceContent
            title="Briefings"
            description="Concise summaries of each lesson"
            resourceType="briefing"
            progressMap={briefingsProgressMap}
            completedCount={briefingsCompletedCount}
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
          />
        }
        quizzesContent={
          <QuizResourceContent
            progressMap={quizProgressMap}
            completedCount={quizCompletedCount}
            passedCount={quizPassedCount}
            avgScore={quizAvgScore}
            totalAttempts={quizTotalAttempts}
          />
        }
        factsContent={
          <TextResourceContent
            title="Facts"
            description="Key facts and information from each lesson"
            resourceType="statement-of-facts"
            progressMap={factsProgressMap}
            completedCount={factsCompletedCount}
          />
        }
      />
    </StudentLayout>
  );
}

/**
 * Server-side data fetcher for influencer quick-checkout pages.
 * Loads the full Part 1 preview (video, slides, quiz, flashcards, etc.).
 */

import { getPart1PreviewData, type Part1PreviewData } from "@/lib/part1-preview-data";

export type InfluencerPageData = Part1PreviewData;

export async function getInfluencerPageData(): Promise<InfluencerPageData> {
  return getPart1PreviewData();
}

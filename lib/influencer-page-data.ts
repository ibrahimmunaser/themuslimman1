/**
 * Server-side data fetcher for influencer quick-checkout pages.
 * Loads the full Part 1 preview (video, slides, quiz, flashcards, etc.)
 * in the visitor's selected course language (EN/AR cookie).
 */

import {
  getPart1PreviewData,
  getPreviewLangFromCookies,
  type Part1PreviewData,
} from "@/lib/part1-preview-data";

export type InfluencerPageData = Part1PreviewData;

export async function getInfluencerPageData(): Promise<InfluencerPageData> {
  const lang = await getPreviewLangFromCookies();
  return getPart1PreviewData(lang);
}

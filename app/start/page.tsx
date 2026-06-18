import type { Metadata } from "next";
import { StartPage } from "./start-page";

export const metadata: Metadata = {
  title: "Learn the Life of the Prophet ﷺ in Order | The Muslim Man",
  description:
    "Most Muslims know scattered stories. Start Part 1 free and learn the life of the Prophet ﷺ step by step — short videos, quizzes, flashcards, summaries, mind maps, and progress tracking.",
  openGraph: {
    title: "Learn the Life of the Prophet ﷺ in Order",
    description:
      "100-part structured course. Start Part 1 free — no credit card required.",
    siteName: "The Muslim Man",
  },
};

export default function StartRoute() {
  return <StartPage />;
}

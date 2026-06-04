import type { AudiencePath } from "./types";

export interface LearningPath {
  id: AudiencePath;
  label: string;
  description: string;
}

export const LEARNING_PATHS: LearningPath[] = [
  {
    id: "children",
    label: "Children's Seerah",
    description:
      "The main story of the Prophet ﷺ in a clear, family-friendly path for younger learners.",
  },
  {
    id: "complete",
    label: "Complete Seerah",
    description:
      "The full chronological Seerah course with all parts, advanced context, visuals, quizzes, documents, and learning assets.",
  },
];

export const LEARNING_PATH_MAP = Object.fromEntries(
  LEARNING_PATHS.map((p) => [p.id, p])
) as Record<AudiencePath, LearningPath>;

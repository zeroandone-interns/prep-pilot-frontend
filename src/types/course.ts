 export type MediaType = "image" | "video";

export interface MediaItem {
  type: MediaType;
  url: string; // image URL or video URL (YouTube/embed/etc.)
  caption?: string;
}

export interface ParagraphBlock {
  kind: "paragraph";
  text: string;
}

export interface MediaBlock {
  kind: "media";
  media: MediaItem;
}

export type ContentBlock = ParagraphBlock | MediaBlock;

export interface MCQOption {
  id: string;
  text: string;
}

export interface MCQQuestion {
  id: string;
  prompt: string;
  options: MCQOption[];
  correctOptionId: string; // used client‑side until you connect backend
}

export interface Module {
  id: string;
  title: string;
  blocks: ContentBlock[];
  quiz: MCQQuestion[]; // 3 questions per module (your requirement)
}

export interface FinalExam {
  id: string;
  title: string;
  questions: MCQQuestion[]; // length >= 3
}

export interface Course {
  id: string;
  title: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced" | string;
  awsServices: string[];
  modules: Module[];
  finalExam?: FinalExam;
}
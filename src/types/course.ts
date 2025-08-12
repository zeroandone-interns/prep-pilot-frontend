// src/types/course.ts
export type MediaType = "image" | "video"

export interface MediaItem {
  type: MediaType
  url: string
  caption?: string
}

export interface ParagraphBlock {
  kind: "paragraph"
  text: string
}

export interface MediaBlock {
  kind: "media"
  media: MediaItem
}

export type ContentBlock = ParagraphBlock | MediaBlock

export interface MCQOption {
  id: string
  text: string
}

export interface MCQQuestion {
  id: string
  prompt: string
  options: MCQOption[]
  correctOptionId: string
}

/** NEW: Section lives inside a Module */
export interface Section {
  id: string
  title: string
  blocks: ContentBlock[]
  quiz: MCQQuestion[] // 3 questions per section
}

export interface Module {
  id: string
  title: string
  sections: Section[] // CHANGED: modules now contain sections
}

export interface FinalExam {
  id: string
  title: string
  questions: MCQQuestion[]
}

export interface Course {
  id: string
  title: string
  difficulty: "Beginner" | "Intermediate" | "Advanced" | string
  awsServices: string[]
  modules: Module[]
  finalExam?: FinalExam
}

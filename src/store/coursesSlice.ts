import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit"
import type { Course, Module, MCQQuestion } from "@/types/course"

interface CoursesState { items: Course[] }

// Helper to make MCQ
const q = (id: string, prompt: string, answers: string[], correctIndex = 0): MCQQuestion => ({
  id,
  prompt,
  options: answers.map((t, i) => ({ id: `${id}_opt_${i}`, text: t })),
  correctOptionId: `${id}_opt_${correctIndex}`,
})

// --- Sample Course (1 module -> 1 section) ---
const sampleCourse: Course = {
  id: "c-aws-lambda-intro",
  title: "AWS Lambda Basics",
  difficulty: "Beginner",
  awsServices: ["Lambda", "IAM", "CloudWatch"],
  modules: [
    {
      id: "m1",
      title: "What is AWS Lambda?",
      sections: [
        {
          id: "s1",
          title: "Introduction",
          blocks: [
            { kind: "paragraph", text: "AWS Lambda lets you run code without provisioning servers." },
            { kind: "paragraph", text: "You pay only for compute time consumed and can trigger from many AWS services." },
            {
              kind: "media",
              media: { type: "image", url: "https://via.placeholder.com/800x420?text=Lambda+Diagram", caption: "High-level Lambda diagram" },
            },
            { kind: "paragraph", text: "Typical use: API backends, event processing (S3/SNS/SQS), scheduled tasks (EventBridge)." },
          ],
          quiz: [
            q("q1", "What is AWS Lambda primarily used for?", [
              "Running code without managing servers", "Hosting static websites", "Managing user identities",
            ], 0),
            q("q2", "Which service commonly exposes Lambda as HTTP?", ["Amazon S3", "Amazon API Gateway", "Amazon RDS"], 1),
            q("q3", "When do you pay for Lambda?", ["A fixed monthly fee", "Only during code execution", "Only during deployments"], 1),
          ],
        },
      ],
    },
  ],
  finalExam: {
    id: "exam1",
    title: "AWS Lambda — Final Exam",
    questions: [
      q("fq1", "What language runtimes does Lambda support?", ["Node.js, Python, etc.", "Only Java", "Only Go"], 0),
      q("fq2", "Where do you view Lambda logs?", ["CloudTrail", "CloudWatch Logs", "X-Ray only"], 1),
      q("fq3", "What controls function permissions?", ["IAM policies/roles", "Security Groups", "Route 53"], 0),
    ],
  },
}

const initialState: CoursesState = { items: [sampleCourse] }

// Payloads to support Admin UI (frontend-only placeholders)
interface AddCoursePayload { title: string; difficulty: string; awsServices: string[] }
interface InjectGeneratedModulePayload { courseId: string; module: Module }

const coursesSlice = createSlice({
  name: "courses",
  initialState,
  reducers: {
    addCourse: (state, action: PayloadAction<AddCoursePayload>) => {
      state.items.push({ id: nanoid(), modules: [], finalExam: undefined, ...action.payload })
    },
    deleteCourse: (state, action: PayloadAction<string>) => {
      state.items = state.items.filter((c) => c.id !== action.payload)
    },
    injectGeneratedModule: (state, action: PayloadAction<InjectGeneratedModulePayload>) => {
      const { courseId, module } = action.payload
      const course = state.items.find((c) => c.id === courseId)
      if (course) course.modules.push(module)
    },
    injectGeneratedFinalExam: (state, action: PayloadAction<{ courseId: string; questions: MCQQuestion[] }>) => {
      const { courseId, questions } = action.payload
      const course = state.items.find((c) => c.id === courseId)
      if (course) course.finalExam = { id: nanoid(), title: `${course.title} — Final Exam`, questions }
    },
  },
})

export const { addCourse, deleteCourse, injectGeneratedModule, injectGeneratedFinalExam } = coursesSlice.actions
export default coursesSlice.reducer

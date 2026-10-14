const mongoose = require("mongoose")

const practiceQuestionSchema = new mongoose.Schema({
    question: { type: String, required: true },
    options: [{ type: String }],
    // Kept only on the server/database. The question-generation response omits it.
    correctAnswer: { type: Number, min: 0, max: 3 },
    selectedAnswer: { type: Number, min: 0, max: 3 },
    isCorrect: { type: Boolean },
    explanation: { type: String, default: "" },
    topic: { type: String, default: "General" },
    // Legacy fields remain optional so existing history documents can still be read.
    answer: { type: String, default: "" },
    score: { type: Number, min: 0, max: 10, default: 0 },
    feedback: { type: String, default: "" },
    strengths: [{ type: String }],
    improvements: [{ type: String }],
    idealAnswer: { type: String, default: "" }
}, { _id: false })

const practiceAttemptSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: "users", required: true },
    interviewReport: { type: mongoose.Schema.Types.ObjectId, ref: "InterviewReport", required: true },
    questions: [practiceQuestionSchema],
    overallScore: { type: Number, min: 0, max: 10, default: 0 },
    overallFeedback: { type: String, default: "" },
    areasToImprove: [{ type: String }],
    completedAt: { type: Date, default: null },
    durationSeconds: { type: Number, min: 0, default: 0 }
}, { timestamps: true })

module.exports = mongoose.model("PracticeAttempt", practiceAttemptSchema)

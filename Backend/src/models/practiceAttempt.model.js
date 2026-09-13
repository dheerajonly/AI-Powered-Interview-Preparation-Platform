const mongoose = require("mongoose")


const practiceQuestionSchema = new mongoose.Schema({

    question: {
        type: String,
        required: true
    },

    answer: {
        type: String,
        required: true
    },

    score: {
        type: Number,
        min: 0,
        max: 10,
        required: true
    },

    feedback: {
        type: String,
        required: true
    },

    strengths: [{
        type: String
    }],

    improvements: [{
        type: String
    }],

    idealAnswer: {
        type: String
    }

}, {
    _id: false
})


const practiceAttemptSchema = new mongoose.Schema({

    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "users",
        required: true
    },

    interviewReport: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "InterviewReport",
        required: true
    },

    questions: [
        practiceQuestionSchema
    ],

    overallScore: {
        type: Number,
        min: 0,
        max: 10,
        default: 0
    },

    overallFeedback: {
        type: String,
        default: ""
    },

    areasToImprove: [{
        type: String
    }]

}, {
    timestamps: true
})


const practiceAttemptModel = mongoose.model(
    "PracticeAttempt",
    practiceAttemptSchema
)


module.exports = practiceAttemptModel
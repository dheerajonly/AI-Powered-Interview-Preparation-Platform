const pdfParse = require("pdf-parse")

const {
    generateInterviewReport,
    generateResumePdf,
    generatePracticeQuestions,
    generatePracticeSummary,
    RateLimitError
} = require("../services/ai.service")

const interviewReportModel = require("../models/interviewReport.model")
const practiceAttemptModel = require("../models/practiceAttempt.model")


/**
 * @description
 * Controller to generate interview report based on user self description,
 * resume and job description.
 */
async function generateInterViewReportController(req, res) {

    try {

        const { selfDescription, jobDescription } = req.body

        // Job description is required
        if (!jobDescription) {

            return res.status(400).json({
                message: "Job description is required."
            })

        }


        // At least resume OR self description is required
        if (!req.file && !selfDescription) {

            return res.status(400).json({
                message: "Please upload a resume or provide a self-description."
            })

        }


        let resumeContent = ""


        // If resume was uploaded, extract its text
        if (req.file) {

            const parsedResume = await pdfParse(req.file.buffer)

            resumeContent = parsedResume.text

        }


        // Generate report using whatever information is available
        const interViewReportByAi =
            await generateInterviewReport({

                resume: resumeContent,

                selfDescription,

                jobDescription

            })


        // Save report
        const interviewReport =
            await interviewReportModel.create({

                user: req.user.id,

                resume: resumeContent,

                selfDescription,

                jobDescription,

                ...interViewReportByAi

            })


        res.status(201).json({

            message: "Interview report generated successfully.",

            interviewReport

        })


    } catch (error) {

        console.error(
            "Generate Interview Report Error:",
            error
        )

        if (error instanceof RateLimitError) {

            return res.status(429).json({

                message: error.message,

                isDailyLimit: error.isDailyLimit

            })

        }

        res.status(500).json({

            message:
                "Failed to generate interview report."

        })

    }

}



/**
 * @description
 * Controller to get interview report by interviewId.
 */
async function getInterviewReportByIdController(req, res) {

    try {

        const { interviewId } = req.params


        const interviewReport =
            await interviewReportModel.findOne({

                _id: interviewId,

                user: req.user.id

            })


        if (!interviewReport) {

            return res.status(404).json({

                message:
                    "Interview report not found."

            })

        }


        res.status(200).json({

            message:
                "Interview report fetched successfully.",

            interviewReport

        })


    } catch (error) {

        console.error(
            "Get Interview Report Error:",
            error
        )

        res.status(500).json({

            message:
                "Failed to fetch interview report."

        })

    }

}



/**
 * @description
 * Controller to get all interview reports of logged in user.
 */
async function getAllInterviewReportsController(req, res) {

    try {

        const interviewReports =
            await interviewReportModel
                .find({
                    user: req.user.id
                })
                .sort({
                    createdAt: -1
                })
                .select(
                    "-resume -selfDescription -jobDescription -__v -technicalQuestions -behavioralQuestions -skillGaps -preparationPlan"
                )


        res.status(200).json({

            message:
                "Interview reports fetched successfully.",

            interviewReports

        })


    } catch (error) {

        console.error(
            "Get All Interview Reports Error:",
            error
        )

        res.status(500).json({

            message:
                "Failed to fetch interview reports."

        })

    }

}



/**
 * @description
 * Controller to generate resume PDF based on user self description,
 * resume and job description.
 */
async function generateResumePdfController(req, res) {

    try {

        const { interviewReportId } = req.params


        const interviewReport =
            await interviewReportModel.findOne({

                _id: interviewReportId,

                user: req.user.id

            })


        if (!interviewReport) {

            return res.status(404).json({

                message:
                    "Interview report not found."

            })

        }


        const {
            resume,
            jobDescription,
            selfDescription
        } = interviewReport


        const pdfBuffer =
            await generateResumePdf({

                resume,

                jobDescription,

                selfDescription

            })


        res.set({

            "Content-Type":
                "application/pdf",

            "Content-Disposition":
                `attachment; filename=resume_${interviewReportId}.pdf`

        })


        res.send(pdfBuffer)


    } catch (error) {

        console.error(
            "Generate Resume PDF Error:",
            error
        )

        if (error instanceof RateLimitError) {

            return res.status(429).json({

                message: error.message,

                isDailyLimit: error.isDailyLimit

            })

        }

        res.status(500).json({

            message:
                "Failed to generate resume PDF."

        })

    }

}



/**
 * @description
 * Evaluate candidate's answer during practice interview
 * and save the question + answer + evaluation.
 */
async function evaluatePracticeAnswerController(req, res) {
    try {
        const { interviewId } = req.params
        const { attemptId, questionIndex, selectedAnswer } = req.body
        if (!attemptId || !Number.isInteger(questionIndex) || !Number.isInteger(selectedAnswer)) {
            return res.status(400).json({ message: "Attempt ID, question index, and selected option are required." })
        }
        if (questionIndex < 0 || selectedAnswer < 0 || selectedAnswer > 3) {
            return res.status(400).json({ message: "The selected answer is invalid." })
        }
        const [interviewReport, practiceAttempt] = await Promise.all([
            interviewReportModel.findOne({ _id: interviewId, user: req.user.id }),
            practiceAttemptModel.findOne({ _id: attemptId, user: req.user.id, interviewReport: interviewId })
        ])
        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." })
        if (!practiceAttempt) return res.status(404).json({ message: "Practice attempt not found." })
        if (practiceAttempt.completedAt) return res.status(409).json({ message: "This test has already been submitted." })
        const item = practiceAttempt.questions[questionIndex]
        if (!item || !Array.isArray(item.options) || item.correctAnswer === undefined) {
            return res.status(400).json({ message: "Question not found in this attempt." })
        }
        item.selectedAnswer = selectedAnswer
        item.isCorrect = selectedAnswer === item.correctAnswer
        item.score = item.isCorrect ? 10 : 0
        item.answer = item.options[selectedAnswer]
        item.feedback = item.isCorrect ? "Correct answer." : "Review the explanation to strengthen this concept."
        await practiceAttempt.save()
        return res.status(200).json({
            message: "Answer saved.",
            result: { questionIndex, selectedAnswer, isCorrect: item.isCorrect, correctAnswer: item.correctAnswer, explanation: item.explanation, topic: item.topic }
        })
    } catch (error) {
        console.error("Save Practice Answer Error:", error)
        return res.status(500).json({ message: "Failed to save your answer." })
    }
}

/**
 * @description
 * Generate 4 fresh technical questions for a new practice session.
 */
async function generatePracticeQuestionsController(req, res) {
    try {
        const { interviewId } = req.params
        const interviewReport = await interviewReportModel.findOne({ _id: interviewId, user: req.user.id })
        if (!interviewReport) return res.status(404).json({ message: "Interview report not found." })
        const recentAttempts = await practiceAttemptModel.find({ user: req.user.id, interviewReport: interviewId })
            .sort({ createdAt: -1 }).limit(10).select("questions.question")
        const previousQuestions = [
            ...(interviewReport.technicalQuestions || []).map(item => item.question),
            ...(interviewReport.behavioralQuestions || []).map(item => item.question),
            ...recentAttempts.flatMap(attempt => (attempt.questions || []).map(item => item.question))
        ].filter(Boolean).slice(-100)
        const generated = await generatePracticeQuestions({
            jobDescription: interviewReport.jobDescription,
            skillGaps: interviewReport.skillGaps,
            previousQuestions
        })
        const practiceAttempt = await practiceAttemptModel.create({
            user: req.user.id,
            interviewReport: interviewId,
            questions: generated.questions.map(question => ({
                question: question.question, options: question.options,
                correctAnswer: question.correctAnswer, explanation: question.explanation,
                topic: question.topic, score: 0
            }))
        })
        return res.status(201).json({
            message: "A fresh MCQ test has been generated.",
            attemptId: practiceAttempt._id,
            questions: generated.questions.map(({ correctAnswer, explanation, ...safeQuestion }) => safeQuestion)
        })
    } catch (error) {
        console.error("Generate MCQ Test Error:", error)
        if (error instanceof RateLimitError) return res.status(429).json({ message: error.message, isDailyLimit: error.isDailyLimit })
        return res.status(500).json({ message: "Failed to generate a fresh MCQ test. Please try again." })
    }
}

/**
 * @description
 * Complete a practice interview and save the overall result.
 */
async function completePracticeAttemptController(req, res) {
    try {
        const { interviewId, attemptId } = req.params
        const practiceAttempt = await practiceAttemptModel.findOne({ _id: attemptId, user: req.user.id, interviewReport: interviewId })
        if (!practiceAttempt) return res.status(404).json({ message: "Practice attempt not found." })
        if (practiceAttempt.completedAt) return res.status(200).json({ message: "Practice attempt already completed.", practiceAttempt })
        if (!practiceAttempt.questions.length) return res.status(400).json({ message: "This test has no questions." })
        const answered = practiceAttempt.questions.filter(item => Number.isInteger(item.selectedAnswer))
        if (answered.length !== practiceAttempt.questions.length) return res.status(400).json({ message: "Please answer every question before submitting." })
        const correctCount = answered.filter(item => item.isCorrect).length
        const overallScore = Math.round((correctCount / practiceAttempt.questions.length) * 100) / 10
        let summary = null
        try {
            summary = await generatePracticeSummary({
                questions: practiceAttempt.questions.map(item => ({
                    question: item.question, topic: item.topic,
                    answer: item.options[item.selectedAnswer], correctAnswer: item.options[item.correctAnswer],
                    isCorrect: item.isCorrect, score: item.score, feedback: item.feedback, explanation: item.explanation
                }))
            })
        } catch (summaryError) {
            // Save the scored test even if Gemini is temporarily unavailable.
            console.error("AI overall feedback unavailable:", summaryError.message)
        }
        const incorrectTopics = [...new Set(practiceAttempt.questions.filter(item => !item.isCorrect).map(item => item.topic || "General"))]
        practiceAttempt.overallScore = overallScore
        practiceAttempt.overallFeedback = summary?.overallFeedback || `You answered ${correctCount} of ${practiceAttempt.questions.length} questions correctly (${Math.round(overallScore * 10)}%). Review the explanations for missed questions and try another fresh test.`
        practiceAttempt.areasToImprove = summary?.areasToImprove?.length ? summary.areasToImprove : incorrectTopics.map(topic => `Review core concepts in ${topic}.`)
        practiceAttempt.completedAt = new Date()
        await practiceAttempt.save()
        return res.status(200).json({ message: "Test submitted successfully.", practiceAttempt })
    } catch (error) {
        console.error("Complete MCQ Test Error:", error)
        if (error instanceof RateLimitError) return res.status(429).json({ message: error.message, isDailyLimit: error.isDailyLimit })
        return res.status(500).json({ message: "Failed to generate your overall feedback. Please retry submission." })
    }
}

/**
 * @description
 * Controller to get all practice attempts of logged in user,
 * optionally filtered by a specific interview report.
 * Returns lightweight summaries for a history list view.
 */
async function getPracticeHistoryController(req, res) {
    try {
        const { interviewId } = req.query
        const filter = { user: req.user.id }
        if (interviewId) filter.interviewReport = interviewId

        const attempts = await practiceAttemptModel.find(filter)
            .sort({ createdAt: -1 })
            .populate("interviewReport", "title")
            .lean()

        // Return only analytics-safe fields. Answer keys are never included in this endpoint.
        const practiceAttempts = attempts.map(attempt => ({
            _id: attempt._id,
            user: attempt.user,
            interviewReport: attempt.interviewReport,
            overallScore: attempt.overallScore,
            overallFeedback: attempt.overallFeedback,
            areasToImprove: attempt.areasToImprove,
            completedAt: attempt.completedAt,
            durationSeconds: attempt.durationSeconds,
            createdAt: attempt.createdAt,
            updatedAt: attempt.updatedAt,
            questions: (attempt.questions || []).map(item => ({
                topic: item.topic || "General",
                ...(attempt.completedAt ? { isCorrect: Boolean(item.isCorrect) } : {})
            }))
        }))

        return res.status(200).json({ message: "Practice history fetched successfully.", practiceAttempts })
    } catch (error) {
        console.error("Get Practice History Error:", error)
        return res.status(500).json({ message: "Failed to fetch practice history." })
    }
}


/**
 * @description
 * Controller to get a single practice attempt in full detail,
 * including every question, answer, score and feedback, so the
 * user can review exactly how a past practice session went.
 */
async function getPracticeAttemptByIdController(req, res) {

    try {

        const { attemptId } = req.params


        const practiceAttempt =
            await practiceAttemptModel.findOne({

                _id: attemptId,

                user: req.user.id

            }).populate(
                "interviewReport",
                "title"
            )


        if (!practiceAttempt) {
            return res.status(404).json({ message: "Practice attempt not found." })
        }
        if (!practiceAttempt.completedAt && practiceAttempt.questions.some(item => item.correctAnswer !== undefined)) {
            return res.status(409).json({ message: "Submit this test before reviewing its answers." })
        }

        res.status(200).json({
            message:
                "Practice attempt fetched successfully.",

            practiceAttempt

        })


    } catch (error) {

        console.error(
            "Get Practice Attempt Error:",
            error
        )

        res.status(500).json({

            message:
                "Failed to fetch practice attempt."

        })

    }

}



module.exports = {

    generateInterViewReportController,

    getInterviewReportByIdController,

    getAllInterviewReportsController,

    generateResumePdfController,

    evaluatePracticeAnswerController,

    generatePracticeQuestionsController,

    completePracticeAttemptController,

    getPracticeHistoryController,

    getPracticeAttemptByIdController

}
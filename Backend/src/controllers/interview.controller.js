const pdfParse = require("pdf-parse")

const {
    generateInterviewReport,
    generateResumePdf,
    evaluatePracticeAnswer,
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

        const {
            attemptId,
            question,
            answer,
            intention
        } = req.body


        // Validate input
        if (!attemptId || !question || !answer) {

            return res.status(400).json({

                message:
                    "Attempt ID, question and answer are required."

            })

        }


        // Make sure interview belongs to logged-in user
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


        // Find the practice attempt
        const practiceAttempt =
            await practiceAttemptModel.findOne({

                _id: attemptId,

                user: req.user.id,

                interviewReport: interviewId

            })


        if (!practiceAttempt) {

            return res.status(404).json({

                message:
                    "Practice attempt not found."

            })

        }


        // Evaluate answer using AI
        const evaluation =
            await evaluatePracticeAnswer({

                question,

                answer,

                intention

            })


        // Save question + answer + evaluation
        practiceAttempt.questions.push({

            question,

            answer,

            score:
                evaluation.score,

            feedback:
                evaluation.feedback,

            strengths:
                evaluation.strengths,

            improvements:
                evaluation.improvements,

            idealAnswer:
                evaluation.idealAnswer

        })


        // Save changes to MongoDB
        await practiceAttempt.save()


        // Send evaluation back to frontend
        res.status(200).json({

            message:
                "Answer evaluated and saved successfully.",

            evaluation

        })


    } catch (error) {

        console.error(
            "Evaluate Practice Answer Error:",
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
                "Failed to evaluate practice answer."

        })

    }

}


/**
 * @description
 * Generate 4 fresh technical questions for a new practice session.
 */
async function generatePracticeQuestionsController(req, res) {

    try {

        const { interviewId } = req.params


        // Find the interview report belonging to logged-in user
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


        // Get the original technical questions
        const previousQuestions =
            interviewReport.technicalQuestions.map(
                (item) => item.question
            )


        // Generate fresh questions
        const practiceQuestions =
    await generatePracticeQuestions({

        jobDescription:
            interviewReport.jobDescription,

        skillGaps:
            interviewReport.skillGaps,

        previousQuestions

    })


// Create a new practice attempt
const practiceAttempt =
    await practiceAttemptModel.create({

        user: req.user.id,

        interviewReport: interviewId,

        questions: [],

        // These will be updated when
        // the interview is completed.
        overallScore: 0,

        overallFeedback: "",

        areasToImprove: []

    })


res.status(200).json({

    message:
        "Fresh practice questions generated successfully.",

    questions:
        practiceQuestions.questions,

    attemptId:
        practiceAttempt._id

})


    } catch (error) {

        console.error(
            "Generate Practice Questions Error:",
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
                "Failed to generate fresh practice questions."

        })

    }

}


/**
 * @description
 * Complete a practice interview and save the overall result.
 */
async function completePracticeAttemptController(req, res) {

    try {

        const { interviewId, attemptId } = req.params


        // Find the practice attempt
        const practiceAttempt =
            await practiceAttemptModel.findOne({

                _id: attemptId,

                user: req.user.id,

                interviewReport: interviewId

            })


        if (!practiceAttempt) {

            return res.status(404).json({

                message:
                    "Practice attempt not found."

            })

        }


        // Make sure at least one question has been answered
        if (practiceAttempt.questions.length === 0) {

            return res.status(400).json({

                message:
                    "No answered questions found."

            })

        }


        // Generate overall practice summary using AI
        const summary =
            await generatePracticeSummary({

                questions:
                    practiceAttempt.questions

            })


        // Save AI-generated final result
        practiceAttempt.overallScore =
            summary.overallScore

        practiceAttempt.overallFeedback =
            summary.overallFeedback

        practiceAttempt.areasToImprove =
            summary.areasToImprove


        // Save final result to MongoDB
        await practiceAttempt.save()


        res.status(200).json({

            message:
                "Practice attempt completed successfully.",

            practiceAttempt

        })


    } catch (error) {

        console.error(
            "Complete Practice Attempt Error:",
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
                "Failed to complete practice attempt."

        })

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

        const filter = {
            user: req.user.id
        }

        if (interviewId) {
            filter.interviewReport = interviewId
        }


        const practiceAttempts =
            await practiceAttemptModel
                .find(filter)
                .sort({
                    createdAt: -1
                })
                .select(
                    "-questions.answer -questions.feedback -questions.strengths -questions.improvements -questions.idealAnswer -__v"
                )
                .populate(
                    "interviewReport",
                    "title"
                )


        res.status(200).json({

            message:
                "Practice history fetched successfully.",

            practiceAttempts

        })


    } catch (error) {

        console.error(
            "Get Practice History Error:",
            error
        )

        res.status(500).json({

            message:
                "Failed to fetch practice history."

        })

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

            return res.status(404).json({

                message:
                    "Practice attempt not found."

            })

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
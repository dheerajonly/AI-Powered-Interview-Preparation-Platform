const express = require("express")
const authMiddleware = require("../middlewares/auth.middleware")
const interviewController = require("../controllers/interview.controller")
const upload = require("../middlewares/file.middleware")

const interviewRouter = express.Router()



/**
 * @route POST /api/interview/
 * @description
 * Generate new interview report on the basis of user self description,
 * resume PDF and job description.
 * @access private
 */
interviewRouter.post(
    "/",
    authMiddleware.authUser,
    upload.single("resume"),
    interviewController.generateInterViewReportController
)



/**
 * @route GET /api/interview/report/:interviewId
 * @description
 * Get interview report by interviewId.
 * @access private
 */
interviewRouter.get(
    "/report/:interviewId",
    authMiddleware.authUser,
    interviewController.getInterviewReportByIdController
)



/**
 * @route GET /api/interview/
 * @description
 * Get all interview reports of logged in user.
 * @access private
 */
interviewRouter.get(
    "/",
    authMiddleware.authUser,
    interviewController.getAllInterviewReportsController
)



/**
 * @route POST /api/interview/resume/pdf/:interviewReportId
 * @description
 * Generate resume PDF on the basis of user self description,
 * resume content and job description.
 * @access private
 */
interviewRouter.post(
    "/resume/pdf/:interviewReportId",
    authMiddleware.authUser,
    interviewController.generateResumePdfController
)



/**
 * @route POST /api/interview/practice/:interviewId/evaluate
 * @description
 * Evaluate a candidate's answer during a practice interview.
 * @access private
 */
interviewRouter.post(
    "/practice/:interviewId/evaluate",
    authMiddleware.authUser,
    interviewController.evaluatePracticeAnswerController
)



/**
 * @route POST /api/interview/practice/:interviewId/questions
 * @description
 * Generate 4 fresh technical questions for a new practice session.
 * @access private
 */
interviewRouter.post(
    "/practice/:interviewId/questions",
    authMiddleware.authUser,
    interviewController.generatePracticeQuestionsController
)



/**
 * @route POST /api/interview/practice/:interviewId/attempt/:attemptId/complete
 * @description
 * Complete a practice interview and save the overall result.
 * @access private
 */
interviewRouter.post(
    "/practice/:interviewId/attempt/:attemptId/complete",
    authMiddleware.authUser,
    interviewController.completePracticeAttemptController
)



/**
 * @route GET /api/interview/practice/history
 * @description
 * Get all practice attempts of logged in user (lightweight summaries),
 * optionally filtered by ?interviewId= for a specific interview report.
 * @access private
 */
interviewRouter.get(
    "/practice/history",
    authMiddleware.authUser,
    interviewController.getPracticeHistoryController
)



/**
 * @route GET /api/interview/practice/attempt/:attemptId
 * @description
 * Get full detail of a single practice attempt, including every
 * question, answer, score and feedback, so the user can review it.
 * @access private
 */
interviewRouter.get(
    "/practice/attempt/:attemptId",
    authMiddleware.authUser,
    interviewController.getPracticeAttemptByIdController
)


module.exports = interviewRouter
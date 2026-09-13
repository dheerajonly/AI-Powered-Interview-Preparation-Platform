import axios from "axios";


const api = axios.create({
    baseURL: "http://localhost:3000",
    withCredentials: true,
})


/**
 * @description
 * Service to generate interview report based on user self description,
 * resume and job description.
 */
export const generateInterviewReport = async ({
    jobDescription,
    selfDescription,
    resumeFile
}) => {

    const formData = new FormData()

    formData.append(
        "jobDescription",
        jobDescription
    )

    formData.append(
        "selfDescription",
        selfDescription
    )

    formData.append(
        "resume",
        resumeFile
    )


    const response = await api.post(
        "/api/interview/",
        formData,
        {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        }
    )


    return response.data

}



/**
 * @description
 * Service to get interview report by interviewId.
 */
export const getInterviewReportById = async (
    interviewId
) => {

    const response = await api.get(
        `/api/interview/report/${interviewId}`
    )

    return response.data

}



/**
 * @description
 * Service to get all interview reports of logged in user.
 */
export const getAllInterviewReports = async () => {

    const response = await api.get(
        "/api/interview/"
    )

    return response.data

}



/**
 * @description
 * Service to generate resume PDF based on user self description,
 * resume content and job description.
 */
export const generateResumePdf = async ({
    interviewReportId
}) => {

    const response = await api.post(
        `/api/interview/resume/pdf/${interviewReportId}`,
        null,
        {
            responseType: "blob"
        }
    )

    return response.data

}



/**
 * @description
 * Service to evaluate a candidate's practice interview answer.
 */
export const evaluatePracticeAnswer = async ({
    interviewId,
    attemptId,
    question,
    answer,
    intention
}) => {

    const response = await api.post(
        `/api/interview/practice/${interviewId}/evaluate`,
        {
            attemptId,
            question,
            answer,
            intention
        }
    )

    return response.data
}



/**
 * @description
 * Service to generate 4 fresh technical questions
 * for a new practice interview session.
 */
export const generatePracticeQuestions = async (
    interviewId
) => {

    const response = await api.post(
        `/api/interview/practice/${interviewId}/questions`
    )

    return response.data

}



/**
 * @description
 * Service to mark a practice attempt as complete.
 * The backend generates an AI overall score, feedback
 * and areas to improve, then saves it permanently.
 */
export const completePracticeAttempt = async ({
    interviewId,
    attemptId
}) => {

    const response = await api.post(
        `/api/interview/practice/${interviewId}/attempt/${attemptId}/complete`
    )

    return response.data

}



/**
 * @description
 * Service to get all past practice attempts of the
 * logged in user, optionally filtered by interviewId.
 */
export const getPracticeHistory = async (
    interviewId
) => {

    const response = await api.get(
        "/api/interview/practice/history",
        {
            params: interviewId
                ? { interviewId }
                : {}
        }
    )

    return response.data

}



/**
 * @description
 * Service to get full detail of a single practice attempt.
 */
export const getPracticeAttemptById = async (
    attemptId
) => {

    const response = await api.get(
        `/api/interview/practice/attempt/${attemptId}`
    )

    return response.data

}
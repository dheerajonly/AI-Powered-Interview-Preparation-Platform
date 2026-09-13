const { GoogleGenAI } = require("@google/genai")
const { z } = require("zod")
const { zodToJsonSchema } = require("zod-to-json-schema")
const puppeteer = require("puppeteer")

const ai = new GoogleGenAI({
    apiKey: process.env.GOOGLE_GENAI_API_KEY
})



/**
 * @description
 * Custom error thrown whenever the Gemini API rate limit is hit.
 * Carries a clear, user-facing message and whether it's the
 * hard daily quota (no point retrying soon) or a short-lived limit.
 */
class RateLimitError extends Error {

    constructor({ message, isDailyLimit, retryAfterSeconds }) {

        super(message)

        this.name = "RateLimitError"
        this.isDailyLimit = isDailyLimit
        this.retryAfterSeconds = retryAfterSeconds

    }

}



/**
 * @description
 * Reads the Gemini SDK's raw 429 error (its `message` is a JSON
 * string) and pulls out the retry delay and whether the violated
 * quota is a per-day quota (i.e. no use retrying for a while).
 */
function parseRateLimitDetails(error) {

    try {

        const parsed = JSON.parse(error.message)

        const details = parsed?.error?.details || []

        const retryInfo = details.find(
            detail => detail["@type"]?.includes("RetryInfo")
        )

        const quotaFailure = details.find(
            detail => detail["@type"]?.includes("QuotaFailure")
        )

        const quotaId =
            quotaFailure?.violations?.[0]?.quotaId || ""

        const retryAfterSeconds =
            retryInfo?.retryDelay
                ? parseFloat(retryInfo.retryDelay.replace("s", ""))
                : null

        const isDailyLimit =
            quotaId.toLowerCase().includes("perday")

        return { retryAfterSeconds, isDailyLimit }

    } catch (parseError) {

        return { retryAfterSeconds: null, isDailyLimit: false }

    }

}



/**
 * @description
 * Wraps ai.models.generateContent with rate-limit awareness.
 * Short-lived limits are retried automatically a couple of times.
 * The hard daily free-tier limit fails fast with a clear message
 * instead of a generic "please try again".
 */
async function generateContentWithRetry(params, maxRetries = 2) {

    let attempt = 0

    while (true) {

        try {

            return await ai.models.generateContent(params)

        } catch (error) {

            if (error?.status !== 429) {

                throw error

            }


            const { retryAfterSeconds, isDailyLimit } =
                parseRateLimitDetails(error)


            if (isDailyLimit) {

                throw new RateLimitError({

                    message:
                        "You've reached today's AI usage limit (the free tier allows 20 requests/day). Please try again after the quota resets, or upgrade your Google AI plan for a higher limit.",

                    isDailyLimit: true,

                    retryAfterSeconds

                })

            }


            const canRetry =
                attempt < maxRetries &&
                retryAfterSeconds &&
                retryAfterSeconds <= 30

            if (canRetry) {

                attempt++

                await new Promise(
                    resolve => setTimeout(
                        resolve,
                        (retryAfterSeconds * 1000) + 500
                    )
                )

                continue

            }


            throw new RateLimitError({

                message:
                    "The AI service is temporarily busy due to rate limits. Please wait a moment and try again.",

                isDailyLimit: false,

                retryAfterSeconds

            })

        }

    }

}



const interviewReportSchema = z.object({
    matchScore: z.number().describe("A score between 0 and 100 indicating how well the candidate's profile matches the job describe"),
    technicalQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Technical questions that can be asked in the interview along with their intention and how to answer them"),
    behavioralQuestions: z.array(z.object({
        question: z.string().describe("The technical question can be asked in the interview"),
        intention: z.string().describe("The intention of interviewer behind asking this question"),
        answer: z.string().describe("How to answer this question, what points to cover, what approach to take etc.")
    })).describe("Behavioral questions that can be asked in the interview along with their intention and how to answer them"),
    skillGaps: z.array(z.object({
        skill: z.string().describe("The skill which the candidate is lacking"),
        severity: z.enum([ "low", "medium", "high" ]).describe("The severity of this skill gap, i.e. how important is this skill for the job and how much it can impact the candidate's chances")
    })).describe("List of skill gaps in the candidate's profile along with their severity"),
    preparationPlan: z.array(z.object({
        day: z.number().describe("The day number in the preparation plan, starting from 1"),
        focus: z.string().describe("The main focus of this day in the preparation plan, e.g. data structures, system design, mock interviews etc."),
        tasks: z.array(z.string()).describe("List of tasks to be done on this day to follow the preparation plan, e.g. read a specific book or article, solve a set of problems, watch a video etc.")
    })).describe("A day-wise preparation plan for the candidate to follow in order to prepare for the interview effectively"),
    title: z.string().describe("The title of the job for which the interview report is generated"),
})


const practiceEvaluationSchema = z.object({
    score: z.number().describe("Score between 0 and 10 for the candidate's answer"),

    feedback: z.string().describe(
        "Overall feedback on the candidate's answer"
    ),

    strengths: z.array(z.string()).describe(
        "Things the candidate explained correctly or did well"
    ),

    improvements: z.array(z.string()).describe(
        "Things the candidate should improve or include"
    ),

    idealAnswer: z.string().describe(
        "A concise ideal answer that demonstrates what a strong candidate should say"
    )
})


const practiceQuestionsSchema = z.object({
    questions: z.array(
        z.object({
            question: z.string().describe(
                "A fresh technical interview question relevant to the candidate's job role and skills"
            ),
            intention: z.string().describe(
                "The interviewer's intention behind asking this question"
            )
        })
    ).length(4).describe(
        "Exactly 4 fresh technical interview questions"
    )
})



const practiceSummarySchema = z.object({

    overallScore: z.number().min(0).max(10).describe(
        "Overall score for the candidate's complete practice interview"
    ),

    overallFeedback: z.string().describe(
        "Overall feedback about the candidate's performance"
    ),

    areasToImprove: z.array(z.string()).describe(
        "Important areas the candidate should improve"
    )

})



async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


    const prompt = `Generate an interview report for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}
`

    const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(interviewReportSchema),
        }
    })

    return JSON.parse(response.text)


}



async function generatePdfFromHtml(htmlContent) {
    const browser = await puppeteer.launch()
    const page = await browser.newPage();
    await page.setContent(htmlContent, { waitUntil: "networkidle0" })

    const pdfBuffer = await page.pdf({
        format: "A4", margin: {
            top: "20mm",
            bottom: "20mm",
            left: "15mm",
            right: "15mm"
        }
    })

    await browser.close()

    return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

    const resumePdfSchema = z.object({
        html: z.string().describe("The HTML content of the resume which can be converted to PDF using any library like puppeteer")
    })

    const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

    const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(resumePdfSchema),
        }
    })


    const jsonContent = JSON.parse(response.text)

    const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

    return pdfBuffer

}


async function evaluatePracticeAnswer({
    question,
    answer,
    intention
}) {

    const prompt = `
You are an expert technical interviewer.

Evaluate the candidate's answer to the interview question.

Interview Question:
${question}

Candidate's Answer:
${answer}

Interviewer's Intention:
${intention}

Evaluate the answer fairly based on:

1. Technical correctness
2. Understanding of the concept
3. Completeness
4. Clarity
5. Important points that were missed

Give a score from 0 to 10.

Return:
- score
- feedback
- strengths
- improvements
- idealAnswer
`

    const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(practiceEvaluationSchema)
        }
    })

    return JSON.parse(response.text)
}


async function generatePracticeQuestions({
    jobDescription,
    skillGaps,
    previousQuestions
}) {

    const prompt = `
You are an expert technical interviewer.

Generate exactly 4 NEW technical interview questions for a candidate.

Job Description:
${jobDescription}

Candidate Skill Gaps:
${JSON.stringify(skillGaps)}

Questions that have already been asked:
${JSON.stringify(previousQuestions)}

IMPORTANT RULES:

1. Generate exactly 4 questions.
2. Questions must be relevant to the job description.
3. Questions should test different technical concepts.
4. DO NOT repeat any question from the previous questions.
5. DO NOT create questions that are just slightly reworded versions of previous questions.
6. Questions should be appropriate for an actual technical interview.
7. Mix conceptual, practical, debugging, problem-solving, and scenario-based questions where appropriate.
8. Focus especially on technologies and skills relevant to the candidate's role and skill gaps.
9. Each question must have an interviewer's intention explaining what the interviewer wants to evaluate.

Return only the requested JSON structure.
`

    const response = await generateContentWithRetry({
        model: "gemini-3-flash-preview",
        contents: prompt,
        config: {
            responseMimeType: "application/json",
            responseSchema: zodToJsonSchema(
                practiceQuestionsSchema
            )
        }
    })

    return JSON.parse(response.text)
}



async function generatePracticeSummary({
    questions
}) {

    const prompt = `
You are an expert technical interviewer.

Analyze the candidate's complete practice interview performance.

Here are the questions, candidate answers, scores and feedback:

${JSON.stringify(questions)}

Based on the complete performance:

1. Give an overall score from 0 to 10.
2. Give clear overall feedback about the candidate's performance.
3. Identify the most important areas the candidate should improve.

Consider:
- Technical correctness
- Understanding of concepts
- Completeness
- Clarity
- Consistency across answers
- Repeated weaknesses

Return only the requested JSON structure.
`

    const response = await generateContentWithRetry({

        model: "gemini-3-flash-preview",

        contents: prompt,

        config: {

            responseMimeType: "application/json",

            responseSchema:
                zodToJsonSchema(practiceSummarySchema)

        }

    })

    return JSON.parse(response.text)

}


module.exports = { 
    generateInterviewReport, 
    generateResumePdf, 
    evaluatePracticeAnswer,  
    generatePracticeQuestions, 
    generatePracticeSummary,
    RateLimitError
} 
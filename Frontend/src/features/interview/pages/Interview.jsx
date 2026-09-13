import React, { useState, useEffect } from 'react'
import '../style/interview.scss'
import { useInterview } from '../hooks/useInterview.js'
import { useNavigate, useParams } from 'react-router'
import {
    evaluatePracticeAnswer,
    generatePracticeQuestions,
    completePracticeAttempt
} from '../services/interview.api.js'


const NAV_ITEMS = [
    {
        id: 'technical',
        label: 'Technical Questions',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polyline points="16 18 22 12 16 6" />
                <polyline points="8 6 2 12 8 18" />
            </svg>
        )
    },

    {
        id: 'behavioral',
        label: 'Behavioral Questions',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
            </svg>
        )
    },

    {
        id: 'roadmap',
        label: 'Road Map',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <polygon points="3 11 22 2 13 21 11 13 3 11" />
            </svg>
        )
    },

    {
        id: 'practice',
        label: 'Practice Interview',
        icon: (
            <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
            >
                <circle cx="12" cy="12" r="10" />
                <polygon points="10 8 16 12 10 16 10 8" />
            </svg>
        )
    }
]


// ─────────────────────────────────────────────────────────────────────────────
// Question Card
// ─────────────────────────────────────────────────────────────────────────────

const QuestionCard = ({ item, index }) => {

    const [open, setOpen] = useState(false)

    return (
        <div className='q-card'>

            <div
                className='q-card__header'
                onClick={() => setOpen(o => !o)}
            >

                <span className='q-card__index'>
                    Q{index + 1}
                </span>

                <p className='q-card__question'>
                    {item.question}
                </p>

                <span
                    className={`q-card__chevron ${
                        open ? 'q-card__chevron--open' : ''
                    }`}
                >

                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <polyline points="6 9 12 15 18 9" />
                    </svg>

                </span>

            </div>

            {open && (

                <div className='q-card__body'>

                    <div className='q-card__section'>

                        <span className='q-card__tag q-card__tag--intention'>
                            Intention
                        </span>

                        <p>
                            {item.intention}
                        </p>

                    </div>

                    <div className='q-card__section'>

                        <span className='q-card__tag q-card__tag--answer'>
                            Model Answer
                        </span>

                        <p>
                            {item.answer}
                        </p>

                    </div>

                </div>

            )}

        </div>
    )
}



// ─────────────────────────────────────────────────────────────────────────────
// Roadmap Day
// ─────────────────────────────────────────────────────────────────────────────

const RoadMapDay = ({ day }) => (

    <div className='roadmap-day'>

        <div className='roadmap-day__header'>

            <span className='roadmap-day__badge'>
                Day {day.day}
            </span>

            <h3 className='roadmap-day__focus'>
                {day.focus}
            </h3>

        </div>

        <ul className='roadmap-day__tasks'>

            {day.tasks.map((task, i) => (

                <li key={i}>

                    <span className='roadmap-day__bullet' />

                    {task}

                </li>

            ))}

        </ul>

    </div>

)



// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────

const Interview = () => {

    const [activeNav, setActiveNav] = useState('technical')

    // Practice interview state
    const [practiceStarted, setPracticeStarted] = useState(false)

    const [practiceQuestionIndex, setPracticeQuestionIndex] =
        useState(0)

    const [practiceAnswer, setPracticeAnswer] =
        useState('')

    const [answerSubmitted, setAnswerSubmitted] =
        useState(false)

    const [evaluation, setEvaluation] =
        useState(null)

    const [evaluating, setEvaluating] =
        useState(false)


    // NEW:
    // Stores the questions generated specifically
    // for the current practice session.
    const [practiceQuestions, setPracticeQuestions] =
        useState([])

    const [practiceAttemptId, setPracticeAttemptId] =
    useState(null)

    // NEW:
    // Loading state while Gemini generates fresh questions.
    const [generatingQuestions, setGeneratingQuestions] =
        useState(false)


    // Stores evaluations from all questions.
    const [practiceEvaluations, setPracticeEvaluations] =
        useState([])


    // NEW:
    // Tracks saving the finished practice attempt
    // (with AI overall summary) permanently to the database.
    const [savingAttempt, setSavingAttempt] =
        useState(false)

    const [attemptSaved, setAttemptSaved] =
        useState(false)

    const [savedSummary, setSavedSummary] =
        useState(null)

    const [saveError, setSaveError] =
        useState(null)

    // NEW: inline error banners (replace native alert() popups)
    const [startPracticeError, setStartPracticeError] =
        useState(null)

    const [answerError, setAnswerError] =
        useState(null)


    const {
        report,
        getReportById,
        loading,
        getResumePdf
    } = useInterview()


    const { interviewId } = useParams()

    const navigate = useNavigate()



    // ─────────────────────────────────────────────────────────────────────────
    // Get Interview Report
    // ─────────────────────────────────────────────────────────────────────────

    useEffect(() => {

        if (interviewId) {

            getReportById(interviewId)

        }

    }, [interviewId])



    // ─────────────────────────────────────────────────────────────────────────
    // Save Completed Practice Attempt (permanently, to the database)
    // ─────────────────────────────────────────────────────────────────────────

    const saveCompletedAttempt = async () => {

        if (!practiceAttemptId) {

            return

        }

        try {

            setSavingAttempt(true)

            setSaveError(null)


            const response =
                await completePracticeAttempt({
                    interviewId,
                    attemptId: practiceAttemptId
                })


            setSavedSummary(
                response.practiceAttempt
            )

            setAttemptSaved(true)


        } catch (error) {

            console.error(
                "Failed to save practice attempt:",
                error
            )

            setSaveError(
                error.response?.data?.message ||
                "We couldn't save your results this time. You can retry below."
            )

        } finally {

            setSavingAttempt(false)

        }

    }


    useEffect(() => {

        const isLastQuestionAnswered =
            practiceQuestions.length > 0 &&
            practiceEvaluations.length ===
                practiceQuestions.length

        if (
            isLastQuestionAnswered &&
            !attemptSaved &&
            !savingAttempt
        ) {

            saveCompletedAttempt()

        }

    }, [practiceEvaluations, practiceQuestions])



    // ─────────────────────────────────────────────────────────────────────────
    // Loading State
    // ─────────────────────────────────────────────────────────────────────────

    if (loading || !report) {

        return (

            <main className='loading-screen'>

                <div className='spinner' />

                <h1>
                    Loading your interview plan...
                </h1>

            </main>

        )

    }



    // ─────────────────────────────────────────────────────────────────────────
    // Match Score
    // ─────────────────────────────────────────────────────────────────────────

    const scoreColor =
        report.matchScore >= 80
            ? 'score--high'
            : report.matchScore >= 60
                ? 'score--mid'
                : 'score--low'



    const scoreMessage =
        report.matchScore >= 80
            ? "Strong match for this role"
            : report.matchScore >= 60
                ? "Good match with some gaps"
                : "Significant preparation recommended"



    // ─────────────────────────────────────────────────────────────────────────
    // Current Practice Question
    // ─────────────────────────────────────────────────────────────────────────

    const currentQuestion =
        practiceQuestions[practiceQuestionIndex]



    // ─────────────────────────────────────────────────────────────────────────
    // Start Practice Interview
    // ─────────────────────────────────────────────────────────────────────────

    const startPracticeInterview = async () => {

        try {

            setGeneratingQuestions(true)

            // Reset old practice data
            setPracticeAnswer('')
            setAnswerSubmitted(false)
            setEvaluation(null)
            setPracticeEvaluations([])
            setPracticeQuestionIndex(0)
            setPracticeAttemptId(null)

            // Reset save state from any previous session
            setSavingAttempt(false)
            setAttemptSaved(false)
            setSavedSummary(null)
            setSaveError(null)
            setStartPracticeError(null)

            // Ask backend for fresh questions
            const response =
                await generatePracticeQuestions(
                    interviewId
                )


            // Store the new questions
            setPracticeQuestions(
                response.questions || []
            )
 
            // Store MongoDB practice attempt ID
            setPracticeAttemptId(
            response.attemptId
            )

            // Start interview only after questions
            // have been successfully generated.
            setPracticeStarted(true)


        } catch (error) {

            console.error(
                "Failed to generate practice questions:",
                error
            )

            setStartPracticeError(
                error.response?.data?.message ||
                "Unable to generate new practice questions. Please try again."
            )

        } finally {

            setGeneratingQuestions(false)

        }

    }



    // ─────────────────────────────────────────────────────────────────────────
    // Save Completed Practice Attempt (permanently, to the database)
    // ─────────────────────────────────────────────────────────────────────────

    // ─────────────────────────────────────────────────────────────────────────
    // Submit Answer + AI Evaluation
    // ─────────────────────────────────────────────────────────────────────────

    const handleSubmitAnswer = async () => {

        if (!practiceAnswer.trim()) {

            return

        }


        if (!currentQuestion) {

            return

        }

        setAnswerError(null)


        try {

            setEvaluating(true)


            const response =
    await evaluatePracticeAnswer({

        interviewId,

        attemptId:
            practiceAttemptId,

        question:
            currentQuestion.question,

        answer:
            practiceAnswer,

        intention:
            currentQuestion.intention

    })

            const newEvaluation =
                response.evaluation


            // Store current evaluation
            setEvaluation(newEvaluation)


            // Store evaluation for overall result
            setPracticeEvaluations(
                previous => [
                    ...previous,
                    newEvaluation
                ]
            )


            setAnswerSubmitted(true)


        } catch (error) {

            console.error(
                "Failed to evaluate answer:",
                error
            )

            setAnswerError(
                error.response?.data?.message ||
                "Unable to evaluate your answer. Please try again."
            )

        } finally {

            setEvaluating(false)

        }

    }



    // ─────────────────────────────────────────────────────────────────────────
    // Next Question
    // ─────────────────────────────────────────────────────────────────────────

    const handleNextQuestion = () => {

        if (
            practiceQuestionIndex <
            practiceQuestions.length - 1
        ) {

            setPracticeQuestionIndex(
                previous => previous + 1
            )

            setPracticeAnswer('')

            setAnswerSubmitted(false)

            setEvaluation(null)

            setAnswerError(null)

        }

    }



    // ─────────────────────────────────────────────────────────────────────────
    // Start Again
    // ─────────────────────────────────────────────────────────────────────────

    const handleStartAgain = async () => {

        // Generate completely fresh questions.
        await startPracticeInterview()

    }



    return (

        <div className='interview-page'>


            {/* ───────────────── Top Bar ───────────────── */}

            <div className='interview-topbar'>

                <button
                    className='back-button'
                    onClick={() => navigate("/")}
                >
                    ← Back to Dashboard
                </button>


                <div className='interview-title'>

                    <h1>
                        {report.title}
                    </h1>

                    <p>
                        AI-generated interview preparation plan
                    </p>

                    <span>

                        Generated on{" "}

                        {new Date(
                            report.createdAt
                        ).toLocaleDateString()}

                    </span>

                </div>

            </div>



            <div className='interview-layout'>


                {/* ───────────────── Left Navigation ───────────────── */}

                <nav className='interview-nav'>

                    <div className="nav-content">

                        <p className='interview-nav__label'>
                            Sections
                        </p>


                        {NAV_ITEMS.map(item => (

                            <button
                                key={item.id}
                                className={`interview-nav__item ${
                                    activeNav === item.id
                                        ? 'interview-nav__item--active'
                                        : ''
                                }`}
                                onClick={() =>
                                    setActiveNav(item.id)
                                }
                            >

                                <span className='interview-nav__icon'>
                                    {item.icon}
                                </span>

                                {item.label}

                            </button>

                        ))}

                    </div>


                    {/* Download Resume */}

                    <button
                        onClick={() => {
                            getResumePdf(interviewId)
                        }}
                        className='button primary-button'
                    >

                        <svg
                            height={"0.8rem"}
                            style={{
                                marginRight: "0.8rem"
                            }}
                            xmlns="http://www.w3.org/2000/svg"
                            viewBox="0 0 24 24"
                            fill="currentColor"
                        >

                            <path d="M10.6144 17.7956 11.492 15.7854C12.2731 13.9966 13.6789 12.5726 15.4325 11.7942L17.8482 10.7219C18.6162 10.381 18.6162 9.26368 17.8482 8.92277L15.5079 7.88394C13.7092 7.08552 12.2782 5.60881 11.5105 3.75894L10.6215 1.61673C10.2916.821765 9.19319.821767 8.8633 1.61673L7.97427 3.75892C7.20657 5.60881 5.77553 7.08552 3.97685 7.88394L1.63658 8.92277C.868537 9.26368.868536 10.381 1.63658 10.7219L4.0523 11.7942C5.80589 12.5726 7.21171 13.9966 7.99275 15.7854L8.8704 17.7956C9.20776 18.5682 10.277 18.5682 10.6144 17.7956ZM19.4014 22.6899 19.6482 22.1242C20.0882 21.1156 20.8807 20.3125 21.8695 19.8732L22.6299 19.5353C23.0412 19.3522 23.0412 18.7549 22.6299 18.5722L21.9121 18.2532C20.8978 17.8026 20.0911 16.9699 19.6586 15.9269L19.4052 15.3156C19.2285 14.8896 18.6395 14.8896 18.4628 15.3156L18.2094 15.9269C17.777 16.9699 16.9703 17.8026 15.956 18.2532L15.2381 18.5722C14.8269 18.7549 14.8269 19.3522 15.2381 19.5353L15.9985 19.8732C16.9874 20.3125 17.7798 21.1156 18.2198 22.1242L18.4667 22.6899C18.6473 23.104 19.2207 23.104 19.4014 22.6899Z"/>

                        </svg>

                        Download Resume

                    </button>

                </nav>



                <div className='interview-divider' />



                {/* ───────────────── Center Content ───────────────── */}

                <main className='interview-content'>


                    {/* Technical Questions */}

                    {activeNav === 'technical' && (

                        <section>

                            <div className='content-header'>

                                <h2>
                                    Technical Questions
                                </h2>

                                <span className='content-header__count'>
                                    {report.technicalQuestions.length} questions
                                </span>

                            </div>


                            <div className='q-list'>

                                {report.technicalQuestions.map(
                                    (q, i) => (

                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                        />

                                    )
                                )}

                            </div>

                        </section>

                    )}



                    {/* Behavioral Questions */}

                    {activeNav === 'behavioral' && (

                        <section>

                            <div className='content-header'>

                                <h2>
                                    Behavioral Questions
                                </h2>

                                <span className='content-header__count'>
                                    {report.behavioralQuestions.length} questions
                                </span>

                            </div>


                            <div className='q-list'>

                                {report.behavioralQuestions.map(
                                    (q, i) => (

                                        <QuestionCard
                                            key={i}
                                            item={q}
                                            index={i}
                                        />

                                    )
                                )}

                            </div>

                        </section>

                    )}



                    {/* Road Map */}

                    {activeNav === 'roadmap' && (

                        <section>

                            <div className='content-header'>

                                <h2>
                                    Preparation Road Map
                                </h2>

                                <span className='content-header__count'>
                                    {report.preparationPlan.length}-day plan
                                </span>

                            </div>


                            <div className='roadmap-list'>

                                {report.preparationPlan.map(
                                    (day) => (

                                        <RoadMapDay
                                            key={day.day}
                                            day={day}
                                        />

                                    )
                                )}

                            </div>

                        </section>

                    )}



                    {/* Practice Interview */}

                    {activeNav === 'practice' && (

                        <section>

                            <div className='content-header'>

                                <h2>
                                    Practice Interview
                                </h2>

                                <span className='content-header__count'>

                                    {practiceStarted
                                        ? `Question ${practiceQuestionIndex + 1}`
                                        : 'AI Interview'
                                    }

                                </span>

                            </div>



                            {/* Start Screen */}

                            {!practiceStarted ? (

                                <div className='practice-intro'>

                                    <h3>
                                        Ready to practice?
                                    </h3>

                                    <p>
                                        Test yourself with fresh AI-generated
                                        questions based on your interview plan.
                                    </p>


                                    <button
                                        className='button primary-button'
                                        onClick={startPracticeInterview}
                                        disabled={generatingQuestions}
                                    >

                                        {generatingQuestions
                                            ? "Generating Questions..."
                                            : "Start Practice Interview"
                                        }

                                    </button>


                                    {startPracticeError && (

                                        <div className='practice-inline-error'>
                                            {startPracticeError}
                                        </div>

                                    )}

                                </div>

                            ) : (

                                /* Question Screen */

                                <div className='practice-question'>


                                    <span className='practice-question__number'>

                                        Question {practiceQuestionIndex + 1}
                                        {" "}of{" "}
                                        {practiceQuestions.length}

                                    </span>


                                    {currentQuestion && (

                                        <>

                                            <h3>
                                                {currentQuestion.question}
                                            </h3>


                                            {/* Answer box */}

                                            <textarea
                                                className='practice-answer'
                                                placeholder='Type your answer here...'
                                                value={practiceAnswer}
                                                onChange={(e) =>
                                                    setPracticeAnswer(
                                                        e.target.value
                                                    )
                                                }
                                                disabled={
                                                    answerSubmitted ||
                                                    evaluating
                                                }
                                            />


                                            {/* Submit Answer */}

                                            {!answerSubmitted && (

                                                <button
                                                    className='button primary-button'
                                                    disabled={
                                                        !practiceAnswer.trim() ||
                                                        evaluating
                                                    }
                                                    onClick={
                                                        handleSubmitAnswer
                                                    }
                                                >

                                                    {evaluating
                                                        ? "Evaluating..."
                                                        : "Submit Answer"
                                                    }

                                                </button>

                                            )}


                                            {answerError && (

                                                <div className='practice-inline-error'>
                                                    {answerError}
                                                </div>

                                            )}


                                            {/* AI Evaluation */}

                                            {answerSubmitted &&
                                                evaluation && (

                                                    <div className='practice-feedback'>

                                                        <h4>
                                                            AI Feedback
                                                        </h4>

                                                        <p>
                                                            {evaluation.feedback}
                                                        </p>


                                                        {/* Score */}

                                                        <p>
                                                            <strong>
                                                                Score:
                                                            </strong>{" "}
                                                            {evaluation.score}
                                                            /10
                                                        </p>


                                                        {/* Strengths */}

                                                        {evaluation.strengths?.length > 0 && (

                                                            <div>

                                                                <h5>
                                                                    Strengths
                                                                </h5>

                                                                <ul>

                                                                    {evaluation.strengths.map(
                                                                        (strength, index) => (

                                                                            <li key={index}>
                                                                                {strength}
                                                                            </li>

                                                                        )
                                                                    )}

                                                                </ul>

                                                            </div>

                                                        )}


                                                        {/* Improvements */}

                                                        {evaluation.improvements?.length > 0 && (

                                                            <div>

                                                                <h5>
                                                                    Areas to Improve
                                                                </h5>

                                                                <ul>

                                                                    {evaluation.improvements.map(
                                                                        (improvement, index) => (

                                                                            <li key={index}>
                                                                                {improvement}
                                                                            </li>

                                                                        )
                                                                    )}

                                                                </ul>

                                                            </div>

                                                        )}


                                                        {/* Ideal Answer */}

                                                        {evaluation.idealAnswer && (

                                                            <div>

                                                                <h5>
                                                                    Ideal Answer
                                                                </h5>

                                                                <p>
                                                                    {evaluation.idealAnswer}
                                                                </p>

                                                            </div>

                                                        )}



                                                        {/* Next Question */}

                                                        {practiceQuestionIndex <
                                                        practiceQuestions.length - 1 ? (

                                                            <button
                                                                className='button primary-button'
                                                                onClick={
                                                                    handleNextQuestion
                                                                }
                                                            >
                                                                Next Question
                                                            </button>

                                                        ) : (

                                                            <div className='practice-complete'>

                                                                <h3>
                                                                    Session complete
                                                                </h3>

                                                                <p>
                                                                    You have completed all
                                                                    practice questions.
                                                                </p>


                                                                {/* Save Status */}

                                                                {savingAttempt && (

                                                                    <p className='practice-save-status'>
                                                                        Saving your results...
                                                                    </p>

                                                                )}

                                                                {attemptSaved && !saveError && (

                                                                    <p className='practice-save-status practice-save-status--success'>
                                                                        ✓ Saved to your practice history.
                                                                    </p>

                                                                )}

                                                                {saveError && (

                                                                    <div className='practice-save-status practice-save-status--error'>

                                                                        <p>
                                                                            {saveError}
                                                                        </p>

                                                                        <button
                                                                            className='button secondary-button'
                                                                            onClick={
                                                                                saveCompletedAttempt
                                                                            }
                                                                        >
                                                                            Retry Save
                                                                        </button>

                                                                    </div>

                                                                )}


                                                                {/* Overall Score */}

                                                                {practiceEvaluations.length > 0 && (

                                                                    <>

                                                                        <h4>
                                                                            Overall Score
                                                                        </h4>

                                                                        <div className='practice-overall-score'>

                                                                            {
                                                                                savedSummary
                                                                                    ? savedSummary.overallScore.toFixed(1)
                                                                                    : (
                                                                                        practiceEvaluations.reduce(
                                                                                            (
                                                                                                total,
                                                                                                item
                                                                                            ) =>
                                                                                                total +
                                                                                                Number(
                                                                                                    item.score || 0
                                                                                                ),
                                                                                            0
                                                                                        ) /
                                                                                        practiceEvaluations.length
                                                                                    ).toFixed(1)
                                                                            }

                                                                            /10

                                                                        </div>


                                                                        {/* Overall Feedback */}

                                                                        <h4>
                                                                            Overall Feedback
                                                                        </h4>

                                                                        <p>
                                                                            {savedSummary
                                                                                ? savedSummary.overallFeedback
                                                                                : practiceEvaluations.length === 4
                                                                                    ? "You completed all four questions. Review your individual feedback above and focus on the areas where your scores were lowest."
                                                                                    : "Review your individual feedback and continue practicing the areas where you need improvement."
                                                                            }
                                                                        </p>


                                                                        {/* Overall Strengths */}

                                                                        <h4>
                                                                            Strong Areas
                                                                        </h4>

                                                                        <ul>

                                                                            {[
                                                                                ...new Set(
                                                                                    practiceEvaluations.flatMap(
                                                                                        evaluation =>
                                                                                            evaluation.strengths || []
                                                                                    )
                                                                                )
                                                                            ]
                                                                                .slice(0, 5)
                                                                                .map(
                                                                                    (
                                                                                        strength,
                                                                                        index
                                                                                    ) => (

                                                                                        <li key={index}>
                                                                                            {strength}
                                                                                        </li>

                                                                                    )
                                                                                )}

                                                                        </ul>


                                                                        {/* Overall Improvements */}

                                                                        <h4>
                                                                            Areas to Improve
                                                                        </h4>

                                                                        <ul>

                                                                            {(
                                                                                savedSummary
                                                                                    ? savedSummary.areasToImprove
                                                                                    : [
                                                                                        ...new Set(
                                                                                            practiceEvaluations.flatMap(
                                                                                                evaluation =>
                                                                                                    evaluation.improvements || []
                                                                                            )
                                                                                        )
                                                                                    ]
                                                                            )
                                                                                .slice(0, 5)
                                                                                .map(
                                                                                    (
                                                                                        improvement,
                                                                                        index
                                                                                    ) => (

                                                                                        <li key={index}>
                                                                                            {improvement}
                                                                                        </li>

                                                                                    )
                                                                                )}

                                                                        </ul>

                                                                    </>

                                                                )}


                                                                {/* Start Again */}

                                                                <button
                                                                    className='button primary-button'
                                                                    onClick={
                                                                        handleStartAgain
                                                                    }
                                                                    disabled={
                                                                        generatingQuestions
                                                                    }
                                                                >

                                                                    {generatingQuestions
                                                                        ? "Generating New Questions..."
                                                                        : "Start Again"
                                                                    }

                                                                </button>

                                                            </div>

                                                        )}

                                                    </div>

                                                )}

                                        </>

                                    )}

                                </div>

                            )}

                        </section>

                    )}

                </main>



                <div className='interview-divider' />



                {/* ───────────────── Right Sidebar ───────────────── */}

                <aside className='interview-sidebar'>


                    {/* Match Score */}

                    <div className='match-score'>

                        <p className='match-score__label'>
                            Match Score
                        </p>


                        <div
                            className={`match-score__ring ${scoreColor}`}
                        >

                            <span className='match-score__value'>
                                {report.matchScore}
                            </span>

                            <span className='match-score__pct'>
                                %
                            </span>

                        </div>


                        <p className='match-score__sub'>
                            {scoreMessage}
                        </p>

                    </div>



                    {/* Skill Gaps */}

                    <div className='skill-gaps'>

                        <p className='skill-gaps__label'>
                            Skill Gaps
                        </p>


                        <div className='skill-gaps__list'>

                            {report.skillGaps.map(
                                (gap, i) => (

                                    <span
                                        key={i}
                                        className={`skill-tag skill-tag--${gap.severity}`}
                                    >
                                        {gap.skill}
                                    </span>

                                )
                            )}

                        </div>

                    </div>

                </aside>

            </div>

        </div>

    )

}


export default Interview
import React, { useEffect, useState } from 'react'
import '../style/history.scss'
import { useNavigate, useParams } from 'react-router'
import { getPracticeAttemptById } from '../services/interview.api.js'


const PracticeAttemptDetail = () => {

    const { attemptId } = useParams()

    const navigate = useNavigate()

    const [attempt, setAttempt] =
        useState(null)

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')


    useEffect(() => {

        const loadAttempt = async () => {

            try {

                setLoading(true)

                setError('')


                const response =
                    await getPracticeAttemptById(
                        attemptId
                    )

                setAttempt(
                    response.practiceAttempt
                )


            } catch (err) {

                console.error(
                    'Get Practice Attempt Error:',
                    err
                )

                setError(
                    'Unable to load this practice attempt.'
                )

            } finally {

                setLoading(false)

            }

        }

        if (attemptId) {

            loadAttempt()

        }

    }, [attemptId])


    if (loading) {

        return (

            <div className='history-page'>

                <div className='history-loading'>

                    <div className='spinner' />

                    Loading your practice session...

                </div>

            </div>

        )

    }


    if (error || !attempt) {

        return (

            <div className='history-page'>

                <div className='history-error'>
                    {error || 'Practice attempt not found.'}
                </div>

                <button
                    className='back-link'
                    onClick={
                        () => navigate('/practice-history')
                    }
                >
                    &larr; Back to Practice History
                </button>

            </div>

        )

    }


    return (

        <div className='history-page'>

            <div className='history-header'>

                <div>

                    <h1>
                        {
                            attempt.interviewReport?.title ||
                            'Practice Session'
                        }
                    </h1>

                    <p>
                        {
                            new Date(
                                attempt.createdAt
                            ).toLocaleString()
                        }
                    </p>

                </div>

                <button
                    className='back-link'
                    onClick={
                        () => navigate('/practice-history')
                    }
                >
                    &larr; Back to Practice History
                </button>

            </div>


            <div className='attempt-detail'>

                {/* Overall Summary */}

                <div className='attempt-summary-card'>

                    <h2>
                        Overall Result
                    </h2>

                    <div className='attempt-summary-score'>
                        {attempt.overallScore?.toFixed(1)}/10
                    </div>

                    <p>
                        {
                            attempt.overallFeedback ||
                            'No overall feedback available for this attempt.'
                        }
                    </p>

                    {attempt.areasToImprove?.length > 0 && (

                        <div className='attempt-summary-tags'>

                            {attempt.areasToImprove.map(
                                (area, index) => (

                                    <span key={index}>
                                        {area}
                                    </span>

                                )
                            )}

                        </div>

                    )}

                </div>


                {/* Individual Questions */}

                {attempt.questions?.map((item, index) => (

                    <div
                        className='attempt-question-card'
                        key={index}
                    >

                        <div className='attempt-question-card__header'>

                            <h3>
                                Question {index + 1}
                            </h3>

                            <span className='attempt-question-card__score'>
                                {item.score}/10
                            </span>

                        </div>


                        <div className='attempt-question-card__section'>

                            <h4>
                                Question
                            </h4>

                            <p>
                                {item.question}
                            </p>

                        </div>


                        <div className='attempt-question-card__section'>

                            <h4>
                                Your Answer
                            </h4>

                            <p>
                                {item.answer}
                            </p>

                        </div>


                        <div className='attempt-question-card__section'>

                            <h4>
                                Feedback
                            </h4>

                            <p>
                                {item.feedback}
                            </p>

                        </div>


                        {item.strengths?.length > 0 && (

                            <div className='attempt-question-card__section'>

                                <h4>
                                    Strengths
                                </h4>

                                <ul>

                                    {item.strengths.map(
                                        (strength, i) => (

                                            <li key={i}>
                                                {strength}
                                            </li>

                                        )
                                    )}

                                </ul>

                            </div>

                        )}


                        {item.improvements?.length > 0 && (

                            <div className='attempt-question-card__section'>

                                <h4>
                                    Areas to Improve
                                </h4>

                                <ul>

                                    {item.improvements.map(
                                        (improvement, i) => (

                                            <li key={i}>
                                                {improvement}
                                            </li>

                                        )
                                    )}

                                </ul>

                            </div>

                        )}


                        {item.idealAnswer && (

                            <div className='attempt-question-card__section'>

                                <h4>
                                    Ideal Answer
                                </h4>

                                <p>
                                    {item.idealAnswer}
                                </p>

                            </div>

                        )}

                    </div>

                ))}

            </div>

        </div>

    )

}


export default PracticeAttemptDetail

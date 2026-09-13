import React, { useEffect, useState } from 'react'
import '../style/history.scss'
import { useNavigate } from 'react-router'
import { getPracticeHistory } from '../services/interview.api.js'


const scoreClass = (score) => {

    if (score >= 8) {

        return 'score--high'

    }

    if (score >= 5) {

        return 'score--mid'

    }

    return 'score--low'

}


const PracticeHistory = () => {

    const [attempts, setAttempts] =
        useState([])

    const [loading, setLoading] =
        useState(true)

    const [error, setError] =
        useState('')

    const navigate = useNavigate()


    useEffect(() => {

        const loadHistory = async () => {

            try {

                setLoading(true)

                setError('')


                const response =
                    await getPracticeHistory()

                setAttempts(
                    response.practiceAttempts || []
                )


            } catch (err) {

                console.error(
                    'Get Practice History Error:',
                    err
                )

                setError(
                    'Unable to load your practice history right now.'
                )

            } finally {

                setLoading(false)

            }

        }

        loadHistory()

    }, [])


    return (

        <div className='history-page'>

            <div className='history-header'>

                <div>

                    <h1>
                        Practice History
                    </h1>

                    <p>
                        Review your past practice interview sessions.
                    </p>

                </div>

                <button
                    className='back-link'
                    onClick={
                        () => navigate('/')
                    }
                >
                    &larr; Back to Home
                </button>

            </div>


            {loading && (

                <div className='history-loading'>
                    <div className='spinner' />
                    Loading your practice history...
                </div>

            )}


            {!loading && error && (

                <div className='history-error'>
                    {error}
                </div>

            )}


            {!loading && !error && attempts.length === 0 && (

                <div className='history-empty'>

                    <h3>
                        No practice attempts yet
                    </h3>

                    <p>
                        Start a practice interview from any of your
                        interview plans, and it will show up here
                        once completed.
                    </p>

                </div>

            )}


            {!loading && !error && attempts.length > 0 && (

                <ul className='history-list'>

                    {attempts.map(attempt => (

                        <li
                            key={attempt._id}
                            className='history-item'
                            onClick={
                                () => navigate(
                                    `/practice-history/${attempt._id}`
                                )
                            }
                        >

                            <div className='history-item__info'>

                                <h3>
                                    {
                                        attempt.interviewReport?.title ||
                                        'Untitled Position'
                                    }
                                </h3>

                                <span>
                                    {
                                        new Date(
                                            attempt.createdAt
                                        ).toLocaleDateString(
                                            undefined,
                                            {
                                                year: 'numeric',
                                                month: 'short',
                                                day: 'numeric'
                                            }
                                        )
                                    }
                                    {' '}&bull;{' '}
                                    {attempt.questions?.length || 0} question
                                    {attempt.questions?.length === 1 ? '' : 's'}
                                </span>

                            </div>


                            <div
                                className={
                                    `history-item__score ${scoreClass(attempt.overallScore)}`
                                }
                            >
                                {attempt.overallScore?.toFixed(1)}/10
                            </div>

                        </li>

                    ))}

                </ul>

            )}

        </div>

    )

}


export default PracticeHistory

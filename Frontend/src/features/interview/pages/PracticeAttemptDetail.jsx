import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { getPracticeAttemptById } from '../services/interview.api.js'
import '../style/history.scss'

const PracticeAttemptDetail = () => {
  const { attemptId } = useParams()
  const navigate = useNavigate()
  const [attempt, setAttempt] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let active = true
    getPracticeAttemptById(attemptId).then(response => { if (active) setAttempt(response.practiceAttempt) })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Unable to load this attempt.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [attemptId])

  if (loading) return <main className="history-state"><div className="spinner"/><p>Loading your test review…</p></main>
  if (error) return <main className="attempt-detail-page"><div className="inline-alert">{error}</div><button className="button button-secondary" onClick={() => navigate('/practice-history')}>Back to performance</button></main>
  if (!attempt) return null

  const questions = attempt.questions || []
  const correct = questions.filter(item => item.isCorrect).length
  const completed = Boolean(attempt.completedAt || questions.some(item => item.isCorrect !== undefined))

  return <main className="history-page"><header className="history-topbar"><button className="brand-lockup" onClick={() => navigate('/')}><span className="brand-mark">✦</span><span>Prepwise<span className="brand-dot">.</span></span></button><button className="button button-ghost" onClick={() => navigate('/practice-history')}>← All performances</button></header><div className="attempt-detail-page"><header className="attempt-detail-header"><div><span className="eyebrow">TEST REVIEW</span><h1>{attempt.interviewReport?.title || 'Interview practice'}</h1><p>{attempt.createdAt ? new Date(attempt.createdAt).toLocaleString(undefined,{dateStyle:'full',timeStyle:'short'}) : 'Practice attempt'}</p></div><span className={`history-status ${completed?'complete':'incomplete'}`}>{completed?'Completed':'In progress'}</span></header>
    <section className="attempt-summary"><div className="attempt-summary-score"><strong>{completed ? `${Math.round((attempt.overallScore || 0)*10)}%` : '—'}</strong><span>{completed ? `${correct} of ${questions.length} correct` : 'Not submitted'}</span></div><div className="attempt-summary-content"><span className="eyebrow">OVERALL FEEDBACK</span><h2>{completed ? 'Your performance summary' : 'This attempt is not complete'}</h2><p>{attempt.overallFeedback || (completed ? 'Review the questions below to reinforce your learning.' : 'This attempt was saved but has not been submitted for scoring.')}</p>{attempt.areasToImprove?.length > 0 && <><h3>Recommended areas to improve</h3><ul>{attempt.areasToImprove.map((item,index)=><li key={index}>{item}</li>)}</ul></>}</div></section>
    <section className="attempt-detail-section"><h2>Question-by-question review</h2>{questions.map((item,index) => <article className="attempt-question-card" key={`${item.question}-${index}`}><div className="attempt-question-card__header"><h3>Question {index+1}. {item.question}</h3>{item.isCorrect !== undefined && <span className={`review-status ${item.isCorrect?'correct':'incorrect'}`}>{item.isCorrect?'Correct':'Incorrect'}</span>}</div>{item.topic && <p className="topic-chip" style={{display:'inline-block',marginTop:10}}>{item.topic}</p>}{item.options?.length > 0 ? <div className="attempt-question-card__section"><h4>Answer options</h4>{item.options.map((option,optionIndex)=>{const isCorrect=optionIndex===item.correctAnswer;const isChosen=optionIndex===item.selectedAnswer;return <div key={`${option}-${optionIndex}`} className={`attempt-option-line ${isCorrect?'correct':''} ${isChosen&&!isCorrect?'chosen-wrong':''}`}><strong>{String.fromCharCode(65+optionIndex)}.</strong> {option}{isCorrect?' · Correct answer':''}{isChosen?' · Your answer':''}</div>})}</div> : <div className="attempt-question-card__section"><h4>Your answer</h4><p>{item.answer || 'No answer recorded.'}</p></div>}{item.explanation && <div className="attempt-question-card__section"><h4>Explanation</h4><p>{item.explanation}</p></div>}{item.feedback && !item.explanation && <div className="attempt-question-card__section"><h4>Feedback</h4><p>{item.feedback}</p></div>}</article>)}</section><button className="button button-primary" onClick={() => navigate('/')}>Practice another test →</button></div><footer className="dashboard-footer"><span>Prepwise<span className="brand-dot">.</span></span><span>Learn from every attempt.</span></footer></main>
}
export default PracticeAttemptDetail

import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router'
import { getPracticeHistory } from '../services/interview.api.js'
import '../style/history.scss'

const scorePercent = attempt => Math.round((attempt.overallScore || 0) * 10)

const PracticeHistory = () => {
  const [attempts, setAttempts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  useEffect(() => {
    let active = true
    getPracticeHistory().then(response => { if (active) setAttempts(response.practiceAttempts || []) })
      .catch(err => { if (active) setError(err.response?.data?.message || 'Unable to load your performance history right now.') })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [])

  const completed = useMemo(() => attempts.filter(item => item.completedAt || item.overallFeedback || item.questions?.some(q => q.isCorrect !== undefined)), [attempts])
  const average = completed.length ? Math.round(completed.reduce((sum, item) => sum + scorePercent(item), 0) / completed.length) : 0
  const best = completed.length ? Math.max(...completed.map(scorePercent)) : 0
  const latest = completed[0] ? scorePercent(completed[0]) : 0
  const topicStats = useMemo(() => {
    const grouped = {}
    completed.forEach(attempt => (attempt.questions || []).forEach(question => {
      if (question.isCorrect === undefined) return
      const topic = question.topic || 'General'
      if (!grouped[topic]) grouped[topic] = { topic, total: 0, correct: 0 }
      grouped[topic].total += 1
      if (question.isCorrect) grouped[topic].correct += 1
    }))
    return Object.values(grouped).map(item => ({ ...item, percent: Math.round(item.correct / item.total * 100) })).sort((a,b) => a.percent-b.percent)
  }, [completed])
  const chartAttempts = [...completed].slice(0, 8).reverse()
  const points = chartAttempts.map((item, index) => ({ x: chartAttempts.length <= 1 ? 50 : 24 + index * (252 / (chartAttempts.length - 1)), y: 164 - scorePercent(item) * 1.35, score: scorePercent(item) }))
  const linePath = points.map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`).join(' ')

  return <main className="history-page"><header className="history-topbar"><button className="brand-lockup" onClick={() => navigate('/')}><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg></span><span>Prepwise<span className="brand-dot">.</span></span></button><div><button className="button button-ghost" onClick={() => navigate('/')}>← Dashboard</button></div></header>
    <section className="history-heading"><div><span className="eyebrow">YOUR GROWTH OVER TIME</span><h1>Performance analytics</h1><p>See how you're progressing, revisit past attempts, and decide what to practice next.</p></div><button className="button button-primary" onClick={() => navigate('/')}>Start a new practice test <span>→</span></button></section>
    {loading && <div className="history-state"><div className="spinner"/><p>Loading your performance…</p></div>}
    {!loading && error && <div className="inline-alert" role="alert">{error}</div>}
    {!loading && !error && <>
      <section className="analytics-stats"><article><span className="analytics-stat-icon violet">↗</span><span>Completed tests</span><strong>{completed.length}</strong><small>Saved practice attempts</small></article><article><span className="analytics-stat-icon green">◎</span><span>Average score</span><strong>{average}%</strong><small>Across completed tests</small></article><article><span className="analytics-stat-icon amber">✦</span><span>Personal best</span><strong>{best}%</strong><small>Your highest score so far</small></article><article><span className="analytics-stat-icon blue">◷</span><span>Latest score</span><strong>{latest}%</strong><small>{completed[0]?.createdAt ? new Date(completed[0].createdAt).toLocaleDateString() : 'Complete a test to begin'}</small></article></section>
      <section className="analytics-main-grid"><article className="analytics-card score-trend-card"><div className="analytics-card-heading"><div><span className="eyebrow">SCORE TREND</span><h2>Your progress</h2></div><span className="trend-legend"><i/> Score</span></div>{points.length > 0 ? <><svg className="score-chart" viewBox="0 0 300 190" role="img" aria-label="Score trend for your recent completed tests"><defs><linearGradient id="scoreFill" x1="0" x2="0" y1="0" y2="1"><stop offset="0%" stopColor="#8175eb" stopOpacity=".25"/><stop offset="100%" stopColor="#8175eb" stopOpacity="0"/></linearGradient></defs>{[30,70,110,150].map(y => <g key={y}><line x1="20" x2="285" y1={y} y2={y} stroke="#edeef5" strokeDasharray="3 5"/><text x="1" y={y+4} fill="#9a9fb1" fontSize="9">{Math.round((164-y)/1.35)}%</text></g>)}{points.length > 1 && <path d={`${linePath} L ${points[points.length-1].x} 170 L ${points[0].x} 170 Z`} fill="url(#scoreFill)"/>}<path d={linePath} fill="none" stroke="#7669e8" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round"/>{points.map((point,index) => <g key={`${point.x}-${index}`}><circle cx={point.x} cy={point.y} r="4.5" fill="#fff" stroke="#7669e8" strokeWidth="2.5"/><text x={point.x} y="185" textAnchor="middle" fill="#8d92a7" fontSize="9">{index+1}</text></g>)}</svg><p className="chart-caption">Last {points.length} completed test{points.length===1?'':'s'} · tests are shown from oldest to newest</p></> : <div className="chart-empty"><span>↗</span><h3>Your progress will appear here</h3><p>Complete your first MCQ test to start tracking your score over time.</p></div>}</article>
      <article className="analytics-card focus-card"><span className="eyebrow">NEXT BEST STEP</span><h2>Build a consistent practice habit</h2><p>Your results become more useful with each completed test. Review the explanations, focus on weaker topics, and take another test to compare progress.</p><div className="focus-mini-stats"><div><strong>{completed.length ? `${average}%` : '—'}</strong><span>Average</span></div><div><strong>{completed.length ? `${best}%` : '—'}</strong><span>Best score</span></div></div><button className="button button-secondary" onClick={() => navigate('/')}>Practice again <span>→</span></button></article></section>
      {topicStats.length > 0 && <section className="topic-analytics"><div className="section-title"><div><span className="eyebrow">LEARN WHERE IT COUNTS</span><h2>Topic-wise accuracy</h2><p>These insights combine your completed MCQ attempts.</p></div></div><div className="topic-analytics-grid">{topicStats.map(topic => <article className="topic-analytics-item" key={topic.topic}><div><strong>{topic.topic}</strong><span>{topic.correct}/{topic.total} correct</span></div><div className="topic-progress"><span style={{width:`${topic.percent}%`}}/></div><strong className="topic-percent">{topic.percent}%</strong></article>)}</div></section>}
      <section className="history-list-section"><div className="section-title"><div><span className="eyebrow">YOUR TEST ARCHIVE</span><h2>Past performances</h2><p>Open any completed test to review answers and AI feedback.</p></div><span className="history-count">{attempts.length} attempt{attempts.length===1?'':'s'}</span></div>{attempts.length === 0 ? <div className="history-empty"><span>✦</span><h3>No practice attempts yet</h3><p>Generate an interview plan and complete an MCQ test. Your results will be saved here.</p><button className="button button-primary" onClick={() => navigate('/')}>Create an interview plan →</button></div> : <div className="history-list">{attempts.map((attempt,index) => { const percent=scorePercent(attempt); const isComplete=Boolean(attempt.completedAt || attempt.overallFeedback || attempt.questions?.some(q => q.isCorrect !== undefined)); return <button type="button" key={attempt._id} className="history-item" disabled={!isComplete} onClick={() => navigate(`/practice-history/${attempt._id}`)}><span className="history-index">{String(index+1).padStart(2,'0')}</span><span className="history-item-info"><strong>{attempt.interviewReport?.title || 'Interview practice'}</strong><small>{attempt.createdAt ? new Date(attempt.createdAt).toLocaleString(undefined,{dateStyle:'medium',timeStyle:'short'}) : 'Saved attempt'} · {attempt.questions?.length || 0} questions</small></span><span className={`history-status ${isComplete?'complete':'incomplete'}`}>{isComplete?'Completed':'In progress'}</span><span className="history-item-score"><strong>{isComplete ? `${percent}%` : '—'}</strong><small>{isComplete?'Score':'Not submitted'}</small></span><span className="history-chevron">→</span></button> })}</div>}</section>
    </>}
    <footer className="dashboard-footer"><span>Prepwise<span className="brand-dot">.</span></span><span>Your progress, at your pace.</span></footer>
  </main>
}
export default PracticeHistory

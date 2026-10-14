import { useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { useInterview } from '../hooks/useInterview.js'
import { completePracticeAttempt, evaluatePracticeAnswer, generatePracticeQuestions } from '../services/interview.api.js'
import '../style/interview.scss'

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'technical', label: 'Technical prep' },
  { id: 'behavioral', label: 'Behavioral prep' },
  { id: 'roadmap', label: 'Roadmap' },
  { id: 'practice', label: 'MCQ practice' }
]

function Icon({ name }) {
  const paths = {
    sparkles: <><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/><path d="m19 14 1.2 2.8L23 18l-2.8 1.2L19 22l-1.2-2.8L15 18l2.8-1.2L19 14Z"/></>,
    arrow: <><path d="M5 12h14"/><path d="m12 5 7 7-7 7"/></>,
    clock: <><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,
    check: <path d="m5 12 4 4L19 6"/>,
    file: <><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 2v6h6M8 13h8M8 17h8"/></>
  }
  return <svg viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">{paths[name] || paths.sparkles}</svg>
}

const Interview = () => {
  const { interviewId } = useParams()
  const navigate = useNavigate()
  const { loading, report, loadError, getResumePdf } = useInterview()
  const [activeTab, setActiveTab] = useState('overview')
  const [generating, setGenerating] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [questions, setQuestions] = useState([])
  const [attemptId, setAttemptId] = useState(null)
  const [answers, setAnswers] = useState({})
  const [results, setResults] = useState(null)


  const topicResults = useMemo(() => {
    if (!results?.questions) return []
    const grouped = {}
    results.questions.forEach(q => {
      const topic = q.topic || 'General'
      if (!grouped[topic]) grouped[topic] = { topic, total: 0, correct: 0 }
      grouped[topic].total += 1
      if (q.isCorrect) grouped[topic].correct += 1
    })
    return Object.values(grouped).map(item => ({ ...item, percent: Math.round(item.correct / item.total * 100) }))
  }, [results])

  const startTest = async () => {
    setGenerating(true); setError(''); setResults(null); setAnswers({}); setQuestions([]); setAttemptId(null)
    try {
      const response = await generatePracticeQuestions(interviewId)
      setQuestions(response.questions || [])
      setAttemptId(response.attemptId)
      if (!response.questions?.length) throw new Error('No questions were returned. Please try again.')
    } catch (err) {
      setError(err.response?.data?.message || err.message || 'Unable to generate your test. Please try again.')
    } finally { setGenerating(false) }
  }

  const submitTest = async () => {
    if (questions.some((_, index) => answers[index] === undefined)) {
      setError('Please answer every question before submitting.'); return
    }
    setSubmitting(true); setError('')
    try {
      for (let index = 0; index < questions.length; index += 1) {
        await evaluatePracticeAnswer({ interviewId, attemptId, questionIndex: index, selectedAnswer: answers[index] })
      }
      const response = await completePracticeAttempt({ interviewId, attemptId })
      setResults(response.practiceAttempt)
    } catch (err) {
      setError(err.response?.data?.message || 'We could not submit your test. Your answers remain selected; please retry.')
    } finally { setSubmitting(false) }
  }

  const downloadResume = async () => {
    setError('')
    try { await getResumePdf(interviewId) }
    catch (err) { setError(err.response?.data?.message || 'Could not generate the improved resume. Please try again.') }
  }

  if (loading || (!report && !loadError)) return <main className="app-loading"><div className="spinner"/><p>Preparing your interview workspace…</p></main>
  if (!report && loadError) return <main className="app-loading"><div className="inline-alert" role="alert">{loadError}</div><button className="button button-primary" onClick={() => navigate('/')}>Back to dashboard</button></main>

  const score = Math.round(report.matchScore || 0)

  return <main className="workspace-page">
    <header className="workspace-topbar">
      <button className="brand-lockup" onClick={() => navigate('/')} aria-label="Back to dashboard"><span className="brand-mark"><Icon name="sparkles"/></span><span>Prepwise<span className="brand-dot">.</span></span></button>
      <div className="topbar-actions"><button className="button button-ghost" onClick={() => navigate('/practice-history')}>Performance</button><button className="button button-ghost" onClick={() => navigate('/')}>Dashboard</button></div>
    </header>

    <section className="workspace-heading">
      <div><div className="eyebrow"><span className="status-dot"/> YOUR PERSONALIZED PLAN</div><h1>{report.title || 'Interview preparation plan'}</h1><p>Practice with a focused roadmap built around your target role and profile.</p></div>
      <div className="match-card"><div className="match-ring" style={{ '--score': `${score}%` }}><span>{score}<small>%</small></span></div><div><strong>Profile match</strong><span>Resume vs. role</span></div></div>
    </section>

    <nav className="workspace-tabs" aria-label="Interview plan sections">{TABS.map(tab => <button key={tab.id} className={activeTab === tab.id ? 'workspace-tab active' : 'workspace-tab'} onClick={() => setActiveTab(tab.id)}>{tab.label}{tab.id === 'practice' && <span className="tab-pill">MCQ</span>}</button>)}</nav>

    {error && <div className="inline-alert" role="alert">{error}</div>}

    {activeTab === 'overview' && <section className="content-section">
      <div className="section-title"><div><span className="eyebrow">YOUR NEXT STEPS</span><h2>Build interview confidence</h2><p>A quick overview of your preparation plan.</p></div><button className="button button-primary" onClick={() => setActiveTab('practice')}>Start MCQ test <Icon name="arrow"/></button></div>
      <div className="overview-grid">
        <article className="feature-card feature-card-accent"><span className="feature-icon"><Icon name="sparkles"/></span><span className="eyebrow">AI-POWERED PRACTICE</span><h3>Test what you know</h3><p>Attempt a fresh set of 10 role-relevant multiple-choice questions, then get an overall performance review.</p><button className="text-action" onClick={() => setActiveTab('practice')}>Begin practice <Icon name="arrow"/></button></article>
        <article className="metric-card"><span className="metric-label">Skills to strengthen</span><strong>{report.skillGaps?.length || 0}</strong><p>Priority areas identified from your profile</p><button className="text-action" onClick={() => setActiveTab('roadmap')}>View roadmap <Icon name="arrow"/></button></article>
        <article className="metric-card"><span className="metric-label">Preparation schedule</span><strong>{report.preparationPlan?.length || 0}<small> days</small></strong><p>A practical plan to organize your preparation</p><button className="text-action" onClick={() => setActiveTab('roadmap')}>Explore plan <Icon name="arrow"/></button></article>
      </div>
      <div className="section-title section-title-spaced"><div><h2>Recommended focus areas</h2><p>Prioritize the skills that matter most for this role.</p></div></div>
      <div className="skill-list">{(report.skillGaps || []).slice(0, 5).map((gap, index) => <div className="skill-row" key={`${gap.skill}-${index}`}><span className="skill-number">{String(index + 1).padStart(2, '0')}</span><strong>{gap.skill}</strong><span className={`severity severity-${gap.severity}`}>{gap.severity} priority</span></div>)}{!report.skillGaps?.length && <p className="muted-copy">No major skill gaps were returned for this profile.</p>}</div>
      <div className="resume-cta"><span className="resume-cta-icon"><Icon name="file"/></span><div><h3>Make your resume interview-ready</h3><p>Generate a tailored, ATS-friendly resume based on your profile and target role.</p></div><button className="button button-secondary" onClick={downloadResume}>Download improved resume <Icon name="arrow"/></button></div>
    </section>}

    {activeTab === 'technical' && <section className="content-section"><div className="section-title"><div><span className="eyebrow">STUDY MATERIAL</span><h2>Technical questions</h2><p>Review likely interview questions and the key ideas a strong answer should cover.</p></div></div><div className="prep-question-list">{(report.technicalQuestions || []).map((item, index) => <details className="prep-question" key={`${item.question}-${index}`}><summary><span className="question-index">{String(index + 1).padStart(2, '0')}</span><span>{item.question}</span><span className="details-plus">+</span></summary><div className="prep-answer"><div><span className="answer-label">WHY THEY ASK</span><p>{item.intention}</p></div><div><span className="answer-label">ANSWER APPROACH</span><p>{item.answer}</p></div></div></details>)}</div></section>}

    {activeTab === 'behavioral' && <section className="content-section"><div className="section-title"><div><span className="eyebrow">COMMUNICATION & CULTURE</span><h2>Behavioral preparation</h2><p>Structure your examples around the situation, action, and result.</p></div></div><div className="prep-question-list">{(report.behavioralQuestions || []).map((item, index) => <details className="prep-question" key={`${item.question}-${index}`}><summary><span className="question-index">{String(index + 1).padStart(2, '0')}</span><span>{item.question}</span><span className="details-plus">+</span></summary><div className="prep-answer"><div><span className="answer-label">WHAT THEY ASSESS</span><p>{item.intention}</p></div><div><span className="answer-label">ANSWER FRAMEWORK</span><p>{item.answer}</p></div></div></details>)}</div></section>}

    {activeTab === 'roadmap' && <section className="content-section"><div className="section-title"><div><span className="eyebrow">YOUR PREPARATION PLAN</span><h2>Roadmap to readiness</h2><p>Work through these focused milestones at your own pace.</p></div></div><div className="roadmap-list">{(report.preparationPlan || []).map((day, index) => <article className="roadmap-item" key={`${day.day}-${index}`}><div className="roadmap-day-label">DAY <strong>{day.day}</strong></div><div className="roadmap-day-content"><h3>{day.focus}</h3><ul>{(day.tasks || []).map((task, taskIndex) => <li key={taskIndex}>{task}</li>)}</ul></div></article>)}</div></section>}

    {activeTab === 'practice' && <section className="content-section practice-section">
      {!questions.length && !results && <div className="practice-intro"><div className="practice-visual"><div className="practice-visual-orbit orbit-one"/><div className="practice-visual-orbit orbit-two"/><div className="practice-visual-center"><Icon name="sparkles"/></div><span className="float-chip chip-one">10 questions</span><span className="float-chip chip-two">AI feedback</span></div><div className="practice-intro-copy"><span className="eyebrow">KNOWLEDGE CHECK</span><h2>Ready to put your knowledge to the test?</h2><p>Each attempt generates a fresh set of questions tailored to your target role. Choose an option for every question and get a score, explanations, and personalized feedback when you submit.</p><div className="practice-facts"><span><Icon name="check"/> 4 options per question</span><span><Icon name="check"/> Instant scoring</span><span><Icon name="check"/> Saved performance history</span></div><button className="button button-primary button-large" disabled={generating} onClick={startTest}>{generating ? 'Generating fresh questions…' : 'Generate my test'} <Icon name="arrow"/></button></div></div>}

      {questions.length > 0 && !results && <div className="test-shell"><div className="test-header"><div><span className="eyebrow">PERSONALIZED ASSESSMENT</span><h2>Your knowledge check</h2><p>Choose the best answer for each question.</p></div><div className="test-counter"><strong>{Object.keys(answers).length}</strong><span>of {questions.length} answered</span></div></div><div className="test-progress"><span style={{ width: `${Object.keys(answers).length / questions.length * 100}%` }}/></div><div className="mcq-list">{questions.map((question, index) => <article className="mcq-card" key={`${question.question}-${index}`}><div className="mcq-card-heading"><span className="question-index">QUESTION {String(index + 1).padStart(2, '0')}</span><span className="topic-chip">{question.topic || 'Technical'}</span></div><h3>{question.question}</h3><div className="mcq-options">{question.options.map((option, optionIndex) => <button type="button" key={`${option}-${optionIndex}`} className={`mcq-option ${answers[index] === optionIndex ? 'selected' : ''}`} onClick={() => setAnswers(current => ({ ...current, [index]: optionIndex }))}><span className="option-letter">{String.fromCharCode(65 + optionIndex)}</span><span>{option}</span>{answers[index] === optionIndex && <span className="option-check"><Icon name="check"/></span>}</button>)}</div></article>)}</div><div className="test-submit-row"><p>{questions.length - Object.keys(answers).length === 0 ? 'You have answered every question.' : `${questions.length - Object.keys(answers).length} question${questions.length - Object.keys(answers).length === 1 ? '' : 's'} left to answer.`}</p><button className="button button-primary button-large" disabled={submitting || Object.keys(answers).length !== questions.length} onClick={submitTest}>{submitting ? 'Scoring your test…' : 'Submit test & view feedback'} <Icon name="arrow"/></button></div></div>}

      {results && <div className="results-shell"><div className="results-hero"><div className="results-score-ring" style={{ '--score': `${results.overallScore * 10}%` }}><div><strong>{results.overallScore?.toFixed(1)}</strong><span>/10</span></div></div><div><span className="eyebrow">TEST COMPLETED</span><h2>{results.overallScore >= 8 ? 'Excellent progress!' : results.overallScore >= 6 ? 'Good work — keep building.' : 'A useful starting point.'}</h2><p>Your results have been saved to Performance Analytics.</p></div></div><div className="results-metrics"><div><span>Score</span><strong>{Math.round(results.overallScore * 10)}%</strong></div><div><span>Correct answers</span><strong>{results.questions?.filter(q => q.isCorrect).length || 0}<small>/{results.questions?.length || questions.length}</small></strong></div><div><span>Topics assessed</span><strong>{topicResults.length}</strong></div></div><article className="feedback-card"><span className="eyebrow">AI OVERALL FEEDBACK</span><h3>Your performance review</h3><p>{results.overallFeedback || 'Your score has been saved. Review the question explanations below to identify what to practice next.'}</p>{results.areasToImprove?.length > 0 && <><h4>Recommended areas to improve</h4><ul>{results.areasToImprove.map((area, index) => <li key={index}>{area}</li>)}</ul></>}</article><article className="feedback-card topic-feedback"><span className="eyebrow">TOPIC BREAKDOWN</span><h3>Where to focus next</h3>{topicResults.map(topic => <div className="topic-progress-row" key={topic.topic}><div><strong>{topic.topic}</strong><span>{topic.correct}/{topic.total} correct · {topic.percent}%</span></div><div className="topic-progress"><span style={{ width: `${topic.percent}%` }}/></div></div>)}</article><div className="review-list"><h3>Answer review</h3>{results.questions?.map((question, index) => <article className="review-question" key={`${question.question}-${index}`}><div className="review-question-title"><span className={question.isCorrect ? 'review-status correct' : 'review-status incorrect'}>{question.isCorrect ? 'Correct' : 'Review'}</span><strong>{index + 1}. {question.question}</strong></div><p><b>Your answer:</b> {question.options?.[question.selectedAnswer] || question.answer || '—'}</p><p><b>Correct answer:</b> {question.options?.[question.correctAnswer] || 'See explanation'}</p><p className="review-explanation">{question.explanation || question.feedback}</p></article>)}</div><div className="results-actions"><button className="button button-secondary" onClick={() => navigate('/practice-history')}>View performance history</button><button className="button button-primary" onClick={startTest}>Try another fresh test <Icon name="arrow"/></button></div></div>}
    </section>}
    <footer className="workspace-footer"><span>Prepwise <span className="brand-dot">.</span></span><span>Small steps. Strong interviews.</span></footer>
  </main>
}

export default Interview

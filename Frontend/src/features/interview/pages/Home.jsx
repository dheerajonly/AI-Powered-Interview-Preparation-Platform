import { useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { useInterview } from '../hooks/useInterview.js'
import { useAuth } from '../../auth/hooks/useAuth.js'
import '../style/home.scss'

const Home = () => {
  const { loading, generateReport, reports, loadError } = useInterview()
  const { user, handleLogout } = useAuth()
  const navigate = useNavigate()
  const fileInput = useRef(null)
  const [jobDescription, setJobDescription] = useState('')
  const [selfDescription, setSelfDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState(null)
  const [error, setError] = useState('')
  const [loggingOut, setLoggingOut] = useState(false)

  const chooseFile = file => {
    if (!file) return
    setError('')
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      setSelectedFile(null)
      if (fileInput.current) fileInput.current.value = ''
      setError('Please upload a PDF resume. DOCX files are not supported by the current resume parser.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setSelectedFile(null)
      if (fileInput.current) fileInput.current.value = ''
      setError('Your resume must be 5 MB or smaller.')
      return
    }
    setSelectedFile(file)
  }

  const handleGenerate = async event => {
    event.preventDefault()
    setError('')
    if (!jobDescription.trim()) return setError('Add the target job description to continue.')
    if (!selectedFile && !selfDescription.trim()) return setError('Upload a PDF resume or describe your current skills.')
    try {
      const report = await generateReport({ jobDescription: jobDescription.trim(), selfDescription: selfDescription.trim(), resumeFile: selectedFile })
      if (report?._id) navigate(`/interview/${report._id}`)
      else setError('Your plan could not be created. Please try again.')
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong while generating your plan.')
    }
  }

  const logout = async () => {
    setLoggingOut(true)
    await handleLogout()
    navigate('/login')
    setLoggingOut(false)
  }

  return <main className="home-page">
    <header className="dashboard-nav">
      <button className="brand-lockup" onClick={() => navigate('/')}><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg></span><span>Prepwise<span className="brand-dot">.</span></span></button>
      <nav className="dashboard-nav-links"><button onClick={() => navigate('/practice-history')}>Performance</button><button onClick={() => navigate('/practice-history')}>Practice history</button></nav>
      <div className="dashboard-user"><div className="avatar-circle">{(user?.username || user?.name || 'U').slice(0, 1).toUpperCase()}</div><span>{user?.username || user?.name || 'Your workspace'}</span><button className="logout-button" onClick={logout} disabled={loggingOut}>{loggingOut ? 'Signing out…' : 'Log out'}</button></div>
    </header>

    <section className="dashboard-welcome"><div><span className="eyebrow"><span className="status-dot"/> YOUR INTERVIEW WORKSPACE</span><h1>Make your next interview <span>your best one.</span></h1><p>Build a focused preparation plan, practice with fresh AI-generated MCQs, and see your progress over time.</p></div><div className="welcome-decoration"><div className="welcome-orb orb-a"/><div className="welcome-orb orb-b"/><div className="welcome-center"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2Z"/><path d="M8 7h8M8 11h6"/></svg></div></div></section>

    {loadError && <div className="inline-alert" role="alert">{loadError}</div>}

    <section className="dashboard-stat-grid"><article className="dashboard-stat"><span className="stat-icon stat-icon-violet">✦</span><span>Interview plans</span><strong>{reports?.length || 0}</strong><small>Personalized to your target roles</small></article><article className="dashboard-stat"><span className="stat-icon stat-icon-green">↗</span><span>Practice analytics</span><strong>Track</strong><small>Scores, strengths, and topic gaps</small><button className="text-action" onClick={() => navigate('/practice-history')}>View analytics →</button></article><article className="dashboard-stat"><span className="stat-icon stat-icon-amber">✓</span><span>Next step</span><strong>Practice</strong><small>Turn your plan into test-ready skills</small></article></section>

    <section className="create-layout"><div className="create-intro"><span className="eyebrow">START PREPARING</span><h2>Create your personalized plan</h2><p>Tell us about the role you're targeting and share your current experience. We'll build a preparation plan and likely interview questions for you.</p><div className="create-benefit"><span>01</span><div><strong>Understand the role</strong><p>AI identifies the skills and expectations in the job description.</p></div></div><div className="create-benefit"><span>02</span><div><strong>Find your focus</strong><p>See profile gaps and a structured preparation roadmap.</p></div></div><div className="create-benefit"><span>03</span><div><strong>Practice and improve</strong><p>Attempt MCQs, review feedback, and track your progress.</p></div></div></div>
      <form className="create-form" onSubmit={handleGenerate}><div className="form-card-heading"><div><span className="eyebrow">NEW INTERVIEW PLAN</span><h3>Let's get started</h3></div><span className="step-badge">Step 1 of 1</span></div>
        <label className="field-label" htmlFor="job-description">Target job description <span>Required</span></label><textarea id="job-description" rows="5" value={jobDescription} onChange={e => setJobDescription(e.target.value)} placeholder="Paste the job description, responsibilities, and required skills…" required/>
        <div className="field-label resume-label">Your resume <span>PDF · max 5 MB</span></div><input ref={fileInput} type="file" accept="application/pdf,.pdf" className="visually-hidden" onChange={e => chooseFile(e.target.files?.[0])}/><button type="button" className={`upload-dropzone ${selectedFile ? 'has-file' : ''}`} onClick={() => fileInput.current?.click()}><span className="upload-icon">{selectedFile ? '✓' : '↑'}</span><span><strong>{selectedFile ? selectedFile.name : 'Upload your resume'}</strong><small>{selectedFile ? `${(selectedFile.size / 1024 / 1024).toFixed(2)} MB · Click to replace` : 'Click to browse PDF files'}</small></span><span className="upload-action">{selectedFile ? 'Change' : 'Browse'}</span></button><div className="form-divider"><span>OR</span></div><label className="field-label" htmlFor="self-description">Describe your current skills <span>Optional if resume uploaded</span></label><textarea id="self-description" rows="3" value={selfDescription} onChange={e => setSelfDescription(e.target.value)} placeholder="Your skills, projects, experience, or topics you're comfortable with…"/>
        {error && <div className="inline-alert" role="alert">{error}</div>}<button className="button button-primary button-large create-submit" type="submit" disabled={loading}>{loading ? 'Building your plan…' : 'Generate interview plan'} <span aria-hidden="true">→</span></button><p className="form-footnote">Your plan is saved privately to your account.</p>
      </form></section>

    <section className="recent-plans"><div className="section-title"><div><span className="eyebrow">PICK UP WHERE YOU LEFT OFF</span><h2>Your recent interview plans</h2></div><button className="text-action" onClick={() => navigate('/practice-history')}>View performance →</button></div>{!reports?.length ? <div className="empty-plans"><span>✦</span><h3>Your preparation journey starts here</h3><p>Create your first plan to see your target role, preparation roadmap, and practice tests here.</p></div> : <div className="recent-plan-grid">{reports.slice(0, 3).map(report => <article className="recent-plan-card" key={report._id}><span className="recent-plan-icon">↗</span><span className="recent-plan-date">{report.createdAt ? new Date(report.createdAt).toLocaleDateString() : 'Interview plan'}</span><h3>{report.title || 'Interview preparation'}</h3><p>Profile match <strong>{Math.round(report.matchScore || 0)}%</strong></p><button className="text-action" onClick={() => navigate(`/interview/${report._id}`)}>Open plan →</button></article>)}</div>}</section>
    <footer className="dashboard-footer"><span>Prepwise<span className="brand-dot">.</span></span><span>Prepare with purpose.</span></footer>
  </main>
}

export default Home

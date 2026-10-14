import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import '../auth.form.scss'
import { useAuth } from '../hooks/useAuth'

const Login = () => {
  const { loading, handleLogin, error } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const handleSubmit = async event => {
    event.preventDefault()
    const data = await handleLogin({ email: email.trim(), password })
    if (data) navigate('/')
  }

  return <main className="auth-page"><div className="auth-decoration"><div className="auth-glow glow-one"/><div className="auth-glow glow-two"/><div className="auth-promo"><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg></span><p className="auth-promo-kicker">YOUR NEXT CHAPTER STARTS HERE</p><h2>Confidence is built<br/>one practice at a time.</h2><p>Turn your experience into a plan, practice smarter, and walk into your next interview ready.</p><div className="auth-promo-points"><span>✦ Personalized preparation</span><span>↗ Progress you can measure</span><span>✓ Feedback that helps you grow</span></div></div></div><section className="auth-main"><Link to="/" className="auth-brand">Prepwise<span>.</span></Link><div className="form-container"><span className="eyebrow">WELCOME BACK</span><h1>Sign in to your workspace</h1><p className="auth-subtitle">Pick up where you left off and keep moving forward.</p>{error && <div className="error-message" role="alert">{error}</div>}<form onSubmit={handleSubmit}><div className="input-group"><label htmlFor="email">Email address</label><input value={email} onChange={event => setEmail(event.target.value)} type="email" id="email" name="email" placeholder="you@example.com" autoComplete="email" required/></div><div className="input-group"><label htmlFor="password">Password</label><input value={password} onChange={event => setPassword(event.target.value)} type="password" id="password" name="password" placeholder="Enter your password" autoComplete="current-password" required/></div><button type="submit" className="button button-primary button-large" disabled={loading}>{loading ? 'Signing you in…' : 'Sign in'} <span>→</span></button></form><p className="auth-switch">New to Prepwise? <Link to="/register">Create an account</Link></p><p className="auth-privacy">Your preparation data is private to your account.</p></div><div className="auth-bottom-note">A little progress, every day.</div></section></main>
}
export default Login

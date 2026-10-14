import { useState } from 'react'
import { Link, useNavigate } from 'react-router'
import '../auth.form.scss'
import { useAuth } from '../hooks/useAuth'

const Register = () => {
  const navigate = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  const { loading, handleRegister, error } = useAuth()

  const handleSubmit = async event => {
    event.preventDefault()
    setSuccessMessage('')
    const data = await handleRegister({ username: username.trim(), email: email.trim(), password })
    if (data) {
      setSuccessMessage('Your account is ready. Opening your workspace…')
      window.setTimeout(() => navigate('/'), 1200)
    }
  }

  return <main className="auth-page"><div className="auth-decoration"><div className="auth-glow glow-one"/><div className="auth-glow glow-two"/><div className="auth-promo"><span className="brand-mark"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="m12 3 1.9 5.8L20 11l-6.1 2.2L12 19l-1.9-5.8L4 11l6.1-2.2L12 3Z"/></svg></span><p className="auth-promo-kicker">YOUR NEXT CHAPTER STARTS HERE</p><h2>Make preparation<br/>your superpower.</h2><p>Build a plan that fits your goals and get better with every attempt.</p><div className="auth-promo-points"><span>✦ Role-specific interview plans</span><span>↗ MCQ practice and analytics</span><span>✓ Actionable AI feedback</span></div></div></div><section className="auth-main"><Link to="/" className="auth-brand">Prepwise<span>.</span></Link><div className="form-container"><span className="eyebrow">GET STARTED</span><h1>Create your account</h1><p className="auth-subtitle">Your personalized interview preparation starts here.</p>{error && <div className="error-message" role="alert">{error}</div>}{successMessage && <div className="success-message" role="status">{successMessage}</div>}<form onSubmit={handleSubmit}><div className="input-group"><label htmlFor="username">Your name</label><input value={username} onChange={event => setUsername(event.target.value)} type="text" id="username" name="username" placeholder="How should we call you?" autoComplete="username" minLength="2" required/></div><div className="input-group"><label htmlFor="email">Email address</label><input value={email} onChange={event => setEmail(event.target.value)} type="email" id="email" name="email" placeholder="you@example.com" autoComplete="email" required/></div><div className="input-group"><label htmlFor="password">Password</label><input value={password} onChange={event => setPassword(event.target.value)} type="password" id="password" name="password" placeholder="At least 8 characters" autoComplete="new-password" minLength="8" required/></div><button type="submit" className="button button-primary button-large" disabled={loading}>{loading ? 'Creating your account…' : 'Create account'} <span>→</span></button></form><p className="auth-switch">Already have an account? <Link to="/login">Sign in</Link></p><p className="auth-privacy">By continuing, you agree to use Prepwise responsibly.</p></div><div className="auth-bottom-note">Small steps. Strong interviews.</div></section></main>
}
export default Register

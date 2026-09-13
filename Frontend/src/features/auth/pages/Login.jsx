import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Login = () => {

    const { loading, handleLogin, error } = useAuth()
    const navigate = useNavigate()

    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")

    const handleSubmit = async (e) => {
        e.preventDefault()

        if(!email || !password) {
            return
        }

        const data = await handleLogin({
            email,
            password
        })

        if (data) {
            navigate("/")
        }
    }

    if (loading) {
        return (
            <main className='loading-screen'>
                <div className='spinner' />
                <h1>Logging you in...</h1>
            </main>
        )
    }

    return (
        <main>
            <div className="form-container">

                <h1>Login</h1>

                {/* ERROR MESSAGE */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="input-group">
                        <label htmlFor="email">Email</label>

                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email address"
                        />
                    </div>

                    <div className="input-group">
                        <label htmlFor="password">Password</label>

                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            type="password"
                            id="password"
                            name="password"
                            placeholder="Enter password"
                        />
                    </div>

                    <button
                        type="submit"
                        className="button primary-button"
                    >
                        Login
                    </button>

                </form>

                <p>
                    Don't have an account?{" "}
                    <Link to="/register">Register</Link>
                </p>

            </div>
        </main>
    )
}

export default Login
import React, { useState } from 'react'
import { useNavigate, Link } from 'react-router'
import "../auth.form.scss"
import { useAuth } from '../hooks/useAuth'

const Register = () => {

    const navigate = useNavigate()

    const [username, setUsername] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [successMessage, setSuccessMessage] = useState("")

    const { loading, handleRegister, error } = useAuth()

    const handleSubmit = async (e) => {
        e.preventDefault()

        // Clear previous success message
        setSuccessMessage("")

        // Basic frontend validation
        if (!username || !email || !password) {
            return
        }

        const data = await handleRegister({
            username,
            email,
            password
        })

        // Registration was successful
        if (data) {

            setSuccessMessage("User registered successfully!")

            // Redirect to login after 2 seconds
            setTimeout(() => {
                navigate("/login")
            }, 2000)
        }
    }

    if (loading) {
        return (
            <main>
                <h1>Loading.......</h1>
            </main>
        )
    }

    return (
        <main>

            <div className="form-container">

                <h1>Register</h1>

                {/* Error message */}
                {error && (
                    <div className="error-message">
                        {error}
                    </div>
                )}

                {/* Success message */}
                {successMessage && (
                    <div className="success-message">
                        {successMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>

                    <div className="input-group">

                        <label htmlFor="username">
                            Username
                        </label>

                        <input
                            onChange={(e) => setUsername(e.target.value)}
                            value={username}
                            type="text"
                            id="username"
                            name="username"
                            placeholder="Enter username"
                        />

                    </div>


                    <div className="input-group">

                        <label htmlFor="email">
                            Email
                        </label>

                        <input
                            onChange={(e) => setEmail(e.target.value)}
                            value={email}
                            type="email"
                            id="email"
                            name="email"
                            placeholder="Enter email address"
                        />

                    </div>


                    <div className="input-group">

                        <label htmlFor="password">
                            Password
                        </label>

                        <input
                            onChange={(e) => setPassword(e.target.value)}
                            value={password}
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
                        Register
                    </button>

                </form>


                <p>
                    Already have an account?{" "}
                    <Link to="/login">
                        Login
                    </Link>
                </p>

            </div>

        </main>
    )
}

export default Register
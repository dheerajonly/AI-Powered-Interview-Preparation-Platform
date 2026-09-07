import { useContext, useEffect } from "react";
import { AuthContext } from "../auth.context";
import { login, register, logout, getMe } from "../services/auth.api";

export const useAuth = () => {

    const context = useContext(AuthContext)

    if (!context) {
        throw new Error("useAuth must be used within AuthProvider")
    }

    const {
        user,
        setUser,
        loading,
        setLoading,
        error,
        setError
    } = context


    const handleLogin = async ({ email, password }) => {
        setLoading(true)
        setError("")

        try {

            const data = await login({ email, password })
            setUser(data.user)

            return data

        } catch (err) {

            const message =
                err.response?.data?.message ||
                "Login failed, invalid email or password !"

            setError(message)

            console.log("Login Error:", message)

            return null

        } finally {
            setLoading(false)
        }
    }


    const handleRegister = async ({ username, email, password }) => {
        setLoading(true)
        setError("")

        try {

            const data = await register({
                username,
                email,
                password
            })

            setUser(data.user)

            return data

        } catch (err) {

            const message =
                err.response?.data?.message ||
                "Registration failed. Please try again."

            setError(message)

            console.log("Registration Error:", message)

            return null

        } finally {
            setLoading(false)
        }
    }


    const handleLogout = async () => {
        setLoading(true)
        setError("")

        try {

            await logout()
            setUser(null)

        } catch (err) {

            const message =
                err.response?.data?.message ||
                "Logout failed. Please try again."

            setError(message)

            console.log("Logout Error:", message)

        } finally {
            setLoading(false)
        }
    }


    useEffect(() => {

    const getAndSetUser = async () => {

        try {

            const data = await getMe()
            setUser(data.user)

        } catch (err) {

            // User is simply not logged in.
            // Don't show an error message.
            setUser(null)

        } finally {
            setLoading(false)
        }
    }

    getAndSetUser()

}, [])

    return {
        user,
        loading,
        error,
        handleRegister,
        handleLogin,
        handleLogout
    }
}
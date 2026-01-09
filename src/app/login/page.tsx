'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const [isSignUp, setIsSignUp] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [otp, setOtp] = useState('')
  const [showOtpInput, setShowOtpInput] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()
  const { signIn } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      if (isSignUp) {
        if (showOtpInput) {
          // Finalize Registration with OTP and Password
          await finalizeRegistration()
        } else {
          // Request OTP
          await requestOtp()
        }
      } else {
        // Login Flow
        const { error } = await signIn(email, password)
        if (error) throw error
        router.push('/dashboard')
      }
    } catch (err: any) {
      setError(err.message)
    } finally {
      if (!isSignUp || !showOtpInput) setLoading(false)
    }
  }

  const requestOtp = async () => {
    if (!email || !fullName || !password) {
      throw new Error("Please fill in all fields.")
    }

    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
                mutation RequestOtp($email: String!, $fullName: String!) {
                    requestOtp(email: $email, fullName: $fullName)
                }
            `,
        variables: { email, fullName }
      })
    })

    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0].message)

    setShowOtpInput(true)
    setLoading(false) // Allow user to type OTP
  }

  const finalizeRegistration = async () => {
    const res = await fetch('/api/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query: `
                mutation RegisterWithOtp($email: String!, $otp: String!, $password: String!, $fullName: String!) {
                    registerWithOtp(email: $email, otp: $otp, password: $password, fullName: $fullName) {
                        id
                    }
                }
            `,
        variables: { email, otp, password, fullName }
      })
    })

    const json = await res.json()
    if (json.errors) throw new Error(json.errors[0].message)

    // Registration successful, now auto-login
    const { error: loginError } = await signIn(email, password)
    if (loginError) throw loginError

    router.push('/dashboard')
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-zinc-800 bg-zinc-900/50 p-8 backdrop-blur-xl">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-yellow-500" />
          <h2 className="text-3xl font-bold tracking-tight text-white">Zentrivest</h2>
          <p className="mt-2 text-sm text-zinc-400">
            {isSignUp ? (showOtpInput ? 'Verify your email' : 'Create your account') : 'Sign in to your portfolio'}
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-md shadow-sm">
            {isSignUp && !showOtpInput && (
              <div>
                <label htmlFor="fullName" className="sr-only">Full Name</label>
                <input
                  id="fullName"
                  name="fullName"
                  type="text"
                  required
                  className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                  placeholder="Full Name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            {!showOtpInput && (
              <>
                <div>
                  <label htmlFor="email-address" className="sr-only">Email address</label>
                  <input
                    id="email-address"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    placeholder="Email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="password" className="sr-only">Password</label>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    required
                    className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-white placeholder-zinc-400 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500 sm:text-sm"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </>
            )}

            {showOtpInput && (
              <div>
                <label htmlFor="otp" className="sr-only">Verification Code</label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  required
                  className="relative block w-full rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-2 text-center text-2xl font-bold tracking-widest text-yellow-500 placeholder-zinc-600 focus:border-yellow-500 focus:outline-none focus:ring-1 focus:ring-yellow-500"
                  placeholder="000000"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
                <div className="flex flex-col items-center mt-2 space-y-2">
                  <p className="text-xs text-zinc-500">
                    We sent a code to {email}
                  </p>
                  <button
                    type="button"
                    onClick={requestOtp}
                    className="text-xs text-yellow-500 hover:text-yellow-400 underline"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>

          {error && (
            <div className="text-center text-sm text-red-500">
              {error}
            </div>
          )}

          <div>
            <button
              type="submit"
              disabled={loading}
              className="group relative flex w-full justify-center rounded-lg bg-yellow-500 px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-yellow-400 focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-offset-2 focus:ring-offset-zinc-900 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Processing...' : (
                isSignUp
                  ? (showOtpInput ? 'Verify & Create Account' : 'Send Verification Code')
                  : 'Sign in'
              )}
            </button>
          </div>
        </form>

        <div className="text-center">
          {!showOtpInput && (
            <button
              onClick={() => {
                setIsSignUp(!isSignUp)
                setError(null)
                setFullName('')
                setEmail('')
                setPassword('')
              }}
              className="text-sm font-medium text-yellow-500 hover:text-yellow-400"
            >
              {isSignUp ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
            </button>
          )}
          {showOtpInput && (
            <button
              onClick={() => setShowOtpInput(false)}
              className="text-sm font-medium text-zinc-500 hover:text-zinc-400"
            >
              Back to details
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

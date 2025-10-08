'use client'

import { useState } from 'react'
import { signIn, getSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function SignInPage() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        username,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError('Invalid username or password')
      } else {
        // Refresh session and redirect
        await getSession()
        router.push('/game')
      }
    } catch (error) {
      setError('An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen aaa-background relative overflow-hidden flex items-center justify-center">
      <div className="max-w-md w-full mx-4 relative z-10">
        <div className="aaa-card rounded-3xl p-10 shadow-2xl relative overflow-hidden">
          {/* Animated background pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-900/10 via-transparent to-amber-700/10 pointer-events-none"></div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl from-amber-500/10 to-transparent rounded-full blur-xl"></div>

          <div className="text-center mb-8 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 via-yellow-500 to-orange-500 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <span className="text-white font-bold text-3xl norse-symbol">ᚠ</span>
            </div>
            <h1 className="aaa-title text-4xl font-bold mb-4">🏰 WELCOME BACK, WARRIOR</h1>
            <p className="text-amber-200">Enter the halls of Hnefatafl once more</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 relative z-10">
            {error && (
              <div className="aaa-card bg-red-900/20 border border-red-400/50 rounded-xl p-4 text-red-200 text-sm">
                ⚠️ {error}
              </div>
            )}

            <div>
              <label htmlFor="username" className="block text-sm font-bold text-amber-200 mb-3">
                ⚔️ WARRIOR NAME
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className="aaa-input w-full py-4 text-lg"
                placeholder="Enter your warrior name"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-amber-200 mb-3">
                🗝️ SECRET RUNE
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className="aaa-input w-full py-4 text-lg"
                placeholder="Enter your secret rune"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="aaa-button w-full py-4 text-xl font-bold disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <div className="flex items-center justify-center space-x-3">
                  <div className="aaa-loading"></div>
                  <span>ENTERING HALLS...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">🏰</span>
                  <span>ENTER THE HALLS</span>
                  <span className="text-2xl">🏰</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-amber-200">
              New to the realm?{' '}
              <Link
                href="/auth/register"
                className="aaa-button-secondary text-sm px-4 py-2 inline-block"
              >
                JOIN THE WARRIORS
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center relative z-10">
            <Link href="/" className="aaa-button-secondary text-sm px-6 py-3 inline-block">
              <span className="flex items-center space-x-2">
                <span>🏠</span>
                <span>RETURN TO MAIN HALL</span>
              </span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

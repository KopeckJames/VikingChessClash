'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    username: '',
    displayName: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)

    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: formData.username,
          displayName: formData.displayName,
          password: formData.password,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Registration failed')
        return
      }

      // Registration successful, redirect to sign in
      router.push('/auth/signin?message=Registration successful! Please sign in.')
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
            <h1 className="aaa-title text-4xl font-bold mb-4">⚔️ JOIN THE WARRIORS</h1>
            <p className="text-amber-200">Forge your legend in the halls of Hnefatafl</p>
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
                name="username"
                type="text"
                value={formData.username}
                onChange={handleChange}
                required
                className="aaa-input w-full py-4 text-lg"
                placeholder="Choose your unique warrior name"
              />
            </div>

            <div>
              <label htmlFor="displayName" className="block text-sm font-bold text-amber-200 mb-3">
                👑 DISPLAY NAME
              </label>
              <input
                id="displayName"
                name="displayName"
                type="text"
                value={formData.displayName}
                onChange={handleChange}
                required
                className="aaa-input w-full py-4 text-lg"
                placeholder="Your legendary display name"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-bold text-amber-200 mb-3">
                🗝️ SECRET RUNE
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleChange}
                required
                className="aaa-input w-full py-4 text-lg"
                placeholder="At least 6 mystical characters"
              />
            </div>

            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-sm font-bold text-amber-200 mb-3"
              >
                🔒 CONFIRM RUNE
              </label>
              <input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
                className="aaa-input w-full py-4 text-lg"
                placeholder="Confirm your secret rune"
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
                  <span>FORGING LEGEND...</span>
                </div>
              ) : (
                <span className="flex items-center justify-center space-x-3">
                  <span className="text-2xl">⚔️</span>
                  <span>FORGE YOUR LEGEND</span>
                  <span className="text-2xl">⚔️</span>
                </span>
              )}
            </button>
          </form>

          <div className="mt-8 text-center relative z-10">
            <p className="text-amber-200">
              Already a warrior?{' '}
              <Link
                href="/auth/signin"
                className="aaa-button-secondary text-sm px-4 py-2 inline-block"
              >
                ENTER THE HALLS
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

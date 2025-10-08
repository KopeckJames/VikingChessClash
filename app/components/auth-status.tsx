'use client'

import { useSession, signIn, signOut } from 'next-auth/react'
import Link from 'next/link'

export function AuthStatus() {
  const { data: session, status } = useSession()

  if (status === 'loading') {
    return (
      <div className="flex items-center space-x-2">
        <div className="w-4 h-4 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin"></div>
        <span className="text-sm text-gray-600">Loading...</span>
      </div>
    )
  }

  if (session?.user) {
    return (
      <div className="flex items-center space-x-4">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-amber-500 to-amber-600 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-sm">
              {session.user.displayName?.[0]?.toUpperCase() ||
                session.user.username?.[0]?.toUpperCase() ||
                'U'}
            </span>
          </div>
          <div className="text-sm">
            <div className="font-semibold text-gray-800">
              {session.user.displayName || session.user.username}
            </div>
            <div className="text-gray-600">Rating: {session.user.rating || 1200}</div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Link href="/profile" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Profile
          </Link>
          <button
            onClick={() => signOut()}
            className="text-sm text-gray-600 hover:text-gray-800 font-medium"
          >
            Sign Out
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="flex items-center space-x-2">
      <button onClick={() => signIn()} className="modern-button-primary text-sm px-4 py-2">
        Sign In
      </button>
      <Link href="/auth/register" className="modern-button-secondary text-sm px-4 py-2">
        Register
      </Link>
    </div>
  )
}

import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      username: string
      displayName: string
      rating: number
      image?: string
    }
  }

  interface User {
    id: string
    email: string
    username: string
    displayName: string
    rating: number
    avatar?: string
    emailVerified?: Date
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username: string
    displayName: string
    rating: number
  }
}

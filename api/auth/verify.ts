import { NextApiRequest, NextApiResponse } from 'next'
import { prisma } from '../../lib/prisma'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { token } = req.body

    if (!token) {
      return res.status(400).json({
        message: 'Verification token is required',
      })
    }

    // Find the verification token
    const verificationToken = await prisma.verificationToken.findUnique({
      where: { token },
      include: { user: true },
    })

    if (!verificationToken) {
      return res.status(400).json({
        message: 'Invalid verification token',
      })
    }

    if (verificationToken.expiresAt < new Date()) {
      // Delete expired token
      await prisma.verificationToken.delete({
        where: { id: verificationToken.id },
      })

      return res.status(400).json({
        message: 'Verification token has expired',
      })
    }

    // Update user as verified
    await prisma.user.update({
      where: { id: verificationToken.userId },
      data: {
        emailVerified: new Date(),
        updatedAt: new Date(),
      },
    })

    // Delete used token
    await prisma.verificationToken.delete({
      where: { id: verificationToken.id },
    })

    return res.status(200).json({
      message: 'Email verified successfully',
      user: {
        id: verificationToken.user.id,
        email: verificationToken.user.email,
        displayName: verificationToken.user.displayName,
        emailVerified: true,
      },
    })
  } catch (error) {
    console.error('Email verification error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}

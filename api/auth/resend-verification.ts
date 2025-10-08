import { NextApiRequest, NextApiResponse } from 'next'
import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { sendEmail } from '../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email } = req.body

    if (!email) {
      return res.status(400).json({
        message: 'Email is required',
      })
    }

    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      // Don't reveal if email exists for security
      return res.status(200).json({
        message: 'If an account with that email exists, a verification link has been sent',
      })
    }

    if (user.emailVerified) {
      return res.status(400).json({
        message: 'Email is already verified',
      })
    }

    // Generate verification token
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // Delete any existing tokens for this user
    await prisma.verificationToken.deleteMany({
      where: { userId: user.id },
    })

    // Create new verification token
    await prisma.verificationToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    })

    // Send verification email
    const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(user.email)}`

    await sendEmail({
      to: user.email,
      subject: 'Verify Your Viking Chess Account',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1e293b;">Welcome to Viking Chess!</h2>
          <p>Hello ${user.displayName},</p>
          <p>Thank you for joining Viking Chess! Please verify your email address to complete your account setup:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${verificationUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Verify Email Address
            </a>
          </div>
          <p>This link will expire in 24 hours for security reasons.</p>
          <p>If you didn't create this account, you can safely ignore this email.</p>
          <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
          <p style="color: #64748b; font-size: 14px;">
            Viking Chess - The Ancient Game of Strategy
          </p>
        </div>
      `,
    })

    return res.status(200).json({
      message: 'If an account with that email exists, a verification link has been sent',
    })
  } catch (error) {
    console.error('Resend verification error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}

import { NextApiRequest, NextApiResponse } from 'next'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import { prisma } from '../../lib/prisma'
import { sendEmail } from '../../lib/email'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  try {
    const { email, token, newPassword } = req.body

    if (token && newPassword) {
      // Reset password with token
      const resetToken = await prisma.passwordResetToken.findUnique({
        where: { token },
        include: { user: true },
      })

      if (!resetToken || resetToken.expiresAt < new Date()) {
        return res.status(400).json({
          message: 'Invalid or expired reset token',
        })
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 12)

      // Update user password
      await prisma.user.update({
        where: { id: resetToken.userId },
        data: { password: hashedPassword },
      })

      // Delete used token
      await prisma.passwordResetToken.delete({
        where: { id: resetToken.id },
      })

      return res.status(200).json({
        message: 'Password reset successfully',
      })
    } else if (email) {
      // Send reset email
      const user = await prisma.user.findUnique({
        where: { email },
      })

      if (!user) {
        // Don't reveal if email exists for security
        return res.status(200).json({
          message: 'If an account with that email exists, a reset link has been sent',
        })
      }

      // Generate reset token
      const token = crypto.randomBytes(32).toString('hex')
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

      // Delete any existing tokens for this user
      await prisma.passwordResetToken.deleteMany({
        where: { userId: user.id },
      })

      // Create new reset token
      await prisma.passwordResetToken.create({
        data: {
          token,
          userId: user.id,
          expiresAt,
        },
      })

      // Send reset email
      const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

      await sendEmail({
        to: user.email,
        subject: 'Reset Your Viking Chess Password',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1e293b;">Reset Your Password</h2>
            <p>Hello ${user.displayName},</p>
            <p>You requested to reset your password for your Viking Chess account. Click the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Reset Password
              </a>
            </div>
            <p>This link will expire in 1 hour for security reasons.</p>
            <p>If you didn't request this password reset, you can safely ignore this email.</p>
            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
            <p style="color: #64748b; font-size: 14px;">
              Viking Chess - The Ancient Game of Strategy
            </p>
          </div>
        `,
      })

      return res.status(200).json({
        message: 'If an account with that email exists, a reset link has been sent',
      })
    } else {
      return res.status(400).json({
        message: 'Email or token and new password required',
      })
    }
  } catch (error) {
    console.error('Password reset error:', error)
    return res.status(500).json({
      message: 'Internal server error',
    })
  }
}

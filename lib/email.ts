import crypto from 'crypto'
import { prisma } from './prisma'

interface EmailOptions {
  to: string
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: EmailOptions) {
  // In a real application, you would use a service like SendGrid, Resend, or similar
  // For now, we'll just log the email content
  console.log(`Email to ${to}:`)
  console.log(`Subject: ${subject}`)
  console.log(`HTML: ${html}`)

  // TODO: Implement actual email sending
  // Example with Resend:
  /*
  const resend = new Resend(process.env.RESEND_API_KEY);
  
  await resend.emails.send({
    from: 'Viking Chess <noreply@vikingchess.com>',
    to,
    subject,
    html
  });
  */

  return { success: true }
}

export async function sendVerificationEmail(email: string, userId: string) {
  // Generate verification token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

  // Delete any existing tokens for this user
  await prisma.verificationToken.deleteMany({
    where: { userId },
  })

  // Create new verification token
  await prisma.verificationToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  })

  const verificationUrl = `${process.env.NEXTAUTH_URL}/auth/verify-email?token=${token}&email=${encodeURIComponent(email)}`

  await sendEmail({
    to: email,
    subject: 'Welcome to Viking Chess - Verify Your Account',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Welcome to Viking Chess!</h2>
        <p>Hello ${user?.displayName || 'Warrior'},</p>
        <p>Thank you for joining Viking Chess! Please verify your email address to complete your account setup and start playing:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p>This link will expire in 24 hours for security reasons.</p>
        <p>Once verified, you'll be able to:</p>
        <ul>
          <li>Play against other warriors online</li>
          <li>Challenge AI opponents</li>
          <li>Join tournaments and competitions</li>
          <li>Track your progress and achievements</li>
        </ul>
        <p>If you didn't create this account, you can safely ignore this email.</p>
        <hr style="margin: 30px 0; border: none; border-top: 1px solid #e2e8f0;">
        <p style="color: #64748b; font-size: 14px;">
          Viking Chess - The Ancient Game of Strategy
        </p>
      </div>
    `,
  })

  return { success: true, verificationUrl }
}

export async function sendPasswordResetEmail(email: string, userId: string) {
  // Generate reset token
  const token = crypto.randomBytes(32).toString('hex')
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour

  // Delete any existing tokens for this user
  await prisma.passwordResetToken.deleteMany({
    where: { userId },
  })

  // Create new reset token
  await prisma.passwordResetToken.create({
    data: {
      token,
      userId,
      expiresAt,
    },
  })

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { displayName: true },
  })

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`

  await sendEmail({
    to: email,
    subject: 'Reset Your Viking Chess Password',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #1e293b;">Reset Your Password</h2>
        <p>Hello ${user?.displayName || 'Warrior'},</p>
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

  return { success: true, resetUrl }
}

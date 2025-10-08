import type { NextApiRequest, NextApiResponse } from 'next'
import { PrismaClient } from '@prisma/client'
import webpush from 'web-push'

const prisma = new PrismaClient()

// Configure web-push with VAPID keys
webpush.setVapidDetails(
  'mailto:admin@viking-chess.com',
  process.env.VAPID_PUBLIC_KEY ||
    'BEl62iUYgUivxIkv69yViEuiBIa40HI80NqIUHI-lzKkMpgF6j62dO-hiqll1XFHQJd3P3YkPGmSh4sQVgxUEcE',
  process.env.VAPID_PRIVATE_KEY || 'your-vapid-private-key'
)

export interface NotificationPayload {
  title: string
  body: string
  icon?: string
  badge?: string
  image?: string
  tag?: string
  data?: any
  actions?: Array<{
    action: string
    title: string
    icon?: string
  }>
  requireInteraction?: boolean
  silent?: boolean
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    const { userIds, payload } = req.body as {
      userIds: string[]
      payload: NotificationPayload
    }

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({ error: 'Invalid user IDs' })
    }

    if (!payload || !payload.title || !payload.body) {
      return res.status(400).json({ error: 'Invalid notification payload' })
    }

    // Get push subscriptions for the specified users
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
      include: {
        user: {
          select: {
            id: true,
            username: true,
          },
        },
      },
    })

    if (subscriptions.length === 0) {
      return res.status(404).json({ error: 'No push subscriptions found' })
    }

    // Send notifications to all subscriptions
    const results = await Promise.allSettled(
      subscriptions.map(async subscription => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'normal',
          })

          return { success: true, userId: subscription.userId }
        } catch (error) {
          console.error(`Failed to send notification to user ${subscription.userId}:`, error)

          // If subscription is invalid, remove it from database
          if (
            error instanceof Error &&
            (error.message.includes('410') ||
              error.message.includes('invalid') ||
              error.message.includes('expired'))
          ) {
            await prisma.pushSubscription.delete({
              where: { id: subscription.id },
            })
          }

          return { success: false, userId: subscription.userId, error: error.message }
        }
      })
    )

    const successful = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length

    const failed = results.length - successful

    res.status(200).json({
      success: true,
      sent: successful,
      failed: failed,
      total: results.length,
    })
  } catch (error) {
    console.error('Send notification error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

// Helper function to send notifications (can be used by other API routes)
export async function sendNotificationToUsers(
  userIds: string[],
  payload: NotificationPayload
): Promise<{ sent: number; failed: number; total: number }> {
  try {
    const subscriptions = await prisma.pushSubscription.findMany({
      where: {
        userId: {
          in: userIds,
        },
      },
    })

    const results = await Promise.allSettled(
      subscriptions.map(async subscription => {
        const pushSubscription = {
          endpoint: subscription.endpoint,
          keys: {
            p256dh: subscription.p256dh,
            auth: subscription.auth,
          },
        }

        try {
          await webpush.sendNotification(pushSubscription, JSON.stringify(payload), {
            TTL: 60 * 60 * 24, // 24 hours
            urgency: 'normal',
          })

          return { success: true }
        } catch (error) {
          console.error(`Failed to send notification:`, error)

          // Clean up invalid subscriptions
          if (
            error instanceof Error &&
            (error.message.includes('410') ||
              error.message.includes('invalid') ||
              error.message.includes('expired'))
          ) {
            await prisma.pushSubscription
              .delete({
                where: { id: subscription.id },
              })
              .catch(console.error)
          }

          return { success: false }
        }
      })
    )

    const successful = results.filter(
      result => result.status === 'fulfilled' && result.value.success
    ).length

    return {
      sent: successful,
      failed: results.length - successful,
      total: results.length,
    }
  } catch (error) {
    console.error('Send notification helper error:', error)
    return { sent: 0, failed: 0, total: 0 }
  }
}

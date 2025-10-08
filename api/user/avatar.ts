import { NextApiRequest, NextApiResponse } from 'next'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '../../lib/auth'
import { prisma } from '../../lib/prisma'
import formidable from 'formidable'
import fs from 'fs'
import path from 'path'

export const config = {
  api: {
    bodyParser: false,
  },
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const session = await getServerSession(req, res, authOptions)

  if (!session?.user?.id) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const form = formidable({
      maxFileSize: 5 * 1024 * 1024, // 5MB
      filter: ({ mimetype }) => {
        return mimetype && mimetype.includes('image')
      },
    })

    const [fields, files] = await form.parse(req)
    const avatarFile = Array.isArray(files.avatar) ? files.avatar[0] : files.avatar

    if (!avatarFile) {
      return res.status(400).json({ error: 'No avatar file provided' })
    }

    // In a real application, you would upload to a cloud storage service like AWS S3, Cloudinary, etc.
    // For now, we'll simulate the upload and return a placeholder URL

    // Create uploads directory if it doesn't exist
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads', 'avatars')
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true })
    }

    // Generate unique filename
    const fileExtension = path.extname(avatarFile.originalFilename || '')
    const fileName = `${session.user.id}-${Date.now()}${fileExtension}`
    const filePath = path.join(uploadsDir, fileName)

    // Copy file to uploads directory
    fs.copyFileSync(avatarFile.filepath, filePath)

    // Update user avatar in database
    const avatarUrl = `/uploads/avatars/${fileName}`

    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        avatar: avatarUrl,
        updatedAt: new Date(),
      },
    })

    // Clean up temporary file
    fs.unlinkSync(avatarFile.filepath)

    return res.status(200).json({
      message: 'Avatar uploaded successfully',
      avatarUrl,
    })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return res.status(500).json({ error: 'Failed to upload avatar' })
  }
}

import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TouchButton } from '@/components/ui/touch-button'
import { CheckCircle, AlertCircle, Mail, RefreshCw, ArrowLeft } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

interface VerificationState {
  status: 'verifying' | 'success' | 'error' | 'expired'
  message: string
}

export default function VerifyEmail() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [verificationState, setVerificationState] = useState<VerificationState>({
    status: 'verifying',
    message: 'Verifying your email...',
  })

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')
  const email = urlParams.get('email')

  const verifyEmailMutation = useMutation({
    mutationFn: async (token: string) => {
      const response = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Verification failed')
      }

      return response.json()
    },
    onSuccess: () => {
      setVerificationState({
        status: 'success',
        message: 'Your email has been verified successfully!',
      })
      toast({
        title: 'Email verified',
        description: 'You can now login to your account',
      })
    },
    onError: (error: any) => {
      const isExpired = error.message.includes('expired') || error.message.includes('invalid')
      setVerificationState({
        status: isExpired ? 'expired' : 'error',
        message: error.message || 'Verification failed',
      })
    },
  })

  const resendVerificationMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to resend verification')
      }

      return response.json()
    },
    onSuccess: () => {
      toast({
        title: 'Verification email sent',
        description: 'Check your email for a new verification link',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Failed to resend',
        description: error.message || 'Failed to resend verification email',
        variant: 'destructive',
      })
    },
  })

  useEffect(() => {
    if (token) {
      verifyEmailMutation.mutate(token)
    } else {
      setVerificationState({
        status: 'error',
        message: 'Invalid verification link',
      })
    }
  }, [token])

  const handleResendVerification = () => {
    if (email) {
      resendVerificationMutation.mutate(email)
    } else {
      toast({
        title: 'Cannot resend',
        description: 'Email address not found in the link',
        variant: 'destructive',
      })
    }
  }

  const getIcon = () => {
    switch (verificationState.status) {
      case 'verifying':
        return <RefreshCw className="w-16 h-16 text-blue-500 animate-spin" />
      case 'success':
        return <CheckCircle className="w-16 h-16 text-green-500" />
      case 'error':
      case 'expired':
        return <AlertCircle className="w-16 h-16 text-red-500" />
      default:
        return <Mail className="w-16 h-16 text-slate-400" />
    }
  }

  const getTitle = () => {
    switch (verificationState.status) {
      case 'verifying':
        return 'Verifying Email...'
      case 'success':
        return 'Email Verified!'
      case 'expired':
        return 'Link Expired'
      case 'error':
        return 'Verification Failed'
      default:
        return 'Email Verification'
    }
  }

  const getActions = () => {
    switch (verificationState.status) {
      case 'success':
        return (
          <TouchButton
            onClick={() => navigate('/auth')}
            className="w-full bg-green-600 hover:bg-green-700"
          >
            Continue to Login
          </TouchButton>
        )
      case 'expired':
      case 'error':
        return (
          <div className="flex flex-col space-y-2 w-full">
            {email && (
              <TouchButton
                onClick={handleResendVerification}
                disabled={resendVerificationMutation.isPending}
                className="w-full bg-blue-600 hover:bg-blue-700"
              >
                <Mail className="w-4 h-4 mr-2" />
                {resendVerificationMutation.isPending ? 'Sending...' : 'Resend Verification'}
              </TouchButton>
            )}
            <TouchButton
              variant="outline"
              onClick={() => navigate('/auth')}
              className="w-full border-slate-600 text-white hover:bg-slate-700"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Login
            </TouchButton>
          </div>
        )
      case 'verifying':
      default:
        return (
          <TouchButton
            variant="outline"
            onClick={() => navigate('/auth')}
            className="w-full border-slate-600 text-white hover:bg-slate-700"
            disabled={verificationState.status === 'verifying'}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Login
          </TouchButton>
        )
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardContent className="pt-6 text-center">
            <div className="flex flex-col items-center space-y-4">
              {getIcon()}
              <h2 className="text-2xl font-bold text-white">{getTitle()}</h2>
              <p className="text-slate-400 text-center">{verificationState.message}</p>
              {email && (
                <p className="text-sm text-slate-500 text-center">
                  Email: <strong>{email}</strong>
                </p>
              )}
              {getActions()}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

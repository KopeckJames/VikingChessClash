import { useState } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TouchButton } from '@/components/ui/touch-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Mail, Send, CheckCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ForgotPassword() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [email, setEmail] = useState('')
  const [isEmailSent, setIsEmailSent] = useState(false)

  const resetPasswordMutation = useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to send reset email')
      }

      return response.json()
    },
    onSuccess: () => {
      setIsEmailSent(true)
      toast({
        title: 'Reset email sent',
        description: 'Check your email for password reset instructions',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Reset failed',
        description: error.message || 'Failed to send reset email',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    resetPasswordMutation.mutate(email)
  }

  if (isEmailSent) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-white">Email Sent!</h2>
                <p className="text-slate-400 text-center">
                  We've sent password reset instructions to <strong>{email}</strong>
                </p>
                <p className="text-sm text-slate-500 text-center">
                  Check your email and follow the link to reset your password. The link will expire
                  in 1 hour.
                </p>
                <div className="flex flex-col space-y-2 w-full">
                  <TouchButton
                    onClick={() => navigate('/auth')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Back to Login
                  </TouchButton>
                  <TouchButton
                    variant="outline"
                    onClick={() => {
                      setIsEmailSent(false)
                      setEmail('')
                    }}
                    className="w-full border-slate-600 text-white hover:bg-slate-700"
                  >
                    Send Another Email
                  </TouchButton>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <TouchButton
                variant="ghost"
                size="icon"
                onClick={() => navigate('/auth')}
                className="text-slate-400 hover:text-white"
              >
                <ArrowLeft className="w-5 h-5" />
              </TouchButton>
              <div>
                <CardTitle className="text-white">Reset Password</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your email to receive reset instructions
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="reset-email" className="text-white flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  Email Address
                </Label>
                <Input
                  id="reset-email"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="bg-slate-700 border-slate-600 text-white h-12 text-base"
                  placeholder="warrior@valhalla.com"
                  autoComplete="email"
                  required
                />
              </div>

              <TouchButton
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                disabled={resetPasswordMutation.isPending}
              >
                <Send className="w-5 h-5 mr-2" />
                {resetPasswordMutation.isPending ? 'Sending...' : 'Send Reset Email'}
              </TouchButton>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-slate-500">
                Remember your password?{' '}
                <TouchButton
                  variant="link"
                  onClick={() => navigate('/auth')}
                  className="text-blue-400 hover:text-blue-300 p-0 h-auto"
                >
                  Back to login
                </TouchButton>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

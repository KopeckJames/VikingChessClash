import { useState, useEffect } from 'react'
import { useMutation } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TouchButton } from '@/components/ui/touch-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { ArrowLeft, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export default function ResetPassword() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isPasswordReset, setIsPasswordReset] = useState(false)

  const [formData, setFormData] = useState({
    newPassword: '',
    confirmPassword: '',
  })

  // Get token from URL
  const urlParams = new URLSearchParams(window.location.search)
  const token = urlParams.get('token')

  const resetPasswordMutation = useMutation({
    mutationFn: async (data: { token: string; newPassword: string }) => {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Failed to reset password')
      }

      return response.json()
    },
    onSuccess: () => {
      setIsPasswordReset(true)
      toast({
        title: 'Password reset successful',
        description: 'You can now login with your new password',
      })
    },
    onError: (error: any) => {
      toast({
        title: 'Reset failed',
        description: error.message || 'Failed to reset password',
        variant: 'destructive',
      })
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'The reset token is missing from the URL',
        variant: 'destructive',
      })
      return
    }

    if (formData.newPassword !== formData.confirmPassword) {
      toast({
        title: "Passwords don't match",
        description: 'Please make sure both passwords are identical',
        variant: 'destructive',
      })
      return
    }

    if (formData.newPassword.length < 8) {
      toast({
        title: 'Password too short',
        description: 'Password must be at least 8 characters long',
        variant: 'destructive',
      })
      return
    }

    resetPasswordMutation.mutate({
      token,
      newPassword: formData.newPassword,
    })
  }

  useEffect(() => {
    if (!token) {
      toast({
        title: 'Invalid reset link',
        description: 'Please use the link from your email',
        variant: 'destructive',
      })
    }
  }, [token, toast])

  if (isPasswordReset) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <CheckCircle className="w-16 h-16 text-green-500" />
                <h2 className="text-2xl font-bold text-white">Password Reset!</h2>
                <p className="text-slate-400 text-center">
                  Your password has been successfully reset. You can now login with your new
                  password.
                </p>
                <TouchButton
                  onClick={() => navigate('/auth')}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  Continue to Login
                </TouchButton>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  if (!token) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
            <CardContent className="pt-6 text-center">
              <div className="flex flex-col items-center space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-white">Invalid Reset Link</h2>
                <p className="text-slate-400 text-center">
                  This password reset link is invalid or has expired. Please request a new one.
                </p>
                <div className="flex flex-col space-y-2 w-full">
                  <TouchButton
                    onClick={() => navigate('/auth/forgot-password')}
                    className="w-full bg-blue-600 hover:bg-blue-700"
                  >
                    Request New Reset Link
                  </TouchButton>
                  <TouchButton
                    variant="outline"
                    onClick={() => navigate('/auth')}
                    className="w-full border-slate-600 text-white hover:bg-slate-700"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Login
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
                <CardTitle className="text-white">Set New Password</CardTitle>
                <CardDescription className="text-slate-400">
                  Enter your new password below
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="new-password" className="text-white flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  New Password
                </Label>
                <div className="relative">
                  <Input
                    id="new-password"
                    type={showPassword ? 'text' : 'password'}
                    value={formData.newPassword}
                    onChange={e => setFormData(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="bg-slate-700 border-slate-600 text-white h-12 text-base pr-12"
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                  <TouchButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 text-slate-400 hover:text-white"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </TouchButton>
                </div>
                <p className="text-xs text-slate-500">
                  Password must be at least 8 characters long
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm-password" className="text-white flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  Confirm New Password
                </Label>
                <div className="relative">
                  <Input
                    id="confirm-password"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={formData.confirmPassword}
                    onChange={e =>
                      setFormData(prev => ({ ...prev, confirmPassword: e.target.value }))
                    }
                    className="bg-slate-700 border-slate-600 text-white h-12 text-base pr-12"
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                    required
                  />
                  <TouchButton
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute right-1 top-1 h-10 w-10 text-slate-400 hover:text-white"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </TouchButton>
                </div>
              </div>

              <TouchButton
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                disabled={resetPasswordMutation.isPending}
              >
                <Lock className="w-5 h-5 mr-2" />
                {resetPasswordMutation.isPending ? 'Resetting...' : 'Reset Password'}
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

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useLocation } from 'wouter'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { TouchButton } from '@/components/ui/touch-button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import {
  Sword,
  Shield,
  Crown,
  Eye,
  EyeOff,
  Fingerprint,
  Mail,
  Lock,
  User,
  Github,
  Chrome,
  Smartphone,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import { useIsMobile } from '@/hooks/use-mobile'
import { cn } from '@/lib/utils'
import { signIn, getSession } from 'next-auth/react'

interface AuthFormData {
  email: string
  password: string
  username?: string
  displayName?: string
  rememberMe?: boolean
}

interface BiometricSupport {
  available: boolean
  type: string | null
}

export default function MobileAuthForm() {
  const [, navigate] = useLocation()
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const isMobile = useIsMobile()

  const [activeTab, setActiveTab] = useState('login')
  const [showPassword, setShowPassword] = useState(false)
  const [biometricSupport, setBiometricSupport] = useState<BiometricSupport>({
    available: false,
    type: null,
  })
  const [isOnboarding, setIsOnboarding] = useState(false)

  const [loginData, setLoginData] = useState<AuthFormData>({
    email: '',
    password: '',
    rememberMe: false,
  })

  const [registerData, setRegisterData] = useState<AuthFormData>({
    email: '',
    password: '',
    username: '',
    displayName: '',
    rememberMe: false,
  })

  // Check for biometric authentication support
  useEffect(() => {
    const checkBiometricSupport = async () => {
      if ('credentials' in navigator && 'create' in navigator.credentials) {
        try {
          // Check if WebAuthn is supported
          const available =
            await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable()
          setBiometricSupport({
            available,
            type: available ? 'fingerprint' : null,
          })
        } catch (error) {
          console.log('Biometric authentication not supported')
        }
      }
    }

    checkBiometricSupport()
  }, [])

  // Load remembered credentials
  useEffect(() => {
    const rememberedEmail = localStorage.getItem('rememberedEmail')
    if (rememberedEmail) {
      setLoginData(prev => ({ ...prev, email: rememberedEmail, rememberMe: true }))
    }
  }, [])

  const loginMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      const result = await signIn('credentials', {
        email: data.email,
        password: data.password,
        redirect: false,
      })

      if (result?.error) {
        throw new Error(result.error)
      }

      return result
    },
    onSuccess: async result => {
      // Handle remember me
      if (loginData.rememberMe) {
        localStorage.setItem('rememberedEmail', loginData.email)
      } else {
        localStorage.removeItem('rememberedEmail')
      }

      const session = await getSession()
      if (session?.user) {
        queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] })

        toast({
          title: 'Welcome back!',
          description: `Logged in as ${session.user.displayName || session.user.name}`,
        })

        navigate('/lobby')
      }
    },
    onError: (error: any) => {
      toast({
        title: 'Login failed',
        description: error.message || 'Invalid email or password',
        variant: 'destructive',
      })
    },
  })

  const registerMutation = useMutation({
    mutationFn: async (data: AuthFormData) => {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          password: data.password,
          username: data.username,
          displayName: data.displayName,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.message || 'Registration failed')
      }

      return response.json()
    },
    onSuccess: async user => {
      setIsOnboarding(true)

      // Auto-login after registration
      const result = await signIn('credentials', {
        email: registerData.email,
        password: registerData.password,
        redirect: false,
      })

      if (registerData.rememberMe) {
        localStorage.setItem('rememberedEmail', registerData.email)
      }

      toast({
        title: 'Welcome to Viking Chess!',
        description: `Account created for ${user.displayName}`,
      })

      // Show onboarding flow
      setTimeout(() => {
        setIsOnboarding(false)
        navigate('/lobby')
      }, 2000)
    },
    onError: (error: any) => {
      toast({
        title: 'Registration failed',
        description: error.message || 'Failed to create account',
        variant: 'destructive',
      })
    },
  })

  const handleBiometricLogin = async () => {
    if (!biometricSupport.available) return

    try {
      // This would integrate with WebAuthn for biometric authentication
      // For now, we'll show a placeholder
      toast({
        title: 'Biometric Login',
        description: 'Biometric authentication will be available soon!',
      })
    } catch (error) {
      toast({
        title: 'Biometric login failed',
        description: 'Please use your email and password instead',
        variant: 'destructive',
      })
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    try {
      const result = await signIn(provider, { callbackUrl: '/lobby' })
      if (result?.error) {
        throw new Error(result.error)
      }
    } catch (error) {
      toast({
        title: 'Social login failed',
        description: `Failed to login with ${provider}`,
        variant: 'destructive',
      })
    }
  }

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    loginMutation.mutate(loginData)
  }

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault()
    registerMutation.mutate(registerData)
  }

  if (isOnboarding) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-slate-800/80 border-slate-700 text-center">
          <CardContent className="pt-6">
            <div className="flex flex-col items-center space-y-4">
              <CheckCircle className="w-16 h-16 text-green-500" />
              <h2 className="text-2xl font-bold text-white">Welcome, Warrior!</h2>
              <p className="text-slate-400">Your account has been created successfully.</p>
              <div className="flex items-center space-x-2 text-sm text-slate-500">
                <Smartphone className="w-4 h-4" />
                <span>Redirecting to the battlefield...</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Crown className="w-8 h-8 text-yellow-500" />
            <h1 className="text-3xl font-bold text-white">Viking Chess</h1>
            <Sword className="w-8 h-8 text-red-500" />
          </div>
          <p className="text-slate-400">Enter the battlefield of Hnefatafl</p>
        </div>

        <Card className="bg-slate-800/80 border-slate-700 backdrop-blur-sm">
          <CardHeader className="pb-4">
            <CardTitle className="text-white text-center">Join the Battle</CardTitle>
            <CardDescription className="text-slate-400 text-center">
              {activeTab === 'login' ? 'Welcome back, warrior!' : 'Create your legend'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-slate-700 h-12">
                <TabsTrigger
                  value="login"
                  className="text-white data-[state=active]:bg-slate-600 h-10"
                >
                  Login
                </TabsTrigger>
                <TabsTrigger
                  value="register"
                  className="text-white data-[state=active]:bg-slate-600 h-10"
                >
                  Register
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4 mt-6">
                <form onSubmit={handleLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="login-email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="login-email"
                      type="email"
                      value={loginData.email}
                      onChange={e => setLoginData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white h-12 text-base"
                      placeholder="warrior@valhalla.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="login-password" className="text-white flex items-center gap-2">
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="login-password"
                        type={showPassword ? 'text' : 'password'}
                        value={loginData.password}
                        onChange={e =>
                          setLoginData(prev => ({ ...prev, password: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white h-12 text-base pr-12"
                        placeholder="Enter your password"
                        autoComplete="current-password"
                        required
                      />
                      <TouchButton
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-1 top-1 h-10 w-10 text-slate-400 hover:text-white"
                        onClick={() => setShowPassword(!showPassword)}
                      >
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </TouchButton>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="remember-login"
                        checked={loginData.rememberMe}
                        onCheckedChange={checked =>
                          setLoginData(prev => ({ ...prev, rememberMe: checked as boolean }))
                        }
                      />
                      <Label htmlFor="remember-login" className="text-sm text-slate-400">
                        Remember me
                      </Label>
                    </div>
                    <TouchButton
                      type="button"
                      variant="link"
                      className="text-sm text-blue-400 hover:text-blue-300 p-0 h-auto"
                      onClick={() => navigate('/auth/forgot-password')}
                    >
                      Forgot password?
                    </TouchButton>
                  </div>

                  <TouchButton
                    type="submit"
                    className="w-full bg-blue-600 hover:bg-blue-700 h-12 text-base"
                    disabled={loginMutation.isPending}
                  >
                    <Shield className="w-5 h-5 mr-2" />
                    {loginMutation.isPending ? 'Entering Battle...' : 'Enter Battle'}
                  </TouchButton>
                </form>

                {/* Biometric Login */}
                {biometricSupport.available && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 flex items-center">
                        <Separator className="w-full bg-slate-600" />
                      </div>
                      <div className="relative flex justify-center text-xs uppercase">
                        <span className="bg-slate-800 px-2 text-slate-400">Or</span>
                      </div>
                    </div>

                    <TouchButton
                      type="button"
                      variant="outline"
                      className="w-full border-slate-600 text-white hover:bg-slate-700 h-12"
                      onClick={handleBiometricLogin}
                    >
                      <Fingerprint className="w-5 h-5 mr-2" />
                      Use Biometric Login
                    </TouchButton>
                  </>
                )}
              </TabsContent>

              <TabsContent value="register" className="space-y-4 mt-6">
                <form onSubmit={handleRegister} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="register-email" className="text-white flex items-center gap-2">
                      <Mail className="w-4 h-4" />
                      Email
                    </Label>
                    <Input
                      id="register-email"
                      type="email"
                      value={registerData.email}
                      onChange={e => setRegisterData(prev => ({ ...prev, email: e.target.value }))}
                      className="bg-slate-700 border-slate-600 text-white h-12 text-base"
                      placeholder="warrior@valhalla.com"
                      autoComplete="email"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="register-username"
                      className="text-white flex items-center gap-2"
                    >
                      <User className="w-4 h-4" />
                      Username
                    </Label>
                    <Input
                      id="register-username"
                      type="text"
                      value={registerData.username}
                      onChange={e =>
                        setRegisterData(prev => ({ ...prev, username: e.target.value }))
                      }
                      className="bg-slate-700 border-slate-600 text-white h-12 text-base"
                      placeholder="vikingwarrior"
                      autoComplete="username"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="register-display-name"
                      className="text-white flex items-center gap-2"
                    >
                      <Crown className="w-4 h-4" />
                      Display Name
                    </Label>
                    <Input
                      id="register-display-name"
                      type="text"
                      value={registerData.displayName}
                      onChange={e =>
                        setRegisterData(prev => ({ ...prev, displayName: e.target.value }))
                      }
                      className="bg-slate-700 border-slate-600 text-white h-12 text-base"
                      placeholder="Your warrior name"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label
                      htmlFor="register-password"
                      className="text-white flex items-center gap-2"
                    >
                      <Lock className="w-4 h-4" />
                      Password
                    </Label>
                    <div className="relative">
                      <Input
                        id="register-password"
                        type={showPassword ? 'text' : 'password'}
                        value={registerData.password}
                        onChange={e =>
                          setRegisterData(prev => ({ ...prev, password: e.target.value }))
                        }
                        className="bg-slate-700 border-slate-600 text-white h-12 text-base pr-12"
                        placeholder="Create a strong password"
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
                        {showPassword ? (
                          <EyeOff className="w-4 h-4" />
                        ) : (
                          <Eye className="w-4 h-4" />
                        )}
                      </TouchButton>
                    </div>
                    <p className="text-xs text-slate-500">
                      Password must be at least 8 characters long
                    </p>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="remember-register"
                      checked={registerData.rememberMe}
                      onCheckedChange={checked =>
                        setRegisterData(prev => ({ ...prev, rememberMe: checked as boolean }))
                      }
                    />
                    <Label htmlFor="remember-register" className="text-sm text-slate-400">
                      Remember me after registration
                    </Label>
                  </div>

                  <TouchButton
                    type="submit"
                    className="w-full bg-red-600 hover:bg-red-700 h-12 text-base"
                    disabled={registerMutation.isPending}
                  >
                    <Sword className="w-5 h-5 mr-2" />
                    {registerMutation.isPending ? 'Creating Legend...' : 'Join the Warriors'}
                  </TouchButton>
                </form>
              </TabsContent>
            </Tabs>

            {/* Social Login Options */}
            <div className="space-y-4">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <Separator className="w-full bg-slate-600" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-slate-800 px-2 text-slate-400">Or continue with</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <TouchButton
                  type="button"
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700 h-12"
                  onClick={() => handleSocialLogin('google')}
                >
                  <Chrome className="w-5 h-5 mr-2" />
                  Google
                </TouchButton>
                <TouchButton
                  type="button"
                  variant="outline"
                  className="border-slate-600 text-white hover:bg-slate-700 h-12"
                  onClick={() => handleSocialLogin('github')}
                >
                  <Github className="w-5 h-5 mr-2" />
                  GitHub
                </TouchButton>
              </div>
            </div>

            {/* Mobile-specific features notice */}
            {isMobile && (
              <div className="bg-slate-700/50 rounded-lg p-3 text-center">
                <div className="flex items-center justify-center space-x-2 text-sm text-slate-400">
                  <Smartphone className="w-4 h-4" />
                  <span>Optimized for mobile play</span>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

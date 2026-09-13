import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Server, Mail, AlertCircle, CheckCircle, RotateCcw } from 'lucide-react'
import { useAuth } from '../AuthProvider'
import { clsx } from 'clsx'

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address'),
})

type ForgotPasswordForm = z.infer<typeof forgotPasswordSchema>

export function ForgotPasswordPage() {
  const { resetPassword } = useAuth()
  const [step, setStep] = useState<'request' | 'sent'>('request')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ForgotPasswordForm>({
    resolver: zodResolver(forgotPasswordSchema),
  })

  const onSubmit = async (data: ForgotPasswordForm) => {
    setError(null)
    setLoading(true)

    const { error } = await resetPassword(data.email)
    
    setLoading(false)
    
    if (error) {
      setError(error.message)
      return
    }

    setStep('sent')
  }

  const handleResend = async () => {
    const email = (document.getElementById('email') as HTMLInputElement)?.value
    if (!email) return
    
    setLoading(true)
    const { error } = await resetPassword(email)
    setLoading(false)
    
    if (error) {
      setError(error.message)
    }
  }

  if (step === 'sent') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
        <div className="w-full max-w-md text-center">
          <div className="card p-8">
            <div className="mx-auto h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-6">
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-surface-900">Check your email</h2>
            <p className="mt-2 text-surface-500">
              We&apos;ve sent password reset instructions to your email address.
            </p>
            <p className="mt-4 text-sm text-surface-500">
              Didn&apos;t receive the email? Check your spam folder or try again.
            </p>
            <div className="mt-6 space-y-3">
              <button
                onClick={handleResend}
                disabled={loading}
                className="btn-outline w-full"
              >
                {loading ? 'Sending...' : 'Resend Email'}
              </button>
              <Link to="/login" className="btn-primary w-full block">
                Back to Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-50 px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/dashboard" className="inline-flex items-center gap-2">
            <Server className="h-10 w-10 text-primary-600" />
            <span className="text-2xl font-bold text-surface-900">INFO DOCS</span>
          </Link>
          <p className="mt-2 text-surface-500">Reset your password</p>
        </div>

        {/* Card */}
        <div className="card">
          <div className="card-header">
            <h2 className="card-title">Forgot password?</h2>
            <p className="card-description">Enter your email and we&apos;ll send you reset instructions</p>
          </div>
          
          <form onSubmit={handleSubmit(onSubmit)} className="card-content space-y-4" noValidate>
            {error && (
              <div className="flex items-center gap-2 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                {error}
              </div>
            )}

            <div>
              <label htmlFor="email" className="label">Email</label>
              <div className="relative mt-1">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-surface-400" />
                <input
                  {...register('email')}
                  id="email"
                  type="email"
                  autoComplete="email"
                  className={clsx('input pl-10', errors.email && 'border-red-500 focus:ring-red-500')}
                  placeholder="you@company.com"
                  disabled={loading}
                />
              </div>
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <button
              type="submit"
              className="btn-primary w-full"
              disabled={loading}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <RotateCcw className="h-5 w-5 animate-spin" />
                  Sending...
                </span>
              ) : (
                'Send reset link'
              )}
            </button>
          </form>

          <div className="card-footer justify-center">
            <p className="text-sm text-surface-500">
              Remember your password?{' '}
              <Link to="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                Sign in
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
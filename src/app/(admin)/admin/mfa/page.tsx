'use client'

import { useState, useEffect } from 'react'
import { Loader2, Shield, CheckCircle, Smartphone, Copy, Check } from 'lucide-react'
import { createClient } from '@/lib/supabase'
import { Button, Input, Label, Card } from '@/components/ui'

export default function MFASetupPage() {
  const [loading, setLoading] = useState(true)
  const [enrolling, setEnrolling] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [mfaEnabled, setMfaEnabled] = useState(false)
  const [qrCode, setQrCode] = useState<string | null>(null)
  const [secret, setSecret] = useState<string | null>(null)
  const [factorId, setFactorId] = useState<string | null>(null)
  const [verifyCode, setVerifyCode] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    checkMFAStatus()
  }, [])

  const checkMFAStatus = async () => {
    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.listFactors()

      if (error) {
        console.error('Error checking MFA status:', error)
      } else {
        const verifiedFactors = data?.totp?.filter(f => f.status === 'verified') || []
        setMfaEnabled(verifiedFactors.length > 0)
      }
    } catch (err) {
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  const startEnrollment = async () => {
    setEnrolling(true)
    setError('')

    try {
      const supabase = createClient()
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      })

      if (error) {
        setError(error.message)
      } else if (data) {
        setQrCode(data.totp.qr_code)
        setSecret(data.totp.secret)
        setFactorId(data.id)
      }
    } catch {
      setError('Failed to start MFA enrollment')
    } finally {
      setEnrolling(false)
    }
  }

  const verifyEnrollment = async () => {
    if (!factorId || verifyCode.length !== 6) return

    setVerifying(true)
    setError('')

    try {
      const supabase = createClient()
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId,
      })

      if (challengeError) {
        setError(challengeError.message)
        setVerifying(false)
        return
      }

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      })

      if (verifyError) {
        setError(verifyError.message)
      } else {
        setSuccess('MFA has been enabled successfully!')
        setMfaEnabled(true)
        setQrCode(null)
        setSecret(null)
        setFactorId(null)
        setVerifyCode('')
      }
    } catch {
      setError('Failed to verify MFA code')
    } finally {
      setVerifying(false)
    }
  }

  const disableMFA = async () => {
    if (!confirm('Are you sure you want to disable MFA? This will make your account less secure.')) {
      return
    }

    setLoading(true)
    setError('')

    try {
      const supabase = createClient()
      const { data } = await supabase.auth.mfa.listFactors()

      if (data?.totp) {
        for (const factor of data.totp) {
          await supabase.auth.mfa.unenroll({ factorId: factor.id })
        }
      }

      setMfaEnabled(false)
      setSuccess('MFA has been disabled')
    } catch {
      setError('Failed to disable MFA')
    } finally {
      setLoading(false)
    }
  }

  const copySecret = () => {
    if (secret) {
      navigator.clipboard.writeText(secret)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
      </div>
    )
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <Shield className="h-8 w-8 text-violet-500" />
        <div>
          <h1 className="text-2xl font-bold">Two-Factor Authentication</h1>
          <p className="text-gray-500">Add an extra layer of security to your account</p>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-lg mb-6 text-sm">
          {success}
        </div>
      )}

      <Card>
        {mfaEnabled && !qrCode ? (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CheckCircle className="h-8 w-8 text-green-500" />
              <div>
                <h2 className="text-lg font-semibold text-green-700">MFA is Enabled</h2>
                <p className="text-gray-500 text-sm">Your account is protected with two-factor authentication</p>
              </div>
            </div>

            <Button variant="danger" onClick={disableMFA} className="mt-4">
              Disable MFA
            </Button>
          </div>
        ) : qrCode ? (
          <div>
            <h2 className="text-lg font-semibold mb-4">Set Up Authenticator App</h2>

            <div className="space-y-6">
              <div>
                <p className="text-gray-600 mb-4">
                  <span className="font-medium">Step 1:</span> Scan this QR code with your authenticator app
                  (Google Authenticator, Authy, 1Password, etc.)
                </p>
                <div className="flex justify-center">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={qrCode} alt="MFA QR Code" className="w-48 h-48 border rounded-lg" />
                </div>
              </div>

              <div>
                <p className="text-gray-600 mb-2">
                  <span className="font-medium">{"Can't scan?"}</span> Enter this code manually:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 bg-gray-100 px-4 py-2 rounded-lg font-mono text-sm break-all">
                    {secret}
                  </code>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={copySecret}
                    className="px-2"
                  >
                    {copied ? <Check className="h-5 w-5 text-green-500" /> : <Copy className="h-5 w-5" />}
                  </Button>
                </div>
              </div>

              <div>
                <Label>
                  <span className="font-medium">Step 2:</span> Enter the 6-digit code from your app
                </Label>
                <div className="flex gap-3">
                  <Input
                    type="text"
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="000000"
                    className="text-center text-2xl tracking-widest font-mono py-3"
                    maxLength={6}
                  />
                  <Button
                    onClick={verifyEnrollment}
                    disabled={verifying || verifyCode.length !== 6}
                    size="lg"
                  >
                    {verifying ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Verify'}
                  </Button>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setQrCode(null)
                  setSecret(null)
                  setFactorId(null)
                  setVerifyCode('')
                }}
              >
                Cancel setup
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Smartphone className="h-8 w-8 text-gray-400" />
              <div>
                <h2 className="text-lg font-semibold">MFA is Not Enabled</h2>
                <p className="text-gray-500 text-sm">Protect your account with an authenticator app</p>
              </div>
            </div>

            <p className="text-gray-600 mb-6">
              Two-factor authentication adds an extra layer of security by requiring a code from your
              phone in addition to your password.
            </p>

            <Button onClick={startEnrollment} disabled={enrolling} size="lg">
              {enrolling ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Setting up...
                </>
              ) : (
                <>
                  <Shield className="h-5 w-5" />
                  Enable MFA
                </>
              )}
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

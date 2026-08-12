import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { KeyRound, LogOut, ShieldCheck } from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/Toaster'
import { Button, Card, Field, PageHeading, PasswordInput, Reveal } from '../ui'

export default function UserSettings() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const toast = useToast()

  const [form, setForm] = useState({ currentPassword: '', password: '', confirm: '' })
  const [saving, setSaving] = useState(false)

  const onChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const changePassword = async (event) => {
    event.preventDefault()

    if (form.password.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (form.password !== form.confirm) {
      toast.error('Both new password fields must match.')
      return
    }

    setSaving(true)
    try {
      await api.patch('/api/auth/me/password', {
        currentPassword: form.currentPassword,
        password: form.password,
      })
      setForm({ currentPassword: '', password: '', confirm: '' })
      toast.success('Password updated.', { title: 'Saved' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSaving(false)
    }
  }

  const signOut = async () => {
    await logout()
    toast.success('Signed out of the research portal.', { title: 'Goodbye' })
    navigate('/', { replace: true })
  }

  return (
    <>
      <PageHeading title="Settings" subtitle="Manage your sign-in credentials and session." />

      <Reveal className="grid gap-5 lg:grid-cols-[1.3fr_1fr]">
        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <KeyRound className="h-4 w-4 text-cyan-dim" />
            Change password
          </h2>

          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password">
              <PasswordInput
                name="currentPassword"
                value={form.currentPassword}
                onChange={onChange}
                autoComplete="current-password"
              />
            </Field>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="New password" hint="At least 8 characters.">
                <PasswordInput
                  name="password"
                  value={form.password}
                  onChange={onChange}
                  autoComplete="new-password"
                />
              </Field>
              <Field label="Confirm new password">
                <PasswordInput
                  name="confirm"
                  value={form.confirm}
                  onChange={onChange}
                  autoComplete="new-password"
                />
              </Field>
            </div>

            <Button type="submit" variant="primary" disabled={saving}>
              {saving ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          <Card>
            <h2 className="mb-3 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
              <ShieldCheck className="h-4 w-4 text-cyan-dim" />
              Portal access
            </h2>
            <p className="text-[13px] leading-relaxed text-muted">
              Your account <span className="font-medium text-ink">{user?.email}</span> is verified
              for research portal access. Credentials are personal — do not share them with
              colleagues who have not been approved.
            </p>
          </Card>

          <Card>
            <h2 className="mb-3 font-display text-[15px] font-bold text-ink">Session</h2>
            <p className="mb-4 text-[13px] text-muted">
              Signing out clears your portal session on this device.
            </p>
            <Button variant="outline" onClick={signOut}>
              <LogOut className="h-4 w-4" />
              Sign out
            </Button>
          </Card>
        </div>
      </Reveal>
    </>
  )
}

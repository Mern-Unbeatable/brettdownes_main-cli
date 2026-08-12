import { useEffect, useState } from 'react'
import { KeyRound, Save } from 'lucide-react'
import { api } from '../../../lib/api'
import { useAuth } from '../../../context/AuthContext'
import { useToast } from '../../../components/Toaster'
import { Button, Card, Field, Input, PageHeading, PasswordInput, Reveal } from '../ui'

export default function AdminProfile() {
  const { user, setUser } = useAuth()
  const toast = useToast()

  const [name, setName] = useState('')
  const [savingProfile, setSavingProfile] = useState(false)

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    password: '',
    confirm: '',
  })
  const [savingPassword, setSavingPassword] = useState(false)

  useEffect(() => {
    if (!user) return
    setName(user.name || '')
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault()
    if (!name.trim()) {
      toast.error('Your name cannot be empty.')
      return
    }

    setSavingProfile(true)
    try {
      const data = await api.patch('/api/auth/me', { name: name.trim() })
      setUser(data.user)
      toast.success('Name updated.', { title: 'Saved' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingProfile(false)
    }
  }

  const changePassword = async (event) => {
    event.preventDefault()
    if (passwordForm.password.length < 8) {
      toast.error('New password must be at least 8 characters.')
      return
    }
    if (passwordForm.password !== passwordForm.confirm) {
      toast.error('New password and confirmation do not match.')
      return
    }

    setSavingPassword(true)
    try {
      await api.patch('/api/auth/me/password', {
        currentPassword: passwordForm.currentPassword,
        password: passwordForm.password,
      })
      setPasswordForm({ currentPassword: '', password: '', confirm: '' })
      toast.success('Password updated.', { title: 'Saved' })
    } catch (err) {
      toast.error(err.message)
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <>
      <PageHeading title="Profile" subtitle="Update your name or password." />

      <Reveal className="mx-auto grid max-w-2xl gap-5">
        <Card>
          <h2 className="mb-4 font-display text-[15px] font-bold text-ink">Display name</h2>
          <form onSubmit={saveProfile} className="space-y-4">
            <Field label="Full name">
              <Input
                value={name}
                onChange={(event) => setName(event.target.value)}
                autoComplete="name"
              />
            </Field>
            <p className="text-[12px] text-muted">Signed in as {user?.email}</p>
            <Button type="submit" variant="primary" disabled={savingProfile}>
              <Save className="h-4 w-4" />
              {savingProfile ? 'Saving…' : 'Save name'}
            </Button>
          </form>
        </Card>

        <Card>
          <h2 className="mb-4 flex items-center gap-2 font-display text-[15px] font-bold text-ink">
            <KeyRound className="h-4 w-4 text-cyan-dim" />
            Change password
          </h2>
          <form onSubmit={changePassword} className="space-y-4">
            <Field label="Current password">
              <PasswordInput
                autoComplete="current-password"
                value={passwordForm.currentPassword}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, currentPassword: event.target.value }))
                }
              />
            </Field>
            <Field label="New password" hint="At least 8 characters.">
              <PasswordInput
                autoComplete="new-password"
                value={passwordForm.password}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, password: event.target.value }))
                }
              />
            </Field>
            <Field label="Confirm new password">
              <PasswordInput
                autoComplete="new-password"
                value={passwordForm.confirm}
                onChange={(event) =>
                  setPasswordForm((prev) => ({ ...prev, confirm: event.target.value }))
                }
              />
            </Field>
            <Button type="submit" variant="primary" disabled={savingPassword}>
              <KeyRound className="h-4 w-4" />
              {savingPassword ? 'Updating…' : 'Update password'}
            </Button>
          </form>
        </Card>
      </Reveal>
    </>
  )
}

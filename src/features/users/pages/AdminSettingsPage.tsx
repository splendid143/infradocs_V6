import { useEffect, useState } from 'react'
import { Save, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card'
import { PageHeader } from '@/components/ui/PageHeader'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Input } from '@/components/ui/Input'
import { Label } from '@/components/ui/Label'

const SETTINGS_KEY = 'infodocs_system_settings'

const TIMEZONES = [
  'UTC',
  'Asia/Kolkata',
  'Asia/Dubai',
  'Asia/Singapore',
  'Asia/Tokyo',
  'Europe/London',
  'Europe/Berlin',
  'Europe/Paris',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Australia/Sydney',
  'Pacific/Auckland',
]

const DATE_FORMATS = ['YYYY-MM-DD', 'DD/MM/YYYY', 'MM/DD/YYYY', 'DD-MMM-YYYY']

type SystemSettings = {
  appName: string
  timezone: string
  dateFormat: string
  emailNotifications: boolean
  signupAlerts: boolean
  maxFileSizeMb: number
}

const defaults: SystemSettings = {
  appName: 'INFO DOCS',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
  dateFormat: 'YYYY-MM-DD',
  emailNotifications: true,
  signupAlerts: true,
  maxFileSizeMb: 50,
}

function loadSettings(): SystemSettings {
  try {
    const raw = localStorage.getItem(SETTINGS_KEY)
    if (!raw) return { ...defaults }
    return { ...defaults, ...JSON.parse(raw) }
  } catch {
    return { ...defaults }
  }
}

export function AdminSettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>(defaults)
  const [saved, setSaved] = useState(false)
  const [baseline, setBaseline] = useState<string>('')

  useEffect(() => {
    const s = loadSettings()
    setSettings(s)
    setBaseline(JSON.stringify(s))
  }, [])

  const isDirty = JSON.stringify(settings) !== baseline

  // Ensure current browser TZ is in the list for display
  const timezoneOptions = TIMEZONES.includes(settings.timezone)
    ? TIMEZONES
    : [settings.timezone, ...TIMEZONES]

  const update = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
    setSettings((s) => ({ ...s, [key]: value }))
    setSaved(false)
  }

  const handleSave = () => {
    if (!isDirty) return
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings))
    setBaseline(JSON.stringify(settings))
    setSaved(true)
    window.dispatchEvent(new CustomEvent('infodocs-settings-changed', { detail: settings }))
  }

  const previewNow = (() => {
    try {
      return new Intl.DateTimeFormat(undefined, {
        timeZone: settings.timezone,
        dateStyle: 'medium',
        timeStyle: 'short',
      }).format(new Date())
    } catch {
      return new Date().toISOString()
    }
  })()

  return (
    <div>
      <PageHeader
        title="System Settings"
        description="Configure application settings and preferences"
      />

      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>General</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="appName">Application Name</Label>
              <Input
                id="appName"
                value={settings.appName}
                onChange={(e) => update('appName', e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="timezone">Default Timezone</Label>
              <select
                id="timezone"
                className="input"
                value={settings.timezone}
                onChange={(e) => update('timezone', e.target.value)}
              >
                {timezoneOptions.map((tz) => (
                  <option key={tz} value={tz}>{tz}</option>
                ))}
              </select>
              <p className="text-xs text-surface-500 mt-1">
                Preview in this zone: <span className="font-mono">{previewNow}</span>
              </p>
            </div>
            <div>
              <Label htmlFor="dateFormat">Date Format</Label>
              <select
                id="dateFormat"
                className="input"
                value={settings.dateFormat}
                onChange={(e) => update('dateFormat', e.target.value)}
              >
                {DATE_FORMATS.map((f) => (
                  <option key={f} value={f}>{f}</option>
                ))}
              </select>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">Email Notifications</h4>
                <p className="text-sm text-surface-500">Receive email for important events</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.emailNotifications}
                  onChange={(e) => update('emailNotifications', e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h4 className="font-medium">New User Signup Alerts</h4>
                <p className="text-sm text-surface-500">Notify admins when users register</p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  className="sr-only peer"
                  checked={settings.signupAlerts}
                  onChange={(e) => update('signupAlerts', e.target.checked)}
                />
                <div className="w-11 h-6 bg-surface-300 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
              </label>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Storage</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label htmlFor="maxFile">Max File Size (MB)</Label>
              <Input
                id="maxFile"
                type="number"
                className="w-24"
                min={1}
                max={500}
                value={settings.maxFileSizeMb}
                onChange={(e) => update('maxFileSizeMb', parseInt(e.target.value, 10) || 50)}
              />
            </div>
            <div>
              <Label>Allowed Image Types</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="primary">JPG</Badge>
                <Badge variant="primary">PNG</Badge>
                <Badge variant="primary">WEBP</Badge>
              </div>
            </div>
            <div>
              <Label>Allowed Document Types</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                <Badge variant="success">PDF</Badge>
                <Badge variant="success">XLSX</Badge>
                <Badge variant="success">DOCX</Badge>
                <Badge variant="success">TXT</Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-end gap-3">
          {saved && (
            <span className="text-sm text-green-600 flex items-center gap-1">
              <CheckCircle className="h-4 w-4" /> Saved locally
            </span>
          )}
          <Button onClick={handleSave} disabled={!isDirty} className={!isDirty ? 'opacity-50 cursor-not-allowed' : ''}>
            <Save className="h-4 w-4 mr-2" />
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  )
}

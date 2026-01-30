import { useState, useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import styles from './Settings.module.css';
import { fetchWithAuth } from '../lib/fetchWithAuth';
import { useSupabaseAuth } from '../hooks/useSupabaseAuth';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Label } from '../components/ui/label';
import { Switch } from '../components/ui/switch';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { toast } from 'sonner';

type SettingsTab = 'profile' | 'notifications' | 'connected' | 'password';

interface UserProfile {
  id: string;
  email: string;
  firstName: string | null;
  lastName: string | null;
  createdAt: string;
}

interface NotificationPreferences {
  emailFrequency: 'daily' | 'weekly' | 'monthly' | 'none';
  emailOpportunityAlerts: boolean;
  emailWeeklyDigest: boolean;
  emailTaxDeadlines: boolean;
  emailProductUpdates: boolean;
}

interface ConnectedAccount {
  provider: string;
  email: string;
  connectedAt: string;
}

export default function Settings() {
  const [activeTab, setActiveTab] = useState<SettingsTab>('profile');
  const { user } = useSupabaseAuth();

  const { data: profile, isLoading: profileLoading } = useQuery<UserProfile>({
    queryKey: ['/api/settings/profile'],
  });

  const { data: notifications } = useQuery<NotificationPreferences>({
    queryKey: ['/api/settings/notifications'],
  });

  const { data: connectedAccounts } = useQuery<ConnectedAccount[]>({
    queryKey: ['/api/settings/connected-accounts'],
  });

  const tabs: { id: SettingsTab; label: string; icon: React.ReactNode }[] = [
    {
      id: 'profile',
      label: 'Profile',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
          <circle cx="12" cy="7" r="4"/>
        </svg>
      ),
    },
    {
      id: 'notifications',
      label: 'Email & Notifications',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
          <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
        </svg>
      ),
    },
    {
      id: 'connected',
      label: 'Connected Accounts',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
          <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
        </svg>
      ),
    },
    {
      id: 'password',
      label: 'Password',
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Settings</h1>
        <p className={styles.subtitle}>Manage your account preferences and notifications</p>
      </div>

      <div className={styles.content}>
        <nav className={styles.tabs}>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`${styles.tab} ${activeTab === tab.id ? styles.active : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <span className={styles.tabIcon}>{tab.icon}</span>
              <span className={styles.tabLabel}>{tab.label}</span>
            </button>
          ))}
        </nav>

        <div className={styles.panel}>
          {activeTab === 'profile' && (
            <ProfileSection profile={profile} isLoading={profileLoading} />
          )}
          {activeTab === 'notifications' && (
            <NotificationsSection preferences={notifications} />
          )}
          {activeTab === 'connected' && (
            <ConnectedAccountsSection accounts={connectedAccounts} />
          )}
          {activeTab === 'password' && (
            <PasswordSection userEmail={profile?.email || user?.email} />
          )}
        </div>
      </div>
    </div>
  );
}

function ProfileSection({ profile, isLoading }: { profile?: UserProfile; isLoading: boolean }) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (profile) {
      setFirstName(profile.firstName || '');
      setLastName(profile.lastName || '');
    }
  }, [profile]);

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetchWithAuth('/api/settings/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName }),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Profile updated successfully' });
        queryClient.invalidateQueries({ queryKey: ['/api/settings/profile'] });
      } else {
        throw new Error('Failed to update profile');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update profile. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return <div className={styles.loading}>Loading profile...</div>;
  }

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Profile Information</h2>
      <p className={styles.sectionDesc}>Update your personal information</p>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.formGrid}>
        <div className={styles.field}>
          <Label htmlFor="firstName">First Name</Label>
          <Input
            id="firstName"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            placeholder="Enter your first name"
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="lastName">Last Name</Label>
          <Input
            id="lastName"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            placeholder="Enter your last name"
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={profile?.email || ''}
            disabled
          />
          <span className={styles.hint}>Email cannot be changed</span>
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>

      <div className={styles.dangerZone}>
        <h3 className={styles.dangerTitle}>Danger Zone</h3>
        <p className={styles.dangerDesc}>
          Permanently delete your account and all associated data
        </p>
        <Button variant="destructive">Delete Account</Button>
      </div>
    </div>
  );
}

function NotificationsSection({ preferences }: { preferences?: NotificationPreferences }) {
  const [prefs, setPrefs] = useState<NotificationPreferences>({
    emailFrequency: 'weekly',
    emailOpportunityAlerts: true,
    emailWeeklyDigest: true,
    emailTaxDeadlines: true,
    emailProductUpdates: false,
  });
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (preferences) {
      setPrefs(preferences);
    }
  }, [preferences]);

  const handleToggle = (key: keyof Omit<NotificationPreferences, 'emailFrequency'>) => {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleFrequencyChange = (frequency: NotificationPreferences['emailFrequency']) => {
    setPrefs((prev) => ({ ...prev, emailFrequency: frequency }));
  };

  const handleSave = async () => {
    setSaving(true);
    setMessage(null);
    try {
      const response = await fetchWithAuth('/api/settings/notifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(prefs),
      });
      if (response.ok) {
        setMessage({ type: 'success', text: 'Notification preferences saved' });
        queryClient.invalidateQueries({ queryKey: ['/api/settings/notifications'] });
      } else {
        throw new Error('Failed to update');
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to update preferences' });
    } finally {
      setSaving(false);
    }
  };

  const frequencyOptions: { value: NotificationPreferences['emailFrequency']; label: string; desc: string }[] = [
    { value: 'daily', label: 'Daily', desc: 'Get updates every morning' },
    { value: 'weekly', label: 'Weekly', desc: 'Sunday summary of your week' },
    { value: 'monthly', label: 'Monthly', desc: 'First of the month recap' },
    { value: 'none', label: 'None', desc: 'Only critical alerts' },
  ];

  const alertOptions: { key: keyof Omit<NotificationPreferences, 'emailFrequency'>; label: string; desc: string }[] = [
    { key: 'emailOpportunityAlerts', label: 'Opportunity Alerts', desc: 'Get notified when we find money-saving opportunities' },
    { key: 'emailWeeklyDigest', label: 'Weekly Digest', desc: 'Summary of your financial activity and insights' },
    { key: 'emailTaxDeadlines', label: 'Tax Deadlines', desc: 'Never miss an important tax date' },
    { key: 'emailProductUpdates', label: 'Product Updates', desc: 'New features and improvements' },
  ];

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Email & Notifications</h2>
      <p className={styles.sectionDesc}>Control how and when we reach out to you</p>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      {/* Email Frequency */}
      <div className={styles.frequencySection}>
        <h3 className={styles.subsectionTitle}>How often do you want to hear from us?</h3>
        <div className={styles.frequencyGrid}>
          {frequencyOptions.map((option) => (
            <button
              key={option.value}
              className={`${styles.frequencyCard} ${prefs.emailFrequency === option.value ? styles.frequencyActive : ''}`}
              onClick={() => handleFrequencyChange(option.value)}
            >
              <span className={styles.frequencyLabel}>{option.label}</span>
              <span className={styles.frequencyDesc}>{option.desc}</span>
              {prefs.emailFrequency === option.value && (
                <span className={styles.frequencyCheck}>✓</span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Alert Types */}
      <div className={styles.alertsSection}>
        <h3 className={styles.subsectionTitle}>What should we notify you about?</h3>
        <div className={styles.toggleList}>
          {alertOptions.map((option) => (
            <div key={option.key} className={styles.toggleItem}>
              <div className={styles.toggleInfo}>
                <Label className={styles.toggleLabel}>{option.label}</Label>
                <span className={styles.toggleDesc}>{option.desc}</span>
              </div>
              <Switch
                checked={prefs[option.key]}
                onCheckedChange={() => handleToggle(option.key)}
              />
            </div>
          ))}
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? 'Saving...' : 'Save Preferences'}
        </Button>
      </div>
    </div>
  );
}

function ConnectedAccountsSection({ accounts }: { accounts?: ConnectedAccount[] }) {
  const { signInWithGoogle } = useSupabaseAuth();

  const handleConnectGoogle = async () => {
    try {
      await signInWithGoogle();
    } catch (error) {
      console.error('Failed to connect Google:', error);
    }
  };

  const providers = [
    {
      id: 'google',
      name: 'Google',
      icon: (
        <svg viewBox="0 0 24 24" width="24" height="24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
      ),
    },
  ];

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Connected Accounts</h2>
      <p className={styles.sectionDesc}>Manage your connected third-party accounts</p>

      <div className={styles.accountList}>
        {providers.map((provider) => {
          const connected = accounts?.find((a) => a.provider === provider.id);
          return (
            <div key={provider.id} className={styles.accountItem}>
              <div className={styles.accountIcon}>{provider.icon}</div>
              <div className={styles.accountInfo}>
                <span className={styles.accountName}>{provider.name}</span>
                {connected ? (
                  <span className={styles.accountEmail}>{connected.email}</span>
                ) : (
                  <span className={styles.accountStatus}>Not connected</span>
                )}
              </div>
              {connected ? (
                <Button variant="outline" size="sm">Disconnect</Button>
              ) : (
                <Button variant="outline" size="sm" onClick={handleConnectGoogle}>
                  Connect
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function PasswordSection({ userEmail: _userEmail }: { userEmail?: string }) {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const handleChangePassword = async () => {
    setMessage(null);

    if (!currentPassword || !newPassword || !confirmPassword) {
      setMessage({ type: 'error', text: 'Please fill in all fields' });
      return;
    }

    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }

    if (newPassword.length < 8) {
      setMessage({ type: 'error', text: 'Password must be at least 8 characters' });
      return;
    }

    setSaving(true);
    try {
      const response = await fetchWithAuth('/api/settings/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Password changed successfully' });
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
      } else {
        const data = await response.json();
        setMessage({ type: 'error', text: data.message || 'Failed to change password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to change password. Please try again.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={styles.section}>
      <h2 className={styles.sectionTitle}>Change Password</h2>
      <p className={styles.sectionDesc}>Update your account password</p>

      {message && (
        <div className={`${styles.message} ${styles[message.type]}`}>
          {message.text}
        </div>
      )}

      <div className={styles.passwordForm}>
        <div className={styles.field}>
          <Label htmlFor="currentPassword">Current Password</Label>
          <Input
            id="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="Enter current password"
          />
        </div>

        <div className={styles.field}>
          <Label htmlFor="newPassword">New Password</Label>
          <Input
            id="newPassword"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="Enter new password"
          />
          <span className={styles.hint}>Must be at least 8 characters</span>
        </div>

        <div className={styles.field}>
          <Label htmlFor="confirmPassword">Confirm New Password</Label>
          <Input
            id="confirmPassword"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Confirm new password"
          />
        </div>
      </div>

      <div className={styles.actions}>
        <Button onClick={handleChangePassword} disabled={saving}>
          {saving ? 'Changing...' : 'Change Password'}
        </Button>
      </div>
    </div>
  );
}

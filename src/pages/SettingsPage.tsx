import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile } from '@/hooks/useProfile';
import { AVATAR_OPTIONS } from '@/types/profile';
import { Button } from '@/components/ui/button';
import {
  User,
  Bell,
  Palette,
  Shield,
  HelpCircle,
  LogOut,
  ChevronRight,
  Puzzle,
  Trophy,
} from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import ProfileSection from '@/components/settings/ProfileSection';
import AppearanceSection from '@/components/settings/AppearanceSection';
import NotificationsSection from '@/components/settings/NotificationsSection';
import PrivacySection from '@/components/settings/PrivacySection';
import HelpSection from '@/components/settings/HelpSection';
import IntegrationsSection from '@/components/settings/IntegrationsSection';
import RewardsSection from '@/components/settings/RewardsSection';

type Section = 'main' | 'profile' | 'privacy' | 'notifications' | 'appearance' | 'integrations' | 'help' | 'rewards';

const SettingsPage: React.FC = () => {
  const { user, signOut } = useAuth();
  const { data: profile } = useProfile();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Use URL query param for section, default to 'main'
  const sectionFromUrl = (searchParams.get('section') as Section) || 'main';
  const [section, setSection_] = useState<Section>(sectionFromUrl);

  const setSection = (s: Section) => {
    setSection_(s);
    if (s === 'main') {
      searchParams.delete('section');
    } else {
      searchParams.set('section', s);
    }
    // Keep other params (like code for OAuth callback)
    setSearchParams(searchParams, { replace: true });
  };

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === (profile?.selected_avatar || 'default'));

  if (section === 'profile') return <div className="max-w-2xl mx-auto px-4 py-8"><ProfileSection onBack={() => setSection('main')} /></div>;
  if (section === 'privacy') return <div className="max-w-2xl mx-auto px-4 py-8"><PrivacySection onBack={() => setSection('main')} /></div>;
  if (section === 'notifications') return <div className="max-w-2xl mx-auto px-4 py-8"><NotificationsSection onBack={() => setSection('main')} /></div>;
  if (section === 'appearance') return <div className="max-w-2xl mx-auto px-4 py-8"><AppearanceSection onBack={() => setSection('main')} /></div>;
  if (section === 'integrations') return <div className="max-w-2xl mx-auto px-4 py-8"><IntegrationsSection onBack={() => setSection('main')} /></div>;
  if (section === 'help') return <div className="max-w-2xl mx-auto px-4 py-8"><HelpSection onBack={() => setSection('main')} /></div>;
  if (section === 'rewards') return <div className="max-w-2xl mx-auto px-4 py-8"><RewardsSection onBack={() => setSection('main')} /></div>;

  const sections = [
    {
      title: 'Account',
      items: [
        {
          icon: () => <span className="text-xl">{currentAvatar?.emoji || '😊'}</span>,
          label: profile?.display_name || 'Profile',
          description: user?.email || 'Not signed in',
          action: () => setSection('profile'),
        },
        { icon: Shield, label: 'Privacy & Security', description: 'Export data, manage permissions', action: () => setSection('privacy') },
      ],
    },
    {
      title: 'Preferences',
      items: [
        { icon: Bell, label: 'Notifications', description: 'Reminders, streaks & alerts', action: () => setSection('notifications') },
        { icon: Palette, label: 'Appearance', description: 'Dark mode, animations', action: () => setSection('appearance') },
      ],
    },
    {
      title: 'Features',
      items: [
        { icon: Trophy, label: 'Rewards & Points', description: `${profile?.total_points ?? 0} pts · ${profile?.current_streak ?? 0} day streak`, action: () => setSection('rewards') },
        { icon: Puzzle, label: 'Integrations', description: 'Calendar, Gmail, Slack', action: () => setSection('integrations') },
      ],
    },
    {
      title: 'Support',
      items: [
        { icon: HelpCircle, label: 'Help & FAQ', description: 'Get help with TaskGPT', action: () => setSection('help') },
      ],
    },
  ];

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-foreground mb-6">Settings</h1>

      <div className="space-y-6">
        {sections.map((s) => (
          <div key={s.title}>
            <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1">
              {s.title}
            </h2>
            <div className="glass overflow-hidden">
              {s.items.map((item, i) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.label}
                    onClick={item.action}
                    className={`w-full flex items-center gap-4 px-4 py-3.5 hover:bg-secondary/50 transition-colors ${
                      i > 0 ? 'border-t border-border' : ''
                    }`}
                  >
                    <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center text-muted-foreground">
                      <Icon />
                    </div>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-foreground">{item.label}</p>
                      <p className="text-xs text-muted-foreground">{item.description}</p>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground" />
                  </button>
                );
              })}
            </div>
          </div>
        ))}

        <Button
          variant="ghost"
          className="w-full text-destructive hover:bg-destructive/10 gap-2"
          onClick={signOut}
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </Button>
      </div>
    </div>
  );
};

export default SettingsPage;

import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell, Play, Volume2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { requestNotificationPermission, registerServiceWorker, showLocalNotification } from '@/services/notificationService';
import { SOUND_OPTIONS, playSound, playAlarm, type SoundId } from '@/services/alarmSounds';

interface Props {
  onBack: () => void;
}

const NotificationsSection: React.FC<Props> = ({ onBack }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [taskReminders, setTaskReminders] = useState(localStorage.getItem('taskReminders') !== 'false');
  const [dailySummary, setDailySummary] = useState(localStorage.getItem('dailySummary') === 'true');
  const [streakAlerts, setStreakAlerts] = useState(localStorage.getItem('streakAlerts') !== 'false');
  const [alarmMode, setAlarmMode] = useState(localStorage.getItem('alarmMode') === 'true');
  const [sound, setSound] = useState<SoundId>(
    (localStorage.getItem('reminderSound') as SoundId) || 'chime'
  );

  useEffect(() => {
    if ('Notification' in window) setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    const result = await requestNotificationPermission();
    setPermission(result);
    if (result === 'granted') {
      await registerServiceWorker();
      toast.success('Notifications enabled!');
      showLocalNotification('TaskGPT', {
        body: 'You will now receive task reminders 🎉',
        tag: 'welcome',
      });
    } else {
      toast.error('Notification permission denied');
    }
  };

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, String(val));
    setter(val);
    if (val && key !== 'alarmMode' && permission !== 'granted') requestPermission();
  };

  const pickSound = (id: SoundId) => {
    setSound(id);
    localStorage.setItem('reminderSound', id);
    playSound(id);
  };

  const testReminder = () => {
    showLocalNotification('⏰ Test Reminder', {
      body: 'This is what a TaskGPT reminder looks like.',
      tag: 'test-reminder',
      requireInteraction: alarmMode,
    } as NotificationOptions);
    if (alarmMode) {
      const stop = playAlarm(sound, 8000);
      toast('⏰ Alarm playing', {
        description: 'Tap to silence',
        action: { label: 'Silence', onClick: stop },
        duration: 8000,
      });
    } else {
      playSound(sound);
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Notifications</h2>

      {permission !== 'granted' && (
        <div className="glass p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Enable Push Notifications</p>
            <p className="text-xs text-muted-foreground">Real reminders on your phone & desktop</p>
          </div>
          <Button size="sm" onClick={requestPermission} className="gradient-primary text-primary-foreground">Enable</Button>
        </div>
      )}

      {permission === 'granted' && (
        <div className="glass p-3 flex items-center gap-2 text-xs text-primary font-medium">
          <Bell className="w-4 h-4" /> Notifications are active
        </div>
      )}

      <div className="glass overflow-hidden divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Task Reminders</p>
            <p className="text-xs text-muted-foreground">Get notified at task deadlines</p>
          </div>
          <Switch checked={taskReminders} onCheckedChange={v => toggle('taskReminders', v, setTaskReminders)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Alarm Mode</p>
            <p className="text-xs text-muted-foreground">Loop the sound until you dismiss it</p>
          </div>
          <Switch checked={alarmMode} onCheckedChange={v => toggle('alarmMode', v, setAlarmMode)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Daily Summary</p>
            <p className="text-xs text-muted-foreground">Morning overview of today's tasks</p>
          </div>
          <Switch checked={dailySummary} onCheckedChange={v => toggle('dailySummary', v, setDailySummary)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Streak Alerts</p>
            <p className="text-xs text-muted-foreground">Reminders to keep your streak going</p>
          </div>
          <Switch checked={streakAlerts} onCheckedChange={v => toggle('streakAlerts', v, setStreakAlerts)} />
        </div>
      </div>

      {/* Sound picker */}
      <div>
        <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-1 flex items-center gap-2">
          <Volume2 className="w-3 h-3" /> Reminder Sound
        </h3>
        <div className="glass overflow-hidden divide-y divide-border">
          {SOUND_OPTIONS.map((s) => (
            <button
              key={s.id}
              onClick={() => pickSound(s.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
                sound === s.id ? 'bg-primary/10' : 'hover:bg-secondary/50'
              }`}
            >
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                sound === s.id ? 'gradient-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
              }`}>
                <Play className="w-4 h-4" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{s.label}</p>
                <p className="text-xs text-muted-foreground">{s.description}</p>
              </div>
              {sound === s.id && <span className="text-xs text-primary font-medium">Selected</span>}
            </button>
          ))}
        </div>
      </div>

      <Button onClick={testReminder} variant="ai" className="w-full">
        <Bell className="w-4 h-4 mr-1" /> Send test reminder
      </Button>
    </div>
  );
};

export default NotificationsSection;

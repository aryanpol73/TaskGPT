import React, { useState, useEffect } from 'react';
import { ArrowLeft, Bell } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
}

const NotificationsSection: React.FC<Props> = ({ onBack }) => {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [taskReminders, setTaskReminders] = useState(localStorage.getItem('taskReminders') !== 'false');
  const [dailySummary, setDailySummary] = useState(localStorage.getItem('dailySummary') === 'true');
  const [streakAlerts, setStreakAlerts] = useState(localStorage.getItem('streakAlerts') !== 'false');

  useEffect(() => {
    if ('Notification' in window) {
      setPermission(Notification.permission);
    }
  }, []);

  const requestPermission = async () => {
    if ('Notification' in window) {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        toast.success('Notifications enabled!');
        new Notification('TaskGPT', { body: 'You will now receive task reminders 🎉', icon: '/logo.png' });
      }
    }
  };

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, String(val));
    setter(val);
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
            <p className="text-sm font-medium text-foreground">Enable Browser Notifications</p>
            <p className="text-xs text-muted-foreground">Get reminded about your tasks</p>
          </div>
          <Button size="sm" onClick={requestPermission} className="gradient-primary text-primary-foreground">Enable</Button>
        </div>
      )}

      <div className="glass overflow-hidden divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Task Reminders</p>
            <p className="text-xs text-muted-foreground">Get notified before task deadlines</p>
          </div>
          <Switch checked={taskReminders} onCheckedChange={v => toggle('taskReminders', v, setTaskReminders)} />
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
    </div>
  );
};

export default NotificationsSection;

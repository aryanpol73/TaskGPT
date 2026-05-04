import { useEffect, useRef } from 'react';
import { useTasks } from '@/hooks/useTasks';
import { showLocalNotification } from '@/services/notificationService';
import { playAlarm, type SoundId } from '@/services/alarmSounds';
import { toast } from 'sonner';

const FIRED_KEY = 'taskgpt_fired_reminders';

const getFired = (): Set<string> => {
  try {
    const raw = localStorage.getItem(FIRED_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch { return new Set(); }
};
const saveFired = (s: Set<string>) =>
  localStorage.setItem(FIRED_KEY, JSON.stringify(Array.from(s).slice(-200)));

export function useTaskReminders() {
  const { data: tasks } = useTasks();
  const timers = useRef<number[]>([]);

  useEffect(() => {
    // clear previous timers
    timers.current.forEach((t) => clearTimeout(t));
    timers.current = [];

    if (!tasks) return;
    if (localStorage.getItem('taskReminders') === 'false') return;

    const sound = (localStorage.getItem('reminderSound') as SoundId) || 'chime';
    const alarmMode = localStorage.getItem('alarmMode') === 'true';
    const fired = getFired();

    tasks.forEach((task) => {
      if (task.status !== 'pending') return;
      const when = task.reminder_at || task.due_date;
      if (!when) return;
      const trigger = new Date(when).getTime();
      const delay = trigger - Date.now();
      if (delay < -60_000 || delay > 24 * 60 * 60 * 1000) return; // skip far future / old
      if (fired.has(task.id + '@' + when)) return;

      const fire = () => {
        fired.add(task.id + '@' + when);
        saveFired(fired);
        showLocalNotification(`⏰ ${task.title}`, {
          body: task.description || 'Reminder for your task',
          tag: `task-${task.id}`,
          requireInteraction: alarmMode,
        });
        if (alarmMode) {
          const stop = playAlarm(sound, 20000);
          toast(`⏰ ${task.title}`, {
            description: 'Tap to silence',
            action: { label: 'Silence', onClick: stop },
            duration: 20000,
          });
        } else {
          import('@/services/alarmSounds').then(({ playSound }) => playSound(sound));
        }
      };

      if (delay <= 0) {
        fire();
      } else {
        const id = window.setTimeout(fire, delay);
        timers.current.push(id);
      }
    });

    return () => {
      timers.current.forEach((t) => clearTimeout(t));
      timers.current = [];
    };
  }, [tasks]);
}

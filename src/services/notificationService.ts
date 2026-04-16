// Push notification utilities for TaskGPT

export async function registerServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service workers not supported');
    return null;
  }
  try {
    const registration = await navigator.serviceWorker.register('/sw.js');
    return registration;
  } catch (err) {
    console.error('SW registration failed:', err);
    return null;
  }
}

export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) return 'denied';
  if (Notification.permission === 'granted') return 'granted';
  return await Notification.requestPermission();
}

export function scheduleTaskReminder(task: {
  id: string;
  title: string;
  due_date?: string | null;
  reminder_at?: string | null;
}) {
  const reminderTime = task.reminder_at || task.due_date;
  if (!reminderTime) return;

  const triggerAt = new Date(reminderTime).getTime();
  const now = Date.now();
  const delay = triggerAt - now;

  // If due in past or more than 24h away, skip scheduling in-browser
  if (delay < 0 || delay > 24 * 60 * 60 * 1000) return;

  setTimeout(() => {
    showLocalNotification(`Task Reminder: ${task.title}`, {
      body: `Your task "${task.title}" is due now!`,
      tag: `task-${task.id}`,
    });
  }, delay);
}

export function showLocalNotification(title: string, options?: NotificationOptions) {
  if (Notification.permission !== 'granted') return;

  // Try service worker notification first (works in background)
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        icon: '/logo.png',
        badge: '/logo.png',
        vibrate: [200, 100, 200],
        ...options,
      });
    }).catch(() => {
      // Fallback to regular notification
      new Notification(title, { icon: '/logo.png', ...options });
    });
  } else {
    new Notification(title, { icon: '/logo.png', ...options });
  }
}

export function showStreakReminder(currentStreak: number) {
  showLocalNotification('🔥 Keep your streak going!', {
    body: `You're on a ${currentStreak}-day streak! Complete a task today to keep it alive.`,
    tag: 'streak-reminder',
  });
}

export function showPointsNotification(points: number, reason: string) {
  showLocalNotification(`🎉 +${points} points!`, {
    body: reason,
    tag: 'points-earned',
  });
}

export function showDailySummary(taskCount: number) {
  showLocalNotification('📋 Daily Summary', {
    body: `You have ${taskCount} task${taskCount !== 1 ? 's' : ''} due today. Let's get things done!`,
    tag: 'daily-summary',
  });
}

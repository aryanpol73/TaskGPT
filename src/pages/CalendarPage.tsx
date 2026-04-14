import React from 'react';
import { Calendar, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const CalendarPage: React.FC = () => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  const monthName = today.toLocaleString('default', { month: 'long', year: 'numeric' });

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">{monthName}</h1>
          <p className="text-sm text-muted-foreground">Manage your schedule with AI</p>
        </div>
        <Button variant="ai" size="sm" className="gap-2">
          <Plus className="w-4 h-4" /> Add Event
        </Button>
      </div>

      {/* Calendar grid */}
      <div className="glass p-4">
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
            <div key={d} className="text-center text-xs font-medium text-muted-foreground py-2">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1">
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`e-${i}`} className="aspect-square" />
          ))}
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
            <button
              key={day}
              className={`aspect-square rounded-xl text-sm flex items-center justify-center transition-all ${
                day === today.getDate()
                  ? 'gradient-primary text-primary-foreground font-bold shadow-md'
                  : 'text-foreground hover:bg-secondary'
              }`}
            >
              {day}
            </button>
          ))}
        </div>
      </div>

      {/* Placeholder */}
      <div className="glass-subtle mt-6 p-6 text-center">
        <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">
          Connect Google Calendar to sync events and let AI schedule tasks for you.
        </p>
        <Button variant="glass" className="mt-4" disabled>
          Connect Google Calendar (Coming Soon)
        </Button>
      </div>
    </div>
  );
};

export default CalendarPage;

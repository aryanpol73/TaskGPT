import React, { useState } from 'react';
import { Calendar, Plus, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGoogleConnected, useCalendarEvents, useCreateCalendarEvent } from '@/hooks/useGoogleApi';
import { toast } from 'sonner';

const CalendarPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showCreate, setShowCreate] = useState(false);
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventStartTime, setEventStartTime] = useState('09:00');
  const [eventEndTime, setEventEndTime] = useState('10:00');

  const { data: isConnected, isLoading: checkingConnection } = useGoogleConnected();

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });

  const timeMin = new Date(year, month, 1).toISOString();
  const timeMax = new Date(year, month + 1, 0, 23, 59, 59).toISOString();

  const { data: calendarData, isLoading: loadingEvents } = useCalendarEvents(!!isConnected, timeMin, timeMax);
  const createEvent = useCreateCalendarEvent();

  const events = calendarData?.items || [];

  const getEventsForDay = (day: number) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return events.filter((e: any) => {
      const start = e.start?.dateTime || e.start?.date || '';
      return start.startsWith(dateStr);
    });
  };

  const today = new Date();
  const isToday = (day: number) => day === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const handleCreateEvent = async () => {
    if (!eventTitle.trim()) {
      toast.error('Please enter an event title');
      return;
    }
    const dateToUse = eventDate || `${year}-${String(month + 1).padStart(2, '0')}-${String(selectedDay || today.getDate()).padStart(2, '0')}`;
    try {
      await createEvent.mutateAsync({
        summary: eventTitle,
        start: `${dateToUse}T${eventStartTime}:00`,
        end: `${dateToUse}T${eventEndTime}:00`,
      });
      toast.success('Event created!');
      setShowCreate(false);
      setEventTitle('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to create event');
    }
  };

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={prevMonth}><ChevronLeft className="w-4 h-4" /></Button>
          <h1 className="text-2xl font-bold text-foreground">{monthName}</h1>
          <Button variant="ghost" size="icon" onClick={nextMonth}><ChevronRight className="w-4 h-4" /></Button>
        </div>
        {isConnected && (
          <Dialog open={showCreate} onOpenChange={setShowCreate}>
            <DialogTrigger asChild>
              <Button variant="ai" size="sm" className="gap-2">
                <Plus className="w-4 h-4" /> Add Event
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader><DialogTitle>New Calendar Event</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-2">
                <Input placeholder="Event title" value={eventTitle} onChange={e => setEventTitle(e.target.value)} className="bg-secondary/50" />
                <Input type="date" value={eventDate} onChange={e => setEventDate(e.target.value)} className="bg-secondary/50" />
                <div className="flex gap-2">
                  <Input type="time" value={eventStartTime} onChange={e => setEventStartTime(e.target.value)} className="bg-secondary/50" />
                  <span className="flex items-center text-muted-foreground">to</span>
                  <Input type="time" value={eventEndTime} onChange={e => setEventEndTime(e.target.value)} className="bg-secondary/50" />
                </div>
                <Button variant="ai" className="w-full" onClick={handleCreateEvent} disabled={createEvent.isPending}>
                  {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                  Create Event
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {!isConnected && !checkingConnection && (
        <div className="glass-subtle p-6 text-center mb-6">
          <Calendar className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Connect Google Calendar</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Sign in with Google to sync your calendar events. Go to Settings → Integrations.
          </p>
        </div>
      )}

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
          {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
            const dayEvents = getEventsForDay(day);
            return (
              <button
                key={day}
                onClick={() => setSelectedDay(selectedDay === day ? null : day)}
                className={`aspect-square rounded-xl text-sm flex flex-col items-center justify-center transition-all relative ${
                  isToday(day)
                    ? 'gradient-primary text-primary-foreground font-bold shadow-md'
                    : selectedDay === day
                    ? 'bg-secondary ring-2 ring-primary'
                    : 'text-foreground hover:bg-secondary'
                }`}
              >
                {day}
                {dayEvents.length > 0 && (
                  <div className="flex gap-0.5 mt-0.5">
                    {dayEvents.slice(0, 3).map((_: any, idx: number) => (
                      <div key={idx} className="w-1 h-1 rounded-full bg-primary" />
                    ))}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Day events */}
      {selectedDay && isConnected && (
        <div className="mt-4 space-y-2">
          <h3 className="text-sm font-semibold text-foreground">
            Events for {monthName.split(' ')[0]} {selectedDay}
          </h3>
          {loadingEvents ? (
            <div className="glass-subtle p-4 text-center"><Loader2 className="w-5 h-5 animate-spin mx-auto text-muted-foreground" /></div>
          ) : getEventsForDay(selectedDay).length === 0 ? (
            <div className="glass-subtle p-4 text-center text-sm text-muted-foreground">No events</div>
          ) : (
            getEventsForDay(selectedDay).map((event: any) => {
              const startTime = event.start?.dateTime
                ? new Date(event.start.dateTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                : 'All day';
              return (
                <div key={event.id} className="glass p-3 flex items-center gap-3">
                  <div className="w-1 h-8 rounded-full bg-primary" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">{event.summary}</p>
                    <p className="text-xs text-muted-foreground">{startTime}</p>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
};

export default CalendarPage;

import React, { useState } from 'react';
import { Mail, Inbox, Send, Star, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useGoogleConnected, useGmailMessages, useSendEmail } from '@/hooks/useGoogleApi';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';

const MailPage: React.FC = () => {
  const [showCompose, setShowCompose] = useState(false);
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [selectedMessage, setSelectedMessage] = useState<any>(null);

  const { data: isConnected, isLoading: checkingConnection } = useGoogleConnected();
  const { data: gmailData, isLoading: loadingMail } = useGmailMessages(!!isConnected);
  const sendEmail = useSendEmail();
  const queryClient = useQueryClient();

  const messages = gmailData?.messages || [];
  const unreadCount = messages.filter((m: any) => m.isUnread).length;

  const handleSend = async () => {
    if (!to.trim() || !subject.trim()) {
      toast.error('Please fill in To and Subject');
      return;
    }
    try {
      await sendEmail.mutateAsync({ to, subject, body });
      toast.success('Email sent!');
      setShowCompose(false);
      setTo('');
      setSubject('');
      setBody('');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send email');
    }
  };

  if (!isConnected && !checkingConnection) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-6">Mail</h1>
        <div className="glass-subtle p-8 text-center">
          <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-foreground mb-2">Connect Gmail</h2>
          <p className="text-muted-foreground text-sm mb-4">
            Sign in with Google to access your Gmail. Go to Settings → Integrations to connect.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mail</h1>
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="icon" onClick={() => queryClient.invalidateQueries({ queryKey: ['gmail-messages'] })}>
            <RefreshCw className="w-4 h-4" />
          </Button>
          <Dialog open={showCompose} onOpenChange={setShowCompose}>
            <DialogTrigger asChild>
              <Button variant="ai" size="sm" className="gap-2">
                <Send className="w-4 h-4" /> Compose
              </Button>
            </DialogTrigger>
            <DialogContent className="glass-strong">
              <DialogHeader><DialogTitle>New Email</DialogTitle></DialogHeader>
              <div className="space-y-3 pt-2">
                <Input placeholder="To" value={to} onChange={e => setTo(e.target.value)} className="bg-secondary/50" />
                <Input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)} className="bg-secondary/50" />
                <Textarea placeholder="Write your email..." value={body} onChange={e => setBody(e.target.value)} className="bg-secondary/50 min-h-[150px]" />
                <Button variant="ai" className="w-full" onClick={handleSend} disabled={sendEmail.isPending}>
                  {sendEmail.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Send className="w-4 h-4 mr-2" />}
                  Send
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Quick stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Inbox, label: 'Inbox', count: messages.length },
          { icon: Star, label: 'Unread', count: unreadCount },
          { icon: Send, label: 'Total', count: gmailData?.resultSizeEstimate || 0 },
        ].map((item) => (
          <div key={item.label} className="glass p-4 text-center">
            <item.icon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold text-foreground">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Messages */}
      {loadingMail ? (
        <div className="glass-subtle p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-muted-foreground" />
          <p className="text-sm text-muted-foreground mt-2">Loading emails...</p>
        </div>
      ) : messages.length === 0 ? (
        <div className="glass-subtle p-8 text-center">
          <Mail className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground text-sm">No messages found</p>
        </div>
      ) : (
        <div className="space-y-1">
          {messages.map((msg: any) => (
            <button
              key={msg.id}
              onClick={() => setSelectedMessage(selectedMessage?.id === msg.id ? null : msg)}
              className={`w-full text-left glass p-3 flex items-start gap-3 transition-colors hover:bg-secondary/50 ${
                msg.isUnread ? 'border-l-2 border-primary' : ''
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className={`text-sm truncate ${msg.isUnread ? 'font-semibold text-foreground' : 'text-foreground'}`}>
                    {msg.from?.split('<')[0]?.trim() || msg.from}
                  </p>
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                    {msg.date ? new Date(msg.date).toLocaleDateString([], { month: 'short', day: 'numeric' }) : ''}
                  </span>
                </div>
                <p className="text-xs font-medium text-foreground/80 truncate">{msg.subject || '(no subject)'}</p>
                <p className="text-xs text-muted-foreground truncate">{msg.snippet}</p>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default MailPage;

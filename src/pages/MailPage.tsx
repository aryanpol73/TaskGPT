import React from 'react';
import { Mail, Inbox, Send, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';

const MailPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mail</h1>
          <p className="text-sm text-muted-foreground">AI-powered email management</p>
        </div>
        <Button variant="ai" size="sm" className="gap-2">
          <Send className="w-4 h-4" /> Compose
        </Button>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { icon: Inbox, label: 'Inbox', count: 0 },
          { icon: Star, label: 'Starred', count: 0 },
          { icon: Send, label: 'Sent', count: 0 },
        ].map((item) => (
          <div key={item.label} className="glass p-4 text-center">
            <item.icon className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-xs text-muted-foreground">{item.label}</p>
            <p className="text-lg font-bold text-foreground">{item.count}</p>
          </div>
        ))}
      </div>

      {/* Placeholder */}
      <div className="glass-subtle p-8 text-center">
        <Mail className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-lg font-semibold text-foreground mb-2">Connect Gmail</h2>
        <p className="text-muted-foreground text-sm mb-4">
          Let AI draft, summarize, and manage your emails. Connect your Gmail to get started.
        </p>
        <Button variant="glass" disabled>
          Connect Gmail (Coming Soon)
        </Button>
      </div>
    </div>
  );
};

export default MailPage;

import React from 'react';
import { ArrowLeft, ExternalLink, Check, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleConnected } from '@/hooks/useGoogleApi';
import { lovable } from '@/integrations/lovable/index';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
}

const IntegrationsSection: React.FC<Props> = ({ onBack }) => {
  const { data: isGoogleConnected, isLoading } = useGoogleConnected();
  const [connecting, setConnecting] = React.useState(false);

  const handleGoogleConnect = async () => {
    setConnecting(true);
    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: window.location.origin,
        extraParams: {
          access_type: 'offline',
          prompt: 'consent',
          scope: 'https://www.googleapis.com/auth/gmail.readonly https://www.googleapis.com/auth/gmail.send https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/calendar.events',
        },
      });

      if (result.error) {
        toast.error('Connection failed. Please try again.');
      }

      if (result.redirected) {
        return;
      }
    } catch {
      toast.error('Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const integrations = [
    {
      name: 'Google Calendar',
      description: 'Sync tasks and events with your Google Calendar',
      icon: '📅',
      connected: !!isGoogleConnected,
      onConnect: handleGoogleConnect,
    },
    {
      name: 'Gmail',
      description: 'Send and manage emails from TaskGPT',
      icon: '📧',
      connected: !!isGoogleConnected,
      onConnect: handleGoogleConnect,
    },
    {
      name: 'Slack',
      description: 'Get task notifications in Slack channels',
      icon: '💬',
      connected: false,
      onConnect: () => toast.info('Slack integration coming soon!'),
    },
    {
      name: 'Notion',
      description: 'Import tasks and notes from Notion',
      icon: '📝',
      connected: false,
      onConnect: () => toast.info('Notion integration coming soon!'),
    },
  ];

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Integrations</h2>

      <div className="space-y-3">
        {integrations.map(int => (
          <div key={int.name} className="glass p-4 flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary flex items-center justify-center text-xl">
              {int.icon}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">{int.name}</p>
              <p className="text-xs text-muted-foreground">{int.description}</p>
            </div>
            {int.connected ? (
              <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                <Check className="w-3.5 h-3.5" />
                Connected
              </div>
            ) : (
              <Button
                size="sm"
                variant="outline"
                className="gap-1.5 text-xs glass-subtle border-border"
                onClick={int.onConnect}
                disabled={isLoading || connecting}
              >
                {connecting ? <Loader2 className="w-3 h-3 animate-spin" /> : <ExternalLink className="w-3 h-3" />}
                Connect
              </Button>
            )}
          </div>
        ))}
      </div>

      {isGoogleConnected && (
        <p className="text-xs text-muted-foreground">
          Gmail and Google Calendar are connected through your Google account.
        </p>
      )}
    </div>
  );
};

export default IntegrationsSection;

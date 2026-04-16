import React, { useEffect } from 'react';
import { ArrowLeft, ExternalLink, Check, Loader2, Unplug } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useGoogleConnected } from '@/hooks/useGoogleApi';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';

interface Props {
  onBack: () => void;
}

const IntegrationsSection: React.FC<Props> = ({ onBack }) => {
  const { data: isGoogleConnected, isLoading, refetch } = useGoogleConnected();
  const [connecting, setConnecting] = React.useState(false);
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();

  // Handle OAuth callback code
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code) return;

    const exchangeCode = async () => {
      setConnecting(true);
      try {
        const redirectUri = `${window.location.origin}/settings?section=integrations`;
        const { data, error } = await supabase.functions.invoke('google-connect', {
          body: { action: 'exchange_code', code, redirect_uri: redirectUri },
        });

        if (error || data?.error) {
          toast.error(data?.error || 'Failed to connect Google services');
        } else {
          toast.success('Google services connected successfully!');
          queryClient.invalidateQueries({ queryKey: ['google-connected'] });
          refetch();
        }
      } catch {
        toast.error('Failed to connect Google services');
      } finally {
        setConnecting(false);
        // Clean up URL
        searchParams.delete('code');
        searchParams.delete('state');
        searchParams.delete('scope');
        setSearchParams(searchParams, { replace: true });
      }
    };

    exchangeCode();
  }, [searchParams]);

  const handleGoogleConnect = async () => {
    setConnecting(true);
    try {
      const redirectUri = `${window.location.origin}/settings?section=integrations`;
      const { data, error } = await supabase.functions.invoke('google-connect', {
        body: { action: 'get_auth_url', redirect_uri: redirectUri },
      });

      if (error || data?.error) {
        toast.error('Failed to start Google connection');
        setConnecting(false);
        return;
      }

      // Redirect to Google OAuth
      window.location.href = data.url;
    } catch {
      toast.error('Failed to connect');
      setConnecting(false);
    }
  };

  const handleGoogleDisconnect = async () => {
    try {
      await supabase.functions.invoke('google-connect', {
        body: { action: 'disconnect' },
      });
      toast.success('Google services disconnected');
      queryClient.invalidateQueries({ queryKey: ['google-connected'] });
      refetch();
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  const integrations = [
    {
      name: 'Google Calendar',
      description: 'Sync tasks and events with your Google Calendar',
      icon: '📅',
      connected: !!isGoogleConnected,
      onConnect: handleGoogleConnect,
      onDisconnect: handleGoogleDisconnect,
    },
    {
      name: 'Gmail',
      description: 'Send and manage emails from TaskGPT',
      icon: '📧',
      connected: !!isGoogleConnected,
      onConnect: handleGoogleConnect,
      onDisconnect: handleGoogleDisconnect,
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

      {connecting && (
        <div className="glass-subtle p-4 flex items-center gap-3">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Connecting to Google services...</p>
        </div>
      )}

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
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5 text-xs text-primary font-medium">
                  <Check className="w-3.5 h-3.5" />
                  Connected
                </div>
                {int.onDisconnect && (
                  <Button
                    size="sm"
                    variant="ghost"
                    className="text-xs text-muted-foreground hover:text-destructive"
                    onClick={int.onDisconnect}
                  >
                    <Unplug className="w-3 h-3" />
                  </Button>
                )}
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

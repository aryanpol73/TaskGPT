import React from 'react';
import { ArrowLeft, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface Props {
  onBack: () => void;
}

const integrations = [
  {
    name: 'Google Calendar',
    description: 'Sync tasks and events with your Google Calendar',
    icon: '📅',
    connected: false,
  },
  {
    name: 'Gmail',
    description: 'Send and manage emails from TaskGPT',
    icon: '📧',
    connected: false,
  },
  {
    name: 'Slack',
    description: 'Get task notifications in Slack channels',
    icon: '💬',
    connected: false,
  },
  {
    name: 'Notion',
    description: 'Import tasks and notes from Notion',
    icon: '📝',
    connected: false,
  },
];

const IntegrationsSection: React.FC<Props> = ({ onBack }) => {
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
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5 text-xs glass-subtle border-border"
              onClick={() => toast.info(`${int.name} integration coming soon!`)}
            >
              <ExternalLink className="w-3 h-3" />
              Connect
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default IntegrationsSection;

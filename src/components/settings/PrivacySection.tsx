import React from 'react';
import { ArrowLeft, Download, Trash2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Props {
  onBack: () => void;
}

const PrivacySection: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const [analyticsEnabled, setAnalyticsEnabled] = React.useState(localStorage.getItem('analytics') !== 'false');

  const exportData = async () => {
    if (!user) return;
    const { data } = await supabase.from('tasks').select('*').eq('user_id', user.id);
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskgpt-export-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data exported!');
  };

  const clearCompletedTasks = async () => {
    if (!user) return;
    const { error } = await supabase.from('tasks').delete().eq('user_id', user.id).eq('status', 'completed');
    if (error) {
      toast.error('Failed to clear tasks');
    } else {
      toast.success('Completed tasks cleared');
    }
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Privacy & Security</h2>

      <div className="glass overflow-hidden divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center">
              <Shield className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium text-foreground">Usage Analytics</p>
              <p className="text-xs text-muted-foreground">Help improve TaskGPT</p>
            </div>
          </div>
          <Switch checked={analyticsEnabled} onCheckedChange={v => { localStorage.setItem('analytics', String(v)); setAnalyticsEnabled(v); }} />
        </div>
      </div>

      <div className="space-y-3">
        <Button variant="outline" className="w-full gap-2 glass border-border" onClick={exportData}>
          <Download className="w-4 h-4" /> Export My Data
        </Button>
        <Button variant="outline" className="w-full gap-2 glass border-border text-destructive hover:bg-destructive/10" onClick={clearCompletedTasks}>
          <Trash2 className="w-4 h-4" /> Clear Completed Tasks
        </Button>
      </div>
    </div>
  );
};

export default PrivacySection;

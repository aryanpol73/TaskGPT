import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';

interface Props {
  onBack: () => void;
}

const AppearanceSection: React.FC<Props> = ({ onBack }) => {
  const [reducedMotion, setReducedMotion] = useState(localStorage.getItem('reducedMotion') === 'true');
  const [compactMode, setCompactMode] = useState(localStorage.getItem('compactMode') === 'true');

  const toggle = (key: string, val: boolean, setter: (v: boolean) => void) => {
    localStorage.setItem(key, String(val));
    setter(val);
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Appearance</h2>

      <div className="glass overflow-hidden divide-y divide-border">
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <p className="text-sm font-medium text-foreground">Dark Mode</p>
            <p className="text-xs text-muted-foreground">Always on — it's the TaskGPT way</p>
          </div>
          <Switch checked disabled />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <Label className="text-sm font-medium text-foreground">Reduced Motion</Label>
            <p className="text-xs text-muted-foreground">Minimize animations</p>
          </div>
          <Switch checked={reducedMotion} onCheckedChange={v => toggle('reducedMotion', v, setReducedMotion)} />
        </div>
        <div className="flex items-center justify-between px-4 py-3.5">
          <div>
            <Label className="text-sm font-medium text-foreground">Compact Mode</Label>
            <p className="text-xs text-muted-foreground">Smaller spacing between tasks</p>
          </div>
          <Switch checked={compactMode} onCheckedChange={v => toggle('compactMode', v, setCompactMode)} />
        </div>
      </div>
    </div>
  );
};

export default AppearanceSection;

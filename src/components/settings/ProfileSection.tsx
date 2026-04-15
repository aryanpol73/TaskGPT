import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { AVATAR_OPTIONS } from '@/types/profile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ArrowLeft, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Props {
  onBack: () => void;
}

const ProfileSection: React.FC<Props> = ({ onBack }) => {
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const [displayName, setDisplayName] = useState(profile?.display_name || '');
  const [selectedAvatar, setSelectedAvatar] = useState(profile?.selected_avatar || 'default');

  const currentAvatar = AVATAR_OPTIONS.find(a => a.id === (profile?.selected_avatar || 'default'));

  const handleSave = () => {
    updateProfile.mutate({ display_name: displayName, selected_avatar: selectedAvatar });
  };

  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>

      <h2 className="text-xl font-bold text-foreground">Profile</h2>

      {/* Current Avatar Display */}
      <div className="flex flex-col items-center gap-3">
        <div className="w-20 h-20 rounded-full gradient-primary flex items-center justify-center text-4xl">
          {currentAvatar?.emoji || '😊'}
        </div>
        <p className="text-sm text-muted-foreground">{user?.email}</p>
      </div>

      {/* Avatar Selection */}
      <div>
        <Label className="text-sm font-medium text-foreground mb-3 block">Choose Avatar</Label>
        <div className="grid grid-cols-6 gap-3">
          {AVATAR_OPTIONS.map(avatar => (
            <button
              key={avatar.id}
              onClick={() => setSelectedAvatar(avatar.id)}
              className={cn(
                'w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-all hover:scale-110',
                selectedAvatar === avatar.id
                  ? 'glass-strong ring-2 ring-primary'
                  : 'glass-subtle hover:glass'
              )}
            >
              {avatar.emoji}
            </button>
          ))}
        </div>
      </div>

      {/* Display Name */}
      <div>
        <Label htmlFor="displayName" className="text-sm font-medium text-foreground">Display Name</Label>
        <Input
          id="displayName"
          value={displayName}
          onChange={e => setDisplayName(e.target.value)}
          placeholder="Enter your name"
          className="mt-1.5 glass-subtle border-border"
        />
      </div>

      <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground" disabled={updateProfile.isPending}>
        <Check className="w-4 h-4 mr-2" />
        {updateProfile.isPending ? 'Saving...' : 'Save Profile'}
      </Button>
    </div>
  );
};

export default ProfileSection;

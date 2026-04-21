import React from 'react';
import AiAssistant from '@/components/AiAssistant';
import taskPilotLogo from '@/assets/taskpilot-logo.png';

const AiPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6 flex items-center gap-3">
        <img
          src={taskPilotLogo}
          alt="TaskPilot"
          width={48}
          height={48}
          loading="lazy"
          className="w-12 h-12 rounded-xl ai-glow"
        />
        <div>
          <h1 className="text-2xl font-bold text-foreground">TaskPilot</h1>
          <p className="text-sm text-muted-foreground">
            Your AI co-pilot — create tasks, plan your day, and get productivity tips
          </p>
        </div>
      </div>
      <AiAssistant inline />
    </div>
  );
};

export default AiPage;


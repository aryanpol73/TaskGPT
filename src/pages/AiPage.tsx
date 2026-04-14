import React from 'react';
import AiAssistant from '@/components/AiAssistant';

const AiPage: React.FC = () => {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">AI Assistant</h1>
        <p className="text-sm text-muted-foreground">
          Chat with TaskGPT to create tasks, get productivity tips, and more
        </p>
      </div>
      <AiAssistant inline />
    </div>
  );
};

export default AiPage;

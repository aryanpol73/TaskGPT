import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Sparkles, Send, X, Loader2 } from 'lucide-react';
import { useCreateTask } from '@/hooks/useTasks';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AiMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface AiAssistantProps {
  inline?: boolean;
}

const AiAssistant: React.FC<AiAssistantProps> = ({ inline = false }) => {
  const [open, setOpen] = useState(inline);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<AiMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const createTask = useCreateTask();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    const newMessages: AiMessage[] = [...messages, { role: 'user', content: userMsg }];
    setMessages(newMessages);
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-assistant', {
        body: { messages: newMessages },
      });

      if (error) throw error;

      const assistantContent = data?.content || 'Sorry, I could not process that.';
      setMessages(prev => [...prev, { role: 'assistant', content: assistantContent }]);

      // If AI created tasks, handle them
      if (data?.tasks && Array.isArray(data.tasks)) {
        for (const task of data.tasks) {
          await createTask.mutateAsync(task);
        }
        if (data.tasks.length > 0) {
          toast.success(`Created ${data.tasks.length} task${data.tasks.length > 1 ? 's' : ''}`);
        }
      }
    } catch (err: any) {
      console.error('AI error:', err);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Something went wrong. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  if (!open && !inline) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-xl animate-float ai-glow z-50 transition-transform hover:scale-110"
        aria-label="Open AI Assistant"
      >
        <Sparkles className="w-6 h-6 text-primary-foreground" />
      </button>
    );
  }

  if (!open) return null;

  return (
    <div className={cn(
      inline
        ? 'w-full glass-strong flex flex-col rounded-2xl'
        : 'fixed bottom-6 right-6 w-[380px] max-h-[520px] glass-strong flex flex-col z-50 animate-slide-up shadow-2xl'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-primary-foreground" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI Assistant</h3>
            <p className="text-xs text-muted-foreground">Ask me anything about your tasks</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="text-muted-foreground hover:text-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 min-h-[200px] max-h-[340px]">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Sparkles className="w-8 h-8 text-primary mx-auto mb-3 animate-pulse-glow" />
            <p className="text-muted-foreground text-sm">
              Try: "Add a task to review PR tomorrow"
            </p>
            <p className="text-muted-foreground/50 text-xs mt-1">
              or "What should I focus on today?"
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={i}
            className={cn(
              'text-sm px-3 py-2 rounded-xl max-w-[85%]',
              msg.role === 'user'
                ? 'ml-auto gradient-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground'
            )}
          >
            {msg.content}
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Loader2 className="w-4 h-4 animate-spin" />
            Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/50">
        <form
          onSubmit={(e) => { e.preventDefault(); handleSend(); }}
          className="flex items-center gap-2"
        >
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask the AI..."
            className="bg-secondary/50 border-none focus-visible:ring-1 focus-visible:ring-primary text-sm"
            disabled={loading}
          />
          <Button type="submit" variant="ai" size="icon" disabled={loading || !input.trim()}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default AiAssistant;

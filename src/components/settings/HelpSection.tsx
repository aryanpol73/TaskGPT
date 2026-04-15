import React from 'react';
import { ArrowLeft, MessageCircle, FileText, Bug } from 'lucide-react';

interface Props {
  onBack: () => void;
}

const faqs = [
  { q: 'How do I earn points?', a: 'Complete tasks to earn 10 points each. Maintain daily streaks for bonus points!' },
  { q: 'What are streaks?', a: 'Complete at least one task every day to build your streak. Longer streaks earn bigger rewards.' },
  { q: 'How does the AI assistant work?', a: 'Go to the AI tab and ask anything — it can help you plan tasks, draft emails, and schedule events.' },
  { q: 'Can I connect Gmail/Calendar?', a: 'Coming soon! Integration setup will be available in Settings > Integrations.' },
  { q: 'How do I set reminders?', a: 'When creating or editing a task, set a reminder time. You\'ll get a browser notification.' },
];

const HelpSection: React.FC<Props> = ({ onBack }) => {
  return (
    <div className="space-y-6">
      <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
      <h2 className="text-xl font-bold text-foreground">Help & FAQ</h2>

      <div className="space-y-3">
        {faqs.map((faq, i) => (
          <details key={i} className="glass group">
            <summary className="px-4 py-3 cursor-pointer text-sm font-medium text-foreground flex items-center justify-between">
              {faq.q}
              <span className="text-muted-foreground group-open:rotate-180 transition-transform">▾</span>
            </summary>
            <div className="px-4 pb-3 text-sm text-muted-foreground">{faq.a}</div>
          </details>
        ))}
      </div>

      <div className="glass p-4 space-y-3">
        <h3 className="text-sm font-medium text-foreground">Need more help?</h3>
        <div className="flex gap-2">
          <button className="flex-1 glass-subtle px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <MessageCircle className="w-4 h-4" /> Contact
          </button>
          <button className="flex-1 glass-subtle px-3 py-2.5 rounded-xl flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
            <Bug className="w-4 h-4" /> Report Bug
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpSection;

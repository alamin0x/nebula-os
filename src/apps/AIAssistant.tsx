import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { useWindowStore } from '../stores/windowStore';
import { useMusicStore } from '../stores/musicStore';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

const PREDEFINED_RESPONSES: Record<string, string> = {
  hello: "Hello! I'm Nebula AI, your virtual assistant. How can I help you today?",
  hi: "Hey there! Welcome to Nebula OS. What can I do for you?",
  hey: "Hey! I'm here to help. Try asking me about available commands or say 'help'.",
  help: "Here are some things I can do:\n• Open apps: \"open notes\", \"open terminal\", \"open music\"\n• Play music: \"play music\"\n• Get info: \"about\", \"commands\"\n• Just chat with me!",
  about: "I'm Nebula AI, the built-in assistant for Nebula OS. I can help you navigate the system, open applications, and answer questions about this environment.",
  commands: "Available commands:\n• \"open notes\" — Open the Notes app\n• \"open terminal\" — Open the Terminal\n• \"open music\" — Open the Music Player\n• \"open monitor\" — Open System Monitor\n• \"play music\" — Start music playback\n• \"help\" — Show this help\n• \"about\" — Learn about me",
  thanks: "You're welcome! Let me know if there's anything else I can help with.",
  'thank you': "Happy to help! Feel free to ask anything else.",
};

const FALLBACK_RESPONSES = [
  "I'm not sure I understand that. Try typing 'help' to see what I can do!",
  "Hmm, I don't have a response for that. Type 'commands' to see available actions.",
  "I'm still learning! Try 'help' for a list of things I can assist with.",
  "That's beyond my current capabilities. Type 'help' to see what I can do for you.",
];

function getResponse(input: string): { content: string; action?: () => void } {
  const normalized = input.toLowerCase().trim();

  // Check predefined responses
  for (const [key, response] of Object.entries(PREDEFINED_RESPONSES)) {
    if (normalized === key || normalized.includes(key)) {
      return { content: response };
    }
  }

  // Command recognition
  if (normalized.includes('open notes') || normalized === 'notes') {
    return {
      content: '📝 Opening Notes app for you...',
      action: () => useWindowStore.getState().openWindow('notes'),
    };
  }

  if (normalized.includes('open terminal') || normalized === 'terminal') {
    return {
      content: '💻 Opening Terminal...',
      action: () => useWindowStore.getState().openWindow('terminal'),
    };
  }

  if (normalized.includes('open music') || normalized.includes('open player')) {
    return {
      content: '🎵 Opening Music Player...',
      action: () => useWindowStore.getState().openWindow('music-player'),
    };
  }

  if (normalized.includes('open monitor') || normalized.includes('system monitor')) {
    return {
      content: '📊 Opening System Monitor...',
      action: () => useWindowStore.getState().openWindow('system-monitor'),
    };
  }

  if (normalized.includes('play music') || normalized === 'play') {
    return {
      content: '🎶 Starting music playback...',
      action: () => {
        useWindowStore.getState().openWindow('music-player');
        useMusicStore.getState().play();
      },
    };
  }

  // Fallback
  const fallback = FALLBACK_RESPONSES[Math.floor(Math.random() * FALLBACK_RESPONSES.length)];
  return { content: fallback };
}

const MessageBubble = memo(function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}>
      <div
        className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-wrap ${
          isUser
            ? 'bg-[var(--theme-primary)] text-white rounded-br-sm'
            : 'bg-[var(--theme-surface)] text-[var(--theme-text)] rounded-bl-sm border border-[var(--theme-primary)]/20'
        }`}
      >
        {message.content}
      </div>
    </div>
  );
});

const TypingIndicator = memo(function TypingIndicator() {
  return (
    <div className="flex justify-start mb-3">
      <div className="bg-[var(--theme-surface)] border border-[var(--theme-primary)]/20 px-4 py-3 rounded-2xl rounded-bl-sm">
        <div className="flex gap-1.5">
          <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-[var(--theme-primary)] animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
});

const AIAssistant = memo(function AIAssistant() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: "Welcome to Nebula OS! I'm your AI assistant. Type 'help' to see what I can do.",
      timestamp: Date.now(),
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, scrollToBottom]);

  const handleSend = useCallback(() => {
    const trimmed = inputValue.trim();
    if (!trimmed || isTyping) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    // Simulate typing delay (1-2 seconds)
    const delay = 1000 + Math.random() * 1000;

    setTimeout(() => {
      const { content, action } = getResponse(trimmed);

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
      setIsTyping(false);

      // Execute action if any
      if (action) {
        action();
      }
    }, delay);
  }, [inputValue, isTyping]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSend();
      }
    },
    [handleSend]
  );

  return (
    <div className="flex flex-col h-full w-full overflow-hidden rounded-b-lg ai-assistant-glow">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1">
        {messages.map((msg) => (
          <MessageBubble key={msg.id} message={msg} />
        ))}
        {isTyping && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="border-t border-[var(--theme-primary)]/20 p-3">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-[var(--theme-surface)] border border-[var(--theme-primary)]/30 rounded-lg px-4 py-2.5 text-sm text-[var(--theme-text)] placeholder:text-[var(--theme-text)]/40 focus-visible:outline-none focus-visible:border-[var(--theme-primary)]/60 focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/30 transition-colors duration-200"
            disabled={isTyping}
            aria-label="Chat message input"
          />
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || isTyping}
            className="px-4 py-2.5 bg-[var(--theme-primary)] text-white rounded-lg text-sm font-medium hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-opacity duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--theme-primary)]/70 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
            aria-label="Send message"
          >
            Send
          </button>
        </div>
      </div>

      {/* Glowing border animation style */}
      <style>{`
        .ai-assistant-glow {
          box-shadow:
            0 0 15px color-mix(in srgb, var(--theme-primary) 30%, transparent),
            0 0 30px color-mix(in srgb, var(--theme-accent) 15%, transparent);
          animation: glow-cycle 4s ease-in-out infinite;
        }

        @keyframes glow-cycle {
          0%, 100% {
            box-shadow:
              0 0 15px color-mix(in srgb, var(--theme-primary) 30%, transparent),
              0 0 30px color-mix(in srgb, var(--theme-accent) 15%, transparent);
          }
          33% {
            box-shadow:
              0 0 15px color-mix(in srgb, var(--theme-secondary) 30%, transparent),
              0 0 30px color-mix(in srgb, var(--theme-primary) 15%, transparent);
          }
          66% {
            box-shadow:
              0 0 15px color-mix(in srgb, var(--theme-accent) 30%, transparent),
              0 0 30px color-mix(in srgb, var(--theme-secondary) 15%, transparent);
          }
        }
      `}</style>
    </div>
  );
});

export default AIAssistant;

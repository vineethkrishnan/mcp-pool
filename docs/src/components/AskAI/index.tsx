import {useState, useRef, useEffect, useCallback} from 'react';
import type {ReactNode, FormEvent, KeyboardEvent} from 'react';
import styles from './styles.module.css';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const SUGGESTED_QUESTIONS = [
  'How do I install the Stripe MCP?',
  'What write tools does Linear have?',
];

const SYSTEM_CONTEXT = `You are MCP Pool's documentation assistant. Answer questions about MCP Pool — a collection of 11 Model Context Protocol servers for AI assistants.

Servers: Stripe, Sentry, Notion, Linear, Datadog, Vercel, PagerDuty, HubSpot, Intercom, Shopify, Google Workspace.

Key facts:
- Install any server via npx: npx -y @vineethnkrishnan/<server>-mcp
- Each server needs one environment variable (API key or token)
- Works with Claude Desktop, VS Code, Cursor, Windsurf, JetBrains, Claude Code CLI
- 130+ tools total across all servers (both read and write operations)
- All servers support OAuth or API key authentication

Be concise and helpful. If you don't know something specific, suggest checking the docs.`;

export default function AskAI(): ReactNode {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [showSettings, setShowSettings] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Load API key from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('mcp-pool-ai-key');
      if (saved) setApiKey(saved);
    }
  }, []);

  // Listen for custom event from navbar button
  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener('open-ask-ai', handler);
    return () => window.removeEventListener('open-ask-ai', handler);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({behavior: 'smooth'});
  }, [messages]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Close on Escape, lock body scroll
  useEffect(() => {
    if (!isOpen) return;

    const handleEsc = (e: globalThis.KeyboardEvent) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEsc);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEsc);
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const saveApiKey = useCallback((key: string) => {
    setApiKey(key);
    if (typeof window !== 'undefined') {
      if (key) {
        localStorage.setItem('mcp-pool-ai-key', key);
      } else {
        localStorage.removeItem('mcp-pool-ai-key');
      }
    }
    setShowSettings(false);
  }, []);

  const sendMessage = useCallback(async (content: string) => {
    if (!content.trim()) return;

    const userMessage: Message = {role: 'user', content: content.trim()};
    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    setInput('');
    setIsLoading(true);

    if (!apiKey) {
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: 'Please set your Anthropic API key first. Click the \u2699 gear icon below the input to configure it. Your key is stored locally in your browser and never sent to our servers.',
      }]);
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': apiKey,
          'anthropic-version': '2023-06-01',
          'anthropic-dangerous-direct-browser-access': 'true',
        },
        body: JSON.stringify({
          model: 'claude-haiku-4-5-20251001',
          max_tokens: 1024,
          system: SYSTEM_CONTEXT,
          messages: updatedMessages.map(m => ({role: m.role, content: m.content})),
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      const assistantContent = data.content?.[0]?.text || 'Sorry, I could not generate a response.';
      setMessages([...updatedMessages, {role: 'assistant', content: assistantContent}]);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      setMessages([...updatedMessages, {
        role: 'assistant',
        content: `Failed to get a response. ${errorMessage.includes('401') ? 'Please check your API key in settings.' : `Error: ${errorMessage}`}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  }, [messages, apiKey]);

  const handleSubmit = useCallback((e: FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const handleKeyDown = useCallback((e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  }, [input, sendMessage]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={() => setIsOpen(false)}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.headerLeft}>
            <span className={styles.headerIcon}>{'\u2728'}</span>
            <span className={styles.headerTitle}>MCP Pool AI</span>
          </div>
          <button
            className={styles.closeButton}
            onClick={() => setIsOpen(false)}
            aria-label="Close"
          >
            {'\u2715'}
          </button>
        </div>

        {/* Disclaimer */}
        <div className={styles.disclaimer}>
          This tool uses the Anthropic API with your own API key. Do not include
          sensitive or personal information in your queries.
        </div>

        {/* Suggested questions */}
        {messages.length === 0 && (
          <div className={styles.suggestions}>
            {SUGGESTED_QUESTIONS.map((q) => (
              <button
                key={q}
                className={styles.suggestionPill}
                onClick={() => sendMessage(q)}
              >
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <div className={styles.messages}>
            {messages.map((msg, i) => (
              <div
                key={i}
                className={msg.role === 'user' ? styles.userMessage : styles.assistantMessage}
              >
                <div className={styles.messageLabel}>
                  {msg.role === 'user' ? 'You' : 'AI'}
                </div>
                <div className={styles.messageContent}>
                  {msg.content}
                </div>
              </div>
            ))}
            {isLoading && (
              <div className={styles.assistantMessage}>
                <div className={styles.messageLabel}>AI</div>
                <div className={styles.messageContent}>
                  <span className={styles.typing}>
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                    <span className={styles.dot} />
                  </span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}

        {/* Input area */}
        <div className={styles.inputWrapper}>
          <form className={styles.inputArea} onSubmit={handleSubmit}>
            <textarea
              ref={inputRef}
              className={styles.input}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me a question about MCP Pool..."
              rows={1}
              disabled={isLoading}
            />
            <button
              type="submit"
              className={styles.sendButton}
              disabled={!input.trim() || isLoading}
              aria-label="Send"
            >
              {'\u2191'}
            </button>
          </form>

          <div className={styles.inputFooter}>
            <button
              className={styles.settingsToggle}
              onClick={() => setShowSettings(!showSettings)}
              type="button"
              title="API Key Settings"
            >
              {'\u2699'} {apiKey ? 'API key configured' : 'Set API key'}
            </button>
          </div>
        </div>

        {/* Settings panel */}
        {showSettings && (
          <div className={styles.settings}>
            <p className={styles.settingsNote}>
              Enter your Anthropic API key. It is stored locally in your browser only.
            </p>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              saveApiKey(formData.get('apiKey') as string);
            }}>
              <input
                name="apiKey"
                type="password"
                className={styles.settingsInput}
                placeholder="sk-ant-..."
                defaultValue={apiKey}
              />
              <div className={styles.settingsActions}>
                <button type="submit" className={styles.settingsSave}>Save</button>
                {apiKey && (
                  <button
                    type="button"
                    className={styles.settingsClear}
                    onClick={() => saveApiKey('')}
                  >
                    Clear
                  </button>
                )}
                <button
                  type="button"
                  className={styles.settingsCancel}
                  onClick={() => setShowSettings(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}

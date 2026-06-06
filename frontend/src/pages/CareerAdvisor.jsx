import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api';

const SUGGESTIONS = [
  'What jobs match my skills?',
  'What skills should I learn next?',
  'How can I improve my profile?',
  'What salary range should I expect?',
  'How can I switch to another field?',
];

export default function CareerAdvisor() {
  const { user } = useAuth();

  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: `Hi ${user?.name?.split(' ')[0] || 'there'}, I can help you with job suggestions, skills, and career advice based on your profile.`,
    },
  ]);

  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  async function sendMessage(text) {
    const userText = text || input.trim();

    if (!userText || loading) return;

    const userMsg = {
      role: 'user',
      content: userText,
    };

    const newMessages = [...messages, userMsg];

    setMessages(newMessages);
    setInput('');
    setLoading(true);
    setError('');

    try {
      const history = newMessages
        .slice(1)
        .slice(-6)
        .map((m) => ({
          role: m.role,
          content: m.content,
        }));

      const { data } = await api.post('/ai/chat', {
        message: userText,
        history,
      });

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: data.reply,
        },
      ]);
    } catch (err) {
      setError(err.response?.data?.error || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  function handleKey(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        <div style={styles.header}>
          <h1 style={styles.title}>Career Advisor</h1>
          <p style={styles.subtitle}>
            Ask questions about jobs, skills, applications, and your career path.
          </p>
        </div>

        <div style={styles.chatBox}>
          {messages.map((msg, i) => (
            <div
              key={i}
              style={msg.role === 'user' ? styles.rowUser : styles.rowAssistant}
            >
              <div style={msg.role === 'user' ? styles.bubbleUser : styles.bubbleAssistant}>
                {msg.content.split('\n').map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < msg.content.split('\n').length - 1 && <br />}
                  </span>
                ))}
              </div>
            </div>
          ))}

          {loading && (
            <div style={styles.rowAssistant}>
              <div style={styles.bubbleAssistant}>Writing response...</div>
            </div>
          )}

          {error && <div style={styles.errorBox}>{error}</div>}

          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div style={styles.suggestions}>
            {SUGGESTIONS.map((s) => (
              <button
                key={s}
                style={styles.chip}
                onClick={() => sendMessage(s)}
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div style={styles.inputRow}>
          <textarea
            style={styles.textarea}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKey}
            placeholder="Write your question here..."
            rows={2}
            disabled={loading}
          />

          <button
            style={loading || !input.trim() ? styles.sendBtnDisabled : styles.sendBtn}
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
          >
            Send
          </button>
        </div>

        <p style={styles.hint}>
          Press Enter to send, Shift + Enter for a new line.
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: { minHeight: '100vh', background: '#f6f7fb', padding: '24px 16px' },
  container: { width: '100%', maxWidth: '820px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '14px' },
  header: { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '22px' },
  title: { margin: 0, fontSize: '28px', fontWeight: '700', color: '#111827' },
  subtitle: { margin: '6px 0 0', fontSize: '14px', color: '#6b7280' },
  chatBox: { background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '18px', minHeight: '390px', maxHeight: '500px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '12px' },
  rowUser: { display: 'flex', justifyContent: 'flex-end' },
  rowAssistant: { display: 'flex', justifyContent: 'flex-start' },
  bubbleUser: { background: '#2563eb', color: 'white', borderRadius: '12px', padding: '11px 14px', maxWidth: '75%', fontSize: '14px', lineHeight: '1.5' },
  bubbleAssistant: { background: '#f3f4f6', color: '#111827', borderRadius: '12px', padding: '11px 14px', maxWidth: '78%', fontSize: '14px', lineHeight: '1.6' },
  errorBox: { background: '#fee2e2', border: '1px solid #fecaca', color: '#991b1b', borderRadius: '8px', padding: '10px 12px', fontSize: '13px' },
  suggestions: { display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center' },
  chip: { background: 'white', border: '1px solid #d1d5db', color: '#374151', borderRadius: '8px', padding: '8px 12px', fontSize: '13px', cursor: 'pointer' },
  inputRow: { display: 'flex', gap: '10px', alignItems: 'flex-end', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '12px' },
  textarea: { flex: 1, border: 'none', outline: 'none', resize: 'none', fontSize: '14px', lineHeight: '1.5', fontFamily: 'inherit', color: '#111827', background: 'transparent' },
  sendBtn: { background: '#2563eb', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' },
  sendBtnDisabled: { background: '#e5e7eb', color: '#9ca3af', border: 'none', borderRadius: '8px', padding: '10px 18px', fontWeight: '600', fontSize: '14px', cursor: 'not-allowed' },
  hint: { textAlign: 'center', fontSize: '12px', color: '#9ca3af', margin: '-4px 0 0' },
};
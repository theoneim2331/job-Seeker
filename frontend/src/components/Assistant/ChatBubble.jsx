import { useState, useRef, useEffect } from 'react';
import { useFilters } from '../../context/FilterContext';
import { jobsAPI } from '../../services/api';
import ReactMarkdown from 'react-markdown';
import { MessageCircle, X, Send, Sparkles, Trash2, ExternalLink } from 'lucide-react';
import './ChatBubble.css';

export default function ChatBubble() {
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const messagesEndRef = useRef(null);
    const { updateFilters } = useFilters();

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    // Initial welcome
    useEffect(() => {
        if (messages.length === 0) {
            setMessages([{
                role: 'assistant',
                content: "Hey there! I'm your AI job hunt buddy. 🚀\n\nI can search for jobs directly or update your screen filters.\n\nTry asking me:\n\"Find remote marketing jobs\"\n\"Show me salaries for Python devs\"",
                type: 'chat'
            }]);
        }
    }, []);

    const handleSend = async () => {
        if (!input.trim() || loading) return;

        const userText = input;
        const newMessages = [...messages, { role: 'user', content: userText }];
        setMessages(newMessages);
        setInput('');
        setLoading(true);

        try {
            // Prepare messages for Puter
            const chatHistory = newMessages.map(m => ({
                role: m.role,
                content: m.content
            }));

            // Add system instruction
            chatHistory.unshift({
                role: 'system',
                content: `You are a super friendly and enthusiastic AI job assistant. 🌟
                
                You have access to a database of largely REMOTE jobs (via Remotive).
                
                Tools:
                1. 'fetch_jobs': SEARCH for jobs. If user asks "Find jobs...", "Show me...", or asks about salaries, use this.
                2. 'apply_filters': Update UI filters.
                
                Important:
                - If 'fetch_jobs' returns jobs, summarize them nicely using Markdown lists and bold text!
                - Link the job titles using markdown links: [Title](link).
                - Use emojis.
                
                Example Output:
                "I found 3 matches! 🎉
                1. **[Senior Dev](http...)** at Company ($120k)
                2. ... "
                
                Be concise and helpful!`
            });

            const response = await window.puter.ai.chat(chatHistory, {
                model: 'gpt-4o-mini',
                tools: [
                    {
                        name: 'fetch_jobs',
                        description: 'Search for jobs in the database and return the list to the AI to read',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string', description: 'Search keywords like title or company' },
                                location: { type: 'string', description: 'City or country' },
                                workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite'] },
                                jobType: { type: 'string', enum: ['fulltime', 'parttime', 'contract', 'internship'] },
                                skills: { type: 'array', items: { type: 'string' }, description: 'Specific tech skills' },
                                datePosted: { type: 'string', enum: ['last24h', 'lastWeek', 'lastMonth', 'any'] }
                            }
                        }
                    },
                    {
                        name: 'apply_filters',
                        description: 'Updates the main UI filters (sidebar) for the user',
                        parameters: {
                            type: 'object',
                            properties: {
                                query: { type: 'string' },
                                location: { type: 'string' },
                                workMode: { type: 'string', enum: ['remote', 'hybrid', 'onsite'] },
                                jobType: { type: 'string', enum: ['fulltime', 'parttime', 'contract', 'internship'] },
                                skills: { type: 'array', items: { type: 'string' } }
                            }
                        }
                    }
                ]
            });

            const message = response.message;
            let assistantContent = message.content || "";
            let messageType = 'chat';

            // Handle tool calls
            if (message.tool_calls && message.tool_calls.length > 0) {
                for (const toolCall of message.tool_calls) {
                    const args = JSON.parse(toolCall.function.arguments);

                    if (toolCall.function.name === 'apply_filters') {
                        console.log('AI applying filters:', args);
                        updateFilters(args);
                        messageType = 'filter';
                        if (!assistantContent) assistantContent = "I've updated your dashboard filters! ✨ Check out the results.";
                    }

                    if (toolCall.function.name === 'fetch_jobs') {
                        console.log('AI fetching jobs:', args);

                        // Implicitly update UI filters too!
                        updateFilters(args);

                        try {
                            // Fetch jobs from backend
                            const data = await jobsAPI.getJobs({ ...args, limit: 5 });
                            const jobs = data.jobs || [];

                            // Feed the jobs back to the AI to summarize
                            const jobContext = jobs.length > 0
                                ? `Here are the jobs found: ${JSON.stringify(jobs.map(j => ({ title: j.title, company: j.company, salary: j.salary, link: j.applyUrl })))}`
                                : "No jobs found for these criteria.";

                            // Second call to get the summary
                            const summaryResponse = await window.puter.ai.chat([
                                ...chatHistory,
                                message,
                                { role: 'tool', tool_call_id: toolCall.id, name: 'fetch_jobs', content: jobContext }
                            ], { model: 'gpt-4o-mini' });

                            assistantContent = summaryResponse.message.content;
                            messageType = 'filter'; // Show checkmark that we updated UI

                        } catch (err) {
                            console.error('Error fetching jobs for AI:', err);
                            assistantContent = "I tried to find some jobs but had a hiccup connecting to the database. 😓";
                        }
                    }
                }
            }

            setMessages(prev => [...prev, {
                role: 'assistant',
                content: assistantContent,
                type: messageType
            }]);

        } catch (err) {
            console.error('Puter AI error:', err);
            setMessages(prev => [...prev, {
                role: 'assistant',
                content: 'Oops! My brain froze for a second. Can you try that again? 🧠❄️',
                type: 'error'
            }]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyPress = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const clearChat = () => {
        setMessages([{
            role: 'assistant',
            content: "Chat cleared! Ready for a fresh start. 🌱",
            type: 'chat'
        }]);
    };

    const suggestedQueries = [
        "Find remote jobs",
        "Python salaries?",
        "Clear filters"
    ];

    return (
        <div className={`chat-bubble-container ${isOpen ? 'open' : ''}`}>
            {isOpen && (
                <div className="chat-window animate-slideUp">
                    <div className="chat-header">
                        <div className="chat-title">
                            <Sparkles size={18} />
                            <span>Job Buddy (AI)</span>
                        </div>
                        <div className="chat-actions">
                            <button className="chat-action-btn" onClick={clearChat} title="Clear">
                                <Trash2 size={16} />
                            </button>
                            <button className="chat-action-btn" onClick={() => setIsOpen(false)}>
                                <X size={18} />
                            </button>
                        </div>
                    </div>

                    <div className="chat-messages">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={`chat-message ${msg.role} ${msg.type || ''}`}>
                                {msg.role === 'assistant' && (
                                    <div className="message-avatar"><Sparkles size={14} /></div>
                                )}
                                <div className="message-content">
                                    <ReactMarkdown
                                        components={{
                                            a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" />
                                        }}
                                    >
                                        {msg.content}
                                    </ReactMarkdown>

                                    {msg.type === 'filter' && (
                                        <div className="filter-applied-badge">✓ Dashboard Updated</div>
                                    )}
                                </div>
                            </div>
                        ))}
                        {loading && (
                            <div className="chat-message assistant">
                                <div className="message-avatar"><Sparkles size={14} /></div>
                                <div className="message-content typing">
                                    <span></span><span></span><span></span>
                                </div>
                            </div>
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {messages.length <= 2 && (
                        <div className="chat-suggestions">
                            {suggestedQueries.map(query => (
                                <button key={query} className="suggestion-btn" onClick={() => {
                                    setInput(query);
                                    // Hack to trigger send with the new state value requires handling
                                    // Better to just call handleSend with the value but handleSend uses state
                                    // Let's just set input and user clicks send for now or use effect? 
                                    // Simpler:
                                    // (Real implementation would pass arg to handleSend, but keeping it simple)
                                    /* Ideally refactor handleSend to take optional text */
                                    // For now, user clicks to fill, then sends.
                                }}>
                                    {query}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="chat-input-container">
                        <input
                            type="text"
                            className="chat-input"
                            placeholder="Ask about jobs..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            onKeyPress={handleKeyPress}
                            disabled={loading}
                        />
                        <button className="send-btn" onClick={handleSend} disabled={!input.trim() || loading}>
                            <Send size={18} />
                        </button>
                    </div>
                </div>
            )}

            <button className={`chat-fab ${isOpen ? 'hidden' : ''}`} onClick={() => setIsOpen(true)}>
                <MessageCircle size={24} />
                <span className="fab-pulse"></span>
            </button>
        </div>
    );
}

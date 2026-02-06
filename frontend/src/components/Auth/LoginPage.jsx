import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, Mail, Lock, ArrowRight, Sparkles } from 'lucide-react';
import './LoginPage.css';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { login, user } = useAuth();
    const navigate = useNavigate();

    // Redirect if already logged in
    if (user) {
        navigate('/', { replace: true });
        return null;
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await login(email, password);
            navigate('/');
        } catch (err) {
            setError(err.message || 'Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const fillTestCredentials = () => {
        setEmail('test@gmail.com');
        setPassword('test@123');
    };

    return (
        <div className="login-page">
            <div className="login-bg-shapes">
                <div className="shape shape-1"></div>
                <div className="shape shape-2"></div>
                <div className="shape shape-3"></div>
            </div>

            <div className="login-container">
                <div className="login-card">
                    {/* Logo & Header */}
                    <div className="login-header">
                        <div className="login-logo">
                            <Briefcase size={28} />
                            <span>JobMatch</span>
                            <span className="logo-ai">AI</span>
                        </div>
                        <h1>Welcome back</h1>
                        <p>Sign in to access your AI-powered job tracker</p>
                    </div>

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="login-form">
                        {error && (
                            <div className="login-error animate-fadeIn">
                                {error}
                            </div>
                        )}

                        <div className="input-group">
                            <label className="input-label">Email</label>
                            <div className="input-wrapper">
                                <Mail size={18} className="input-icon" />
                                <input
                                    type="email"
                                    className="input"
                                    placeholder="Enter your email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    autoFocus
                                />
                            </div>
                        </div>

                        <div className="input-group">
                            <label className="input-label">Password</label>
                            <div className="input-wrapper">
                                <Lock size={18} className="input-icon" />
                                <input
                                    type="password"
                                    className="input"
                                    placeholder="Enter your password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            className="btn btn-primary btn-lg w-full"
                            disabled={loading}
                        >
                            {loading ? (
                                <span className="animate-spin">⟳</span>
                            ) : (
                                <>
                                    Sign In
                                    <ArrowRight size={18} />
                                </>
                            )}
                        </button>
                    </form>

                    {/* Test credentials hint */}
                    <div className="login-hint">
                        <button
                            type="button"
                            className="hint-button"
                            onClick={fillTestCredentials}
                        >
                            <Sparkles size={14} />
                            Use test credentials
                        </button>
                        <p>test@gmail.com / test@123</p>
                    </div>

                    {/* Features */}
                    <div className="login-features">
                        <div className="feature">
                            <span className="feature-icon">🎯</span>
                            <span>AI Job Matching</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">📊</span>
                            <span>Smart Tracking</span>
                        </div>
                        <div className="feature">
                            <span className="feature-icon">💬</span>
                            <span>AI Assistant</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

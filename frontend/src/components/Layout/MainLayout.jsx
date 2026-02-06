import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Briefcase, LayoutGrid, FileText, LogOut, User } from 'lucide-react';
import ResumeUpload from '../Resume/ResumeUpload';
import { useState } from 'react';
import './MainLayout.css';

export default function MainLayout({ children }) {
    const { user, logout } = useAuth();
    const location = useLocation();
    const [showResumeModal, setShowResumeModal] = useState(false);

    const handleLogout = async () => {
        await logout();
    };

    return (
        <div className="layout">
            {/* Header */}
            <header className="header">
                <div className="header-content">
                    {/* Logo */}
                    <Link to="/" className="logo">
                        <Briefcase size={24} />
                        <span>JobMatch</span>
                        <span className="logo-ai">AI</span>
                    </Link>

                    {/* Navigation */}
                    <nav className="nav">
                        <Link
                            to="/"
                            className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}
                        >
                            <LayoutGrid size={18} />
                            <span>Jobs</span>
                        </Link>
                        <Link
                            to="/applications"
                            className={`nav-link ${location.pathname === '/applications' ? 'active' : ''}`}
                        >
                            <FileText size={18} />
                            <span>Applications</span>
                        </Link>
                    </nav>

                    {/* User Menu */}
                    <div className="user-menu">
                        <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => setShowResumeModal(true)}
                        >
                            {user?.hasResume ? 'Update Resume' : 'Upload Resume'}
                        </button>

                        <div className="user-info">
                            <User size={18} />
                            <span>{user?.email}</span>
                        </div>

                        <button
                            className="btn btn-ghost btn-icon"
                            onClick={handleLogout}
                            title="Logout"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="main-content">
                {children}
            </main>

            {/* Resume Upload Modal */}
            {showResumeModal && (
                <ResumeUpload onClose={() => setShowResumeModal(false)} />
            )}
        </div>
    );
}

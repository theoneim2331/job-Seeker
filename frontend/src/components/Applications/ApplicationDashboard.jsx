import { useState, useEffect } from 'react';
import { applicationsAPI } from '../../services/api';
import { FileText, Building2, MapPin, Calendar, ArrowRight, Briefcase } from 'lucide-react';
import './ApplicationDashboard.css';

const STATUS_CONFIG = {
    applied: { label: 'Applied', color: 'blue', icon: '📝' },
    interview: { label: 'Interview', color: 'purple', icon: '🎯' },
    offer: { label: 'Offer', color: 'green', icon: '🎉' },
    rejected: { label: 'Rejected', color: 'red', icon: '❌' },
    withdrawn: { label: 'Withdrawn', color: 'gray', icon: '↩️' }
};

export default function ApplicationDashboard() {
    const [applications, setApplications] = useState([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            const data = await applicationsAPI.getApplications();
            setApplications(data.applications || []);
        } catch (err) {
            console.error('Failed to fetch applications:', err);
        } finally {
            setLoading(false);
        }
    };

    const updateStatus = async (id, newStatus) => {
        try {
            await applicationsAPI.updateStatus(id, newStatus);
            setApplications(apps =>
                apps.map(app =>
                    app.id === id ? { ...app, status: newStatus } : app
                )
            );
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    };

    const filteredApps = filter === 'all'
        ? applications
        : applications.filter(app => app.status === filter);

    const statusCounts = applications.reduce((acc, app) => {
        acc[app.status] = (acc[app.status] || 0) + 1;
        return acc;
    }, {});

    return (
        <div className="dashboard">
            <div className="dashboard-header">
                <div>
                    <h1>
                        <Briefcase size={28} className="text-accent" />
                        My Applications
                    </h1>
                    <p>{applications.length} total applications</p>
                </div>
            </div>

            {/* Stats */}
            <div className="stats-grid">
                <div className="stat-card" onClick={() => setFilter('all')}>
                    <span className="stat-value">{applications.length}</span>
                    <span className="stat-label">Total</span>
                </div>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <div
                        key={key}
                        className={`stat-card stat-${config.color} ${filter === key ? 'active' : ''}`}
                        onClick={() => setFilter(filter === key ? 'all' : key)}
                    >
                        <span className="stat-icon">{config.icon}</span>
                        <span className="stat-value">{statusCounts[key] || 0}</span>
                        <span className="stat-label">{config.label}</span>
                    </div>
                ))}
            </div>

            {/* Applications List */}
            {loading ? (
                <div className="loading-state">
                    <div className="spinner"></div>
                    <p>Loading applications...</p>
                </div>
            ) : filteredApps.length === 0 ? (
                <div className="empty-state">
                    <FileText size={48} />
                    <h3>No applications yet</h3>
                    <p>When you apply to jobs, they'll appear here for tracking</p>
                </div>
            ) : (
                <div className="applications-list">
                    {filteredApps.map(app => (
                        <div key={app.id} className="application-card">
                            {/* Main Info */}
                            <div className="app-main">
                                <div className="app-info">
                                    <h3>{app.jobTitle}</h3>
                                    <div className="app-meta">
                                        <span>
                                            <Building2 size={14} />
                                            {app.company}
                                        </span>
                                        {app.location && (
                                            <span>
                                                <MapPin size={14} />
                                                {app.location}
                                            </span>
                                        )}
                                        <span>
                                            <Calendar size={14} />
                                            Applied {formatDate(app.createdAt)}
                                        </span>
                                    </div>
                                </div>

                                {/* Match Score */}
                                {app.matchScore > 0 && (
                                    <div className={`match-badge ${app.matchScore > 70 ? 'high' : app.matchScore >= 40 ? 'medium' : 'low'}`}>
                                        {app.matchScore}% match
                                    </div>
                                )}
                            </div>

                            {/* Status & Actions */}
                            <div className="app-status-row">
                                <div className={`status-badge status-${STATUS_CONFIG[app.status]?.color}`}>
                                    {STATUS_CONFIG[app.status]?.icon} {STATUS_CONFIG[app.status]?.label}
                                </div>

                                <div className="status-actions">
                                    {app.status === 'applied' && (
                                        <>
                                            <button
                                                className="status-btn"
                                                onClick={() => updateStatus(app.id, 'interview')}
                                            >
                                                Got Interview <ArrowRight size={14} />
                                            </button>
                                            <button
                                                className="status-btn reject"
                                                onClick={() => updateStatus(app.id, 'rejected')}
                                            >
                                                Rejected
                                            </button>
                                        </>
                                    )}
                                    {app.status === 'interview' && (
                                        <>
                                            <button
                                                className="status-btn success"
                                                onClick={() => updateStatus(app.id, 'offer')}
                                            >
                                                Got Offer! 🎉
                                            </button>
                                            <button
                                                className="status-btn reject"
                                                onClick={() => updateStatus(app.id, 'rejected')}
                                            >
                                                Rejected
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>

                            {/* Timeline */}
                            {app.timeline && app.timeline.length > 0 && (
                                <div className="timeline">
                                    {app.timeline.map((event, idx) => (
                                        <div key={idx} className="timeline-item">
                                            <div className="timeline-dot"></div>
                                            <div className="timeline-content">
                                                <span className="timeline-status">{STATUS_CONFIG[event.status]?.label}</span>
                                                <span className="timeline-date">{formatDate(event.timestamp)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

import { useState, useEffect } from 'react';
import { MapPin, Building2, Clock, Briefcase, ExternalLink, Star } from 'lucide-react';
import { applicationsAPI } from '../../services/api';
import './JobCard.css';

export default function JobCard({ job, onApply, style }) {
    const [applied, setApplied] = useState(false);

    useEffect(() => {
        // Check if already applied
        applicationsAPI.checkApplied(job.id).then(data => {
            setApplied(data.applied);
        }).catch(() => { });
    }, [job.id]);

    const getBadgeClass = () => {
        if (job.matchScore > 70) return 'badge-green';
        if (job.matchScore >= 40) return 'badge-yellow';
        return 'badge-gray';
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));

        if (diffDays === 0) return 'Today';
        if (diffDays === 1) return 'Yesterday';
        if (diffDays < 7) return `${diffDays} days ago`;
        if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
        return `${Math.floor(diffDays / 30)} months ago`;
    };

    return (
        <div className="job-card animate-fadeIn" style={style}>
            {/* Header */}
            <div className="job-card-header">
                <div className="job-card-title-row">
                    <h3 className="job-title">{job.title}</h3>
                    {job.matchScore > 70 && <Star size={16} className="star-icon" />}
                </div>
                <span className={`badge ${getBadgeClass()}`}>
                    {job.matchScore}% Match
                </span>
            </div>

            {/* Company & Location */}
            <div className="job-meta">
                <span className="meta-item">
                    <Building2 size={14} />
                    {job.company}
                </span>
                <span className="meta-item">
                    <MapPin size={14} />
                    {job.location}
                </span>
            </div>

            {/* Tags */}
            <div className="job-tags">
                <span className="tag">
                    <Briefcase size={12} />
                    {job.jobType}
                </span>
                <span className="tag">
                    {job.workMode}
                </span>
                {job.salary && (
                    <span className="tag tag-salary">
                        {job.salary}
                    </span>
                )}
            </div>

            {/* Description */}
            <p className="job-description">
                {(() => {
                    // Strip HTML tags for preview
                    const rawDescription = job.description || "";
                    const plainText = rawDescription.replace(/<[^>]*>?/gm, '');
                    return plainText.length > 150
                        ? plainText.substring(0, 150) + '...'
                        : plainText;
                })()}
            </p>

            {/* Match Explanation */}
            {job.matchExplanation && (
                <div className="match-explanation">
                    <span className="explanation-label">AI Match Insight:</span>
                    <span>{job.matchExplanation}</span>
                </div>
            )}

            {/* Skills */}
            {job.skills && job.skills.length > 0 && (
                <div className="job-skills">
                    {job.skills.slice(0, 4).map(skill => (
                        <span key={skill} className="skill-tag">{skill}</span>
                    ))}
                    {job.skills.length > 4 && (
                        <span className="skill-more">+{job.skills.length - 4}</span>
                    )}
                </div>
            )}

            {/* Footer */}
            <div className="job-card-footer">
                <span className="posted-date">
                    <Clock size={12} />
                    {formatDate(job.postedDate)}
                </span>

                <button
                    className={`btn ${applied ? 'btn-secondary' : 'btn-primary'} btn-sm`}
                    onClick={() => !applied && onApply(job)}
                    disabled={applied}
                >
                    {applied ? (
                        'Applied'
                    ) : (
                        <>
                            Apply Now
                            <ExternalLink size={14} />
                        </>
                    )}
                </button>
            </div>
        </div>
    );
}

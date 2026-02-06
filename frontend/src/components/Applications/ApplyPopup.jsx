import { useState } from 'react';
import { applicationsAPI } from '../../services/api';
import { CheckCircle, XCircle, Clock, X } from 'lucide-react';
import './ApplyPopup.css';

export default function ApplyPopup({ job, onClose }) {
    const [saving, setSaving] = useState(false);

    const handleResponse = async (response) => {
        if (response === 'yes') {
            setSaving(true);
            try {
                await applicationsAPI.createApplication({
                    jobId: job.id,
                    jobTitle: job.title,
                    company: job.company,
                    location: job.location,
                    jobUrl: job.applyUrl,
                    matchScore: job.matchScore
                });
            } catch (err) {
                // Ignore if already applied
                console.log('Application status:', err.message);
            }
            setSaving(false);
        }
        onClose();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal apply-popup animate-slideUp" onClick={e => e.stopPropagation()}>
                <button className="popup-close" onClick={onClose}>
                    <X size={18} />
                </button>

                <div className="popup-header">
                    <h2>Did you apply?</h2>
                    <p className="job-info">
                        <strong>{job.title}</strong> at {job.company}
                    </p>
                </div>

                <div className="popup-options">
                    <button
                        className="popup-btn yes"
                        onClick={() => handleResponse('yes')}
                        disabled={saving}
                    >
                        <CheckCircle size={24} />
                        <span>Yes, Applied</span>
                        <span className="btn-hint">Track this application</span>
                    </button>

                    <button
                        className="popup-btn no"
                        onClick={() => handleResponse('no')}
                    >
                        <XCircle size={24} />
                        <span>No, just browsing</span>
                        <span className="btn-hint">Maybe later</span>
                    </button>

                    <button
                        className="popup-btn earlier"
                        onClick={() => handleResponse('earlier')}
                    >
                        <Clock size={24} />
                        <span>Applied Earlier</span>
                        <span className="btn-hint">Already tracked</span>
                    </button>
                </div>
            </div>
        </div>
    );
}

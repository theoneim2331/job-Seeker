import { useState, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { resumeAPI } from '../../services/api';
import { Upload, X, FileText, Check, AlertCircle } from 'lucide-react';
import './ResumeUpload.css';

export default function ResumeUpload({ onClose }) {
    const { user, updateUser } = useAuth();
    const [dragActive, setDragActive] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState(false);
    const inputRef = useRef(null);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleFile = async (file) => {
        // Validate file type
        if (!['application/pdf', 'text/plain'].includes(file.type)) {
            setError('Please upload a PDF or TXT file.');
            return;
        }

        // Validate file size (10MB max)
        if (file.size > 10 * 1024 * 1024) {
            setError('File size must be less than 10MB.');
            return;
        }

        setError('');
        setUploading(true);

        try {
            const result = await resumeAPI.uploadResume(file);
            setSuccess(true);
            updateUser({ hasResume: true, resumeFileName: result.fileName });

            // Auto close after success
            setTimeout(() => {
                onClose();
            }, 1500);
        } catch (err) {
            setError(err.message || 'Failed to upload resume.');
        } finally {
            setUploading(false);
        }
    };

    const openFileDialog = () => {
        inputRef.current?.click();
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal resume-modal" onClick={e => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>
                    <X size={20} />
                </button>

                <div className="resume-modal-header">
                    <FileText size={32} className="text-accent" />
                    <h2>{user?.hasResume ? 'Update Your Resume' : 'Upload Your Resume'}</h2>
                    <p>Upload your resume to get AI-powered job match scores</p>
                </div>

                {success ? (
                    <div className="resume-success animate-fadeIn">
                        <div className="success-icon">
                            <Check size={32} />
                        </div>
                        <h3>Resume Uploaded!</h3>
                        <p>Your resume is now being used for job matching</p>
                    </div>
                ) : (
                    <>
                        {error && (
                            <div className="resume-error animate-fadeIn">
                                <AlertCircle size={18} />
                                {error}
                            </div>
                        )}

                        <div
                            className={`upload-zone ${dragActive ? 'active' : ''} ${uploading ? 'uploading' : ''}`}
                            onDragEnter={handleDrag}
                            onDragLeave={handleDrag}
                            onDragOver={handleDrag}
                            onDrop={handleDrop}
                            onClick={openFileDialog}
                        >
                            <input
                                ref={inputRef}
                                type="file"
                                accept=".pdf,.txt"
                                onChange={handleChange}
                                style={{ display: 'none' }}
                            />

                            {uploading ? (
                                <div className="upload-loading">
                                    <div className="spinner"></div>
                                    <p>Uploading and extracting text...</p>
                                </div>
                            ) : (
                                <>
                                    <Upload size={40} className="upload-icon" />
                                    <p className="upload-text">
                                        <strong>Click to upload</strong> or drag and drop
                                    </p>
                                    <p className="upload-hint">PDF or TXT (max 10MB)</p>
                                </>
                            )}
                        </div>

                        {user?.hasResume && (
                            <div className="current-resume">
                                <FileText size={16} />
                                <span>Current: {user.resumeFileName}</span>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}

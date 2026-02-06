import { useState, useEffect, useCallback } from 'react';
import { useFilters } from '../../context/FilterContext';
import { jobsAPI } from '../../services/api';
import JobCard from './JobCard';
import FilterSidebar from './FilterSidebar';
import BestMatches from './BestMatches';
import ApplyPopup from '../Applications/ApplyPopup';
import { Search, RefreshCw, Sparkles } from 'lucide-react';
import './JobFeed.css';

export default function JobFeed() {
    const { filters } = useFilters();
    const [jobs, setJobs] = useState([]);
    const [bestMatches, setBestMatches] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [applyPopup, setApplyPopup] = useState(null);

    // Fetch jobs when filters change
    const fetchJobs = useCallback(async () => {
        setLoading(true);
        setError('');
        try {
            const data = await jobsAPI.getJobs(filters);
            setJobs(data.jobs || []);
            setBestMatches(data.bestMatches || []);
        } catch (err) {
            setError(err.message || 'Failed to load jobs');
        } finally {
            setLoading(false);
        }
    }, [filters]);

    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // Handle apply click - opens external link and triggers popup on return
    const handleApply = (job) => {
        // Open external application URL
        window.open(job.applyUrl, '_blank');

        // Set up visibility change listener for popup
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'visible') {
                // Small delay before showing popup
                setTimeout(() => {
                    setApplyPopup(job);
                }, 1500);
                document.removeEventListener('visibilitychange', handleVisibilityChange);
            }
        };

        document.addEventListener('visibilitychange', handleVisibilityChange);

        // Cleanup after 5 minutes
        setTimeout(() => {
            document.removeEventListener('visibilitychange', handleVisibilityChange);
        }, 5 * 60 * 1000);
    };

    const handleRefresh = () => {
        fetchJobs();
    };

    return (
        <div className="job-feed-container">
            {/* Filter Sidebar */}
            <FilterSidebar />

            {/* Main Content */}
            <div className="job-feed-main">
                {/* Header */}
                <div className="job-feed-header">
                    <div>
                        <h1>
                            <Sparkles size={28} className="text-accent" />
                            Find Your Perfect Match
                        </h1>
                        <p>{loading ? 'Loading jobs...' : `${jobs.length} jobs found`}</p>
                    </div>
                    <button className="btn btn-secondary" onClick={handleRefresh}>
                        <RefreshCw size={18} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>

                {error && (
                    <div className="job-feed-error">
                        {error}
                        <button className="btn btn-sm btn-primary" onClick={fetchJobs}>
                            Try Again
                        </button>
                    </div>
                )}

                {/* Best Matches Section */}
                {!loading && bestMatches.length > 0 && (
                    <BestMatches jobs={bestMatches} onApply={handleApply} />
                )}

                {/* All Jobs */}
                <div className="jobs-section">
                    <h2>All Jobs</h2>

                    {loading ? (
                        <div className="jobs-grid">
                            {[...Array(6)].map((_, i) => (
                                <div key={i} className="job-card-skeleton">
                                    <div className="skeleton" style={{ height: 24, width: '60%', marginBottom: 12 }}></div>
                                    <div className="skeleton" style={{ height: 16, width: '40%', marginBottom: 16 }}></div>
                                    <div className="skeleton" style={{ height: 60, marginBottom: 12 }}></div>
                                    <div className="skeleton" style={{ height: 32, width: '30%' }}></div>
                                </div>
                            ))}
                        </div>
                    ) : jobs.length === 0 ? (
                        <div className="no-jobs">
                            <Search size={48} />
                            <h3>No jobs found</h3>
                            <p>Try adjusting your filters or search criteria</p>
                        </div>
                    ) : (
                        <div className="jobs-grid">
                            {jobs.map((job, index) => (
                                <JobCard
                                    key={job.id}
                                    job={job}
                                    onApply={handleApply}
                                    style={{ animationDelay: `${index * 50}ms` }}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Apply Popup */}
            {applyPopup && (
                <ApplyPopup
                    job={applyPopup}
                    onClose={() => setApplyPopup(null)}
                />
            )}
        </div>
    );
}

import { Trophy } from 'lucide-react';
import JobCard from './JobCard';
import './BestMatches.css';

export default function BestMatches({ jobs, onApply }) {
    return (
        <section className="best-matches">
            <div className="best-matches-header">
                <h2>
                    <Trophy size={20} className="trophy-icon" />
                    Best Matches for You
                </h2>
                <p>Top jobs based on your resume and skills</p>
            </div>

            <div className="best-matches-grid">
                {jobs.map((job, index) => (
                    <JobCard
                        key={job.id}
                        job={job}
                        onApply={onApply}
                        style={{ animationDelay: `${index * 80}ms` }}
                    />
                ))}
            </div>
        </section>
    );
}

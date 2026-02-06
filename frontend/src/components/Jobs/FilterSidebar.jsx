import { useFilters } from '../../context/FilterContext';
import { Filter, X, Search, MapPin, Calendar, Briefcase, Home, BarChart2 } from 'lucide-react';
import './FilterSidebar.css';

const SKILLS = [
    'React', 'Node.js', 'Python', 'JavaScript', 'TypeScript',
    'Java', 'Go', 'AWS', 'Docker', 'Kubernetes',
    'SQL', 'MongoDB', 'Machine Learning', 'Data Science'
];

const DATE_OPTIONS = [
    { value: 'any', label: 'Any time' },
    { value: 'last24h', label: 'Last 24 hours' },
    { value: 'lastWeek', label: 'Last week' },
    { value: 'lastMonth', label: 'Last month' },
];

const JOB_TYPES = [
    { value: '', label: 'All types' },
    { value: 'fulltime', label: 'Full-time' },
    { value: 'parttime', label: 'Part-time' },
    { value: 'contract', label: 'Contract' },
    { value: 'internship', label: 'Internship' },
];

const WORK_MODES = [
    { value: '', label: 'All modes' },
    { value: 'remote', label: 'Remote' },
    { value: 'hybrid', label: 'Hybrid' },
    { value: 'onsite', label: 'On-site' },
];

const MATCH_SCORES = [
    { value: 'all', label: 'All scores' },
    { value: 'high', label: 'High (>70%)' },
    { value: 'medium', label: 'Medium (40-70%)' },
];

export default function FilterSidebar() {
    const { filters, updateFilter, toggleSkill, clearFilters, appliedFiltersCount } = useFilters();

    return (
        <aside className="filter-sidebar">
            <div className="filter-header">
                <h2>
                    <Filter size={18} />
                    Filters
                    {appliedFiltersCount > 0 && (
                        <span className="filter-count">{appliedFiltersCount}</span>
                    )}
                </h2>
                {appliedFiltersCount > 0 && (
                    <button className="clear-btn" onClick={clearFilters}>
                        <X size={14} />
                        Clear all
                    </button>
                )}
            </div>

            {/* Search */}
            <div className="filter-section">
                <label className="filter-label">
                    <Search size={14} />
                    Role / Title
                </label>
                <input
                    type="text"
                    className="input"
                    placeholder="e.g., React Developer"
                    value={filters.query}
                    onChange={(e) => updateFilter('query', e.target.value)}
                />
            </div>

            {/* Skills */}
            <div className="filter-section">
                <label className="filter-label">Skills</label>
                <div className="skills-grid">
                    {SKILLS.map(skill => (
                        <button
                            key={skill}
                            className={`skill-btn ${filters.skills.includes(skill) ? 'active' : ''}`}
                            onClick={() => toggleSkill(skill)}
                        >
                            {skill}
                        </button>
                    ))}
                </div>
            </div>

            {/* Date Posted */}
            <div className="filter-section">
                <label className="filter-label">
                    <Calendar size={14} />
                    Date Posted
                </label>
                <div className="radio-group">
                    {DATE_OPTIONS.map(option => (
                        <label key={option.value} className="radio-label">
                            <input
                                type="radio"
                                name="datePosted"
                                value={option.value}
                                checked={filters.datePosted === option.value}
                                onChange={(e) => updateFilter('datePosted', e.target.value)}
                            />
                            <span className="radio-custom"></span>
                            {option.label}
                        </label>
                    ))}
                </div>
            </div>

            {/* Job Type */}
            <div className="filter-section">
                <label className="filter-label">
                    <Briefcase size={14} />
                    Job Type
                </label>
                <select
                    className="input"
                    value={filters.jobType}
                    onChange={(e) => updateFilter('jobType', e.target.value)}
                >
                    {JOB_TYPES.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Work Mode */}
            <div className="filter-section">
                <label className="filter-label">
                    <Home size={14} />
                    Work Mode
                </label>
                <select
                    className="input"
                    value={filters.workMode}
                    onChange={(e) => updateFilter('workMode', e.target.value)}
                >
                    {WORK_MODES.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>

            {/* Location */}
            <div className="filter-section">
                <label className="filter-label">
                    <MapPin size={14} />
                    Location
                </label>
                <input
                    type="text"
                    className="input"
                    placeholder="e.g., London, UK"
                    value={filters.location}
                    onChange={(e) => updateFilter('location', e.target.value)}
                />
            </div>

            {/* Match Score */}
            <div className="filter-section">
                <label className="filter-label">
                    <BarChart2 size={14} />
                    Match Score
                </label>
                <select
                    className="input"
                    value={filters.matchScore}
                    onChange={(e) => updateFilter('matchScore', e.target.value)}
                >
                    {MATCH_SCORES.map(option => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            </div>
        </aside>
    );
}

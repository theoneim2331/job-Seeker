import { createContext, useContext, useState, useCallback } from 'react';

const FilterContext = createContext(null);

const defaultFilters = {
    query: '',
    skills: [],
    datePosted: 'any',
    jobType: '',
    workMode: '',
    location: '',
    matchScore: 'all',
};

export function FilterProvider({ children }) {
    const [filters, setFilters] = useState(defaultFilters);
    const [appliedFiltersCount, setAppliedFiltersCount] = useState(0);

    const updateFilter = useCallback((key, value) => {
        setFilters(prev => {
            const newFilters = { ...prev, [key]: value };
            // Count active filters
            let count = 0;
            if (newFilters.query) count++;
            if (newFilters.skills.length > 0) count++;
            if (newFilters.datePosted !== 'any') count++;
            if (newFilters.jobType) count++;
            if (newFilters.workMode) count++;
            if (newFilters.location) count++;
            if (newFilters.matchScore !== 'all') count++;
            setAppliedFiltersCount(count);
            return newFilters;
        });
    }, []);

    const updateFilters = useCallback((newFilters) => {
        setFilters(prev => {
            const updated = { ...prev };

            // Handle clearAll
            if (newFilters.clearAll) {
                return defaultFilters;
            }

            // Merge new filters
            Object.entries(newFilters).forEach(([key, value]) => {
                if (value !== undefined && key in defaultFilters) {
                    updated[key] = value;
                }
            });

            // Count active filters
            let count = 0;
            if (updated.query) count++;
            if (updated.skills.length > 0) count++;
            if (updated.datePosted !== 'any') count++;
            if (updated.jobType) count++;
            if (updated.workMode) count++;
            if (updated.location) count++;
            if (updated.matchScore !== 'all') count++;
            setAppliedFiltersCount(count);

            return updated;
        });
    }, []);

    const clearFilters = useCallback(() => {
        setFilters(defaultFilters);
        setAppliedFiltersCount(0);
    }, []);

    const toggleSkill = useCallback((skill) => {
        setFilters(prev => {
            const skills = prev.skills.includes(skill)
                ? prev.skills.filter(s => s !== skill)
                : [...prev.skills, skill];

            let count = appliedFiltersCount;
            if (skills.length > 0 && prev.skills.length === 0) count++;
            if (skills.length === 0 && prev.skills.length > 0) count--;
            setAppliedFiltersCount(count);

            return { ...prev, skills };
        });
    }, [appliedFiltersCount]);

    return (
        <FilterContext.Provider value={{
            filters,
            updateFilter,
            updateFilters,
            clearFilters,
            toggleSkill,
            appliedFiltersCount
        }}>
            {children}
        </FilterContext.Provider>
    );
}

export function useFilters() {
    const context = useContext(FilterContext);
    if (!context) {
        throw new Error('useFilters must be used within a FilterProvider');
    }
    return context;
}

// Remotive API Integration Service
// Fetches remote jobs from remotive.com/api/remote-jobs
// No API key required

const REMOTIVE_API_URL = 'https://remotive.com/api/remote-jobs';

// Mock data fallback if API fails
const mockJobs = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    company: 'TechCorp Solutions',
    location: 'Remote',
    description: 'We are looking for an experienced React developer...',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: '£70,000 - £90,000',
    postedDate: new Date().toISOString(),
    applyUrl: 'https://example.com',
    skills: ['React', 'JavaScript']
  }
];

// Map Remotive job types to our format
function mapJobType(type) {
  if (!type) return 'Full-time';
  const t = type.toLowerCase();
  if (t.includes('full_time')) return 'Full-time';
  if (t.includes('part_time')) return 'Part-time';
  if (t.includes('contract')) return 'Contract';
  if (t.includes('freelance')) return 'Contract';
  if (t.includes('internship')) return 'Internship';
  return 'Full-time';
}

// Check if job matches filters
function matchesFilters(job, filters) {
  // Query/Title/Company
  if (filters.query) {
    const q = filters.query.toLowerCase();
    const titleMatch = job.title.toLowerCase().includes(q);
    const companyMatch = job.company.toLowerCase().includes(q);
    // Description is HTML, might be heavy to search, but let's include raw check
    const descMatch = job.description.toLowerCase().includes(q);
    
    if (!titleMatch && !companyMatch && !descMatch) return false;
  }

  // Work Mode - Relaxed for Remotive (Remote focused)
  // If user explicitly wants onsite, we might still show them remote jobs 
  // but maybe we shouldn't filter them out entirely if we have no other source.
  // For now, let's NOT filter out based on workMode 'onsite' since our source is purely remote.
  // This ensures the user at least sees meaningful results (remote jobs) rather than empty list.
  
  // Location (Remotive uses 'candidate_required_location')
  if (filters.location) {
    const jobLoc = job.location.toLowerCase();
    const filterLoc = filters.location.toLowerCase();
    
    // Strict match
    const strictMatch = jobLoc.includes(filterLoc);
    
    // Relaxed match: If job is "Worldwide", "Anywhere", "Global", it matches ANY location query
    const isWorldwide = jobLoc.includes('worldwide') || 
                        jobLoc.includes('anywhere') || 
                        jobLoc.includes('global') ||
                        jobLoc.includes('remote'); // "Remote" generally implies flexible, though sometimes means "Remote in [Country]"
                        
    if (!strictMatch && !isWorldwide) {
      return false;
    }
  }

  // Job Type
  if (filters.jobType) {
    // Basic mapping check
    if (job.jobType.toLowerCase() !== filters.jobType.toLowerCase()) {
       // Allow fuzzy match
       if (!job.jobType.toLowerCase().includes(filters.jobType.toLowerCase())) return false;
    }
  }

  // Date Posted
  if (filters.datePosted && filters.datePosted !== 'any') {
    const posted = new Date(job.postedDate);
    const now = new Date();
    const diffTime = Math.abs(now - posted);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (filters.datePosted === 'last24h' && diffDays > 1) return false;
    if (filters.datePosted === 'lastWeek' && diffDays > 7) return false;
    if (filters.datePosted === 'lastMonth' && diffDays > 30) return false;
  }

  return true;
}

export async function fetchJobsFromRemotive(filters) {
  try {
    console.log('Fetching from Remotive API...');
    let url = REMOTIVE_API_URL;
    
    // Remotive supports 'search' (term) and 'limit' parameters, but mostly returns a big list
    // We can use 'search' to filter server-side a bit if query exists
    if (filters.query) {
      url += `?search=${encodeURIComponent(filters.query)}`;
    } else if (filters.skills && filters.skills.length > 0) {
       // Try searching with the first skill if no query
       url += `?search=${encodeURIComponent(filters.skills[0])}`;
    }

    // Remotive limit defaults to 0 (all), we might want to limit if possible, 
    // but the API dictates 'limit' param.
    // If we fetch all, we cache/filter locally. 
    // Let's rely on fetching what matches 'search' or all if empty.
    
    const response = await fetch(url);
    if (!response.ok) {
      console.error('Remotive API error:', response.status);
      return mockJobs;
    }

    const data = await response.json();
    const remotiveJobs = data.jobs || []; // Array of jobs

    // Transform to our format
    let jobs = remotiveJobs.map(job => ({
      id: `remotive-${job.id}`,
      title: job.title,
      company: job.company_name,
      location: job.candidate_required_location || 'Remote',
      description: job.description, // Contains HTML
      jobType: mapJobType(job.job_type), // e.g. 'full_time'
      rawType: job.job_type,
      workMode: 'Remote', // Remotive is remote
      salary: job.salary || 'Salary not specified',
      postedDate: job.publication_date,
      applyUrl: job.url,
      skills: job.tags || [] // Remotive provides tags
    }));

    // Client-side filtering because Remotive API is simple
    // Validating against all filters that API might haven't covered
    jobs = jobs.filter(job => matchesFilters(job, filters));

    // Pagination
    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;

    return jobs.slice(startIndex, endIndex);

  } catch (error) {
    console.error('Error fetching from Remotive:', error);
    return mockJobs;
  }
}

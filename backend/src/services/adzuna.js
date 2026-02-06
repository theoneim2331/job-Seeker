// Adzuna API Integration Service
// Uses mock data when API keys are not configured

const ADZUNA_BASE_URL = 'https://api.adzuna.com/v1/api';
const ADZUNA_COUNTRY = 'gb'; // UK jobs, can be changed to 'us', 'in', etc.

// Mock job data for development/demo
const mockJobs = [
  {
    id: 'job-1',
    title: 'Senior React Developer',
    company: 'TechCorp Solutions',
    location: 'London, UK',
    description: 'We are looking for an experienced React developer with strong JavaScript skills. You will work on building modern web applications using React, Redux, and TypeScript. Experience with Node.js and REST APIs is a plus.',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: '£70,000 - £90,000',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-1',
    skills: ['React', 'JavaScript', 'TypeScript', 'Redux', 'Node.js']
  },
  {
    id: 'job-2',
    title: 'Full Stack Engineer',
    company: 'StartupXYZ',
    location: 'Manchester, UK',
    description: 'Join our fast-growing startup as a Full Stack Engineer. You will work with Python, Django on the backend and React on the frontend. We value clean code and test-driven development.',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: '£55,000 - £75,000',
    postedDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-2',
    skills: ['Python', 'Django', 'React', 'PostgreSQL', 'Docker']
  },
  {
    id: 'job-3',
    title: 'Machine Learning Engineer',
    company: 'AI Innovations Ltd',
    location: 'Cambridge, UK',
    description: 'Work on cutting-edge ML projects using PyTorch and TensorFlow. We need someone with strong Python skills and experience in deep learning, NLP, and computer vision.',
    jobType: 'Full-time',
    workMode: 'On-site',
    salary: '£80,000 - £110,000',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-3',
    skills: ['Python', 'PyTorch', 'TensorFlow', 'Machine Learning', 'NLP']
  },
  {
    id: 'job-4',
    title: 'Node.js Backend Developer',
    company: 'CloudServices Inc',
    location: 'Birmingham, UK',
    description: 'Build scalable microservices using Node.js and Express. Experience with MongoDB, Redis, and message queues is essential. We work in an agile environment.',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: '£50,000 - £65,000',
    postedDate: new Date(Date.now() - 12 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-4',
    skills: ['Node.js', 'Express', 'MongoDB', 'Redis', 'AWS']
  },
  {
    id: 'job-5',
    title: 'Frontend Developer Intern',
    company: 'WebDesign Studio',
    location: 'Edinburgh, UK',
    description: 'Great opportunity for aspiring frontend developers! You will learn HTML, CSS, JavaScript and React while working on real client projects.',
    jobType: 'Internship',
    workMode: 'Hybrid',
    salary: '£20,000 - £25,000',
    postedDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-5',
    skills: ['HTML', 'CSS', 'JavaScript', 'React']
  },
  {
    id: 'job-6',
    title: 'DevOps Engineer',
    company: 'InfraCloud Technologies',
    location: 'Bristol, UK',
    description: 'Manage cloud infrastructure on AWS and GCP. Experience with Kubernetes, Terraform, and CI/CD pipelines required. Strong Linux administration skills needed.',
    jobType: 'Contract',
    workMode: 'Remote',
    salary: '£500 - £600/day',
    postedDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-6',
    skills: ['AWS', 'Kubernetes', 'Docker', 'Terraform', 'Linux']
  },
  {
    id: 'job-7',
    title: 'Senior Python Developer',
    company: 'DataDriven Corp',
    location: 'Leeds, UK',
    description: 'Work on data processing pipelines using Python, Pandas, and Apache Spark. Experience with SQL databases and data warehousing is essential.',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: '£65,000 - £85,000',
    postedDate: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-7',
    skills: ['Python', 'Pandas', 'Apache Spark', 'SQL', 'Data Engineering']
  },
  {
    id: 'job-8',
    title: 'UI/UX Designer (Part-time)',
    company: 'Creative Agency',
    location: 'Glasgow, UK',
    description: 'Design beautiful user interfaces for web and mobile apps. Proficiency in Figma and Adobe XD required. Understanding of user research and prototyping is a plus.',
    jobType: 'Part-time',
    workMode: 'Remote',
    salary: '£30/hour',
    postedDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-8',
    skills: ['Figma', 'Adobe XD', 'UI Design', 'UX Research', 'Prototyping']
  },
  {
    id: 'job-9',
    title: 'React Native Mobile Developer',
    company: 'MobileFirst Apps',
    location: 'London, UK',
    description: 'Build cross-platform mobile applications using React Native. Strong JavaScript/TypeScript skills required. Experience with iOS and Android development is a plus.',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: '£60,000 - £80,000',
    postedDate: new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-9',
    skills: ['React Native', 'JavaScript', 'TypeScript', 'iOS', 'Android']
  },
  {
    id: 'job-10',
    title: 'Data Scientist',
    company: 'Analytics Pro',
    location: 'Oxford, UK',
    description: 'Apply machine learning and statistical analysis to solve business problems. Strong skills in Python, R, and SQL required. Experience with visualization tools like Tableau is a plus.',
    jobType: 'Full-time',
    workMode: 'On-site',
    salary: '£55,000 - £75,000',
    postedDate: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-10',
    skills: ['Python', 'R', 'SQL', 'Machine Learning', 'Tableau']
  },
  {
    id: 'job-11',
    title: 'Senior Backend Developer - Go',
    company: 'FinTech Solutions',
    location: 'London, UK',
    description: 'Build high-performance financial systems using Go. Experience with microservices, gRPC, and PostgreSQL required. Knowledge of financial regulations is a plus.',
    jobType: 'Full-time',
    workMode: 'Hybrid',
    salary: '£85,000 - £105,000',
    postedDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-11',
    skills: ['Go', 'Golang', 'PostgreSQL', 'gRPC', 'Microservices']
  },
  {
    id: 'job-12',
    title: 'JavaScript Developer',
    company: 'Web Experts',
    location: 'Remote',
    description: 'Work on modern web applications using JavaScript, Vue.js, and Node.js. Strong understanding of ES6+ features and asynchronous programming required.',
    jobType: 'Full-time',
    workMode: 'Remote',
    salary: '£45,000 - £60,000',
    postedDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    applyUrl: 'https://example.com/apply/job-12',
    skills: ['JavaScript', 'Vue.js', 'Node.js', 'ES6', 'HTML/CSS']
  }
];

// Convert Adzuna API date filter to days
function getMaxDaysOld(datePosted) {
  switch (datePosted) {
    case 'last24h': return 1;
    case 'lastWeek': return 7;
    case 'lastMonth': return 30;
    default: return 365;
  }
}

// Map job types
function mapJobType(type) {
  const mapping = {
    'fulltime': 'Full-time',
    'parttime': 'Part-time',
    'contract': 'Contract',
    'internship': 'Internship'
  };
  return mapping[type] || type;
}

// Filter mock jobs based on criteria
function filterMockJobs(jobs, filters) {
  return jobs.filter(job => {
    // Query/title filter
    if (filters.query) {
      const queryLower = filters.query.toLowerCase();
      const titleMatch = job.title.toLowerCase().includes(queryLower);
      const descMatch = job.description.toLowerCase().includes(queryLower);
      const companyMatch = job.company.toLowerCase().includes(queryLower);
      if (!titleMatch && !descMatch && !companyMatch) return false;
    }

    // Skills filter
    if (filters.skills && filters.skills.length > 0) {
      const jobSkillsLower = job.skills.map(s => s.toLowerCase());
      const hasMatchingSkill = filters.skills.some(skill => 
        jobSkillsLower.some(js => js.includes(skill.toLowerCase()))
      );
      if (!hasMatchingSkill) return false;
    }

    // Date posted filter
    const maxDays = getMaxDaysOld(filters.datePosted);
    const postedDate = new Date(job.postedDate);
    const daysSincePosted = (Date.now() - postedDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSincePosted > maxDays) return false;

    // Job type filter
    if (filters.jobType) {
      const expectedType = mapJobType(filters.jobType);
      if (job.jobType !== expectedType) return false;
    }

    // Work mode filter
    if (filters.workMode) {
      const expectedMode = filters.workMode.charAt(0).toUpperCase() + filters.workMode.slice(1);
      if (job.workMode.toLowerCase() !== expectedMode.toLowerCase()) return false;
    }

    // Location filter
    if (filters.location) {
      if (!job.location.toLowerCase().includes(filters.location.toLowerCase())) return false;
    }

    return true;
  });
}

// Fetch jobs from Adzuna API or return mock data
export async function fetchJobsFromAdzuna(filters) {
  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;

  // Use mock data if no API keys configured
  if (!appId || !appKey || appId === 'your_adzuna_app_id') {
    console.log('Using mock job data (Adzuna API keys not configured)');
    const filtered = filterMockJobs(mockJobs, filters);
    return filtered;
  }

  try {
    // Build Adzuna API URL
    const params = new URLSearchParams({
      app_id: appId,
      app_key: appKey,
      results_per_page: filters.limit || 20,
      'max_days_old': getMaxDaysOld(filters.datePosted)
    });

    // Add search terms
    if (filters.query) {
      params.append('what', filters.query);
    }
    if (filters.skills && filters.skills.length > 0) {
      const what = params.get('what') || '';
      params.set('what', what + ' ' + filters.skills.join(' '));
    }
    if (filters.location) {
      params.append('where', filters.location);
    }

    // Contract type
    if (filters.jobType === 'fulltime') {
      params.append('full_time', '1');
    } else if (filters.jobType === 'parttime') {
      params.append('part_time', '1');
    } else if (filters.jobType === 'contract') {
      params.append('contract', '1');
    }

    const url = `${ADZUNA_BASE_URL}/jobs/${ADZUNA_COUNTRY}/search/${filters.page || 1}?${params}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error('Adzuna API error:', response.status);
      return filterMockJobs(mockJobs, filters);
    }

    const data = await response.json();

    // Transform Adzuna response to our format
    return data.results.map(job => ({
      id: job.id,
      title: job.title,
      company: job.company?.display_name || 'Unknown Company',
      location: job.location?.display_name || 'Unknown Location',
      description: job.description || '',
      jobType: job.contract_type || 'Full-time',
      workMode: job.description?.toLowerCase().includes('remote') ? 'Remote' : 
                job.description?.toLowerCase().includes('hybrid') ? 'Hybrid' : 'On-site',
      salary: job.salary_min && job.salary_max ? 
              `£${job.salary_min.toLocaleString()} - £${job.salary_max.toLocaleString()}` : 
              'Salary not specified',
      postedDate: job.created,
      applyUrl: job.redirect_url,
      skills: [] // Adzuna doesn't provide skills directly
    }));
  } catch (error) {
    console.error('Error fetching from Adzuna:', error);
    return filterMockJobs(mockJobs, filters);
  }
}

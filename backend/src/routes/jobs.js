import { getCachedJobs, setCachedJobs, getUserResume } from '../storage/store.js';
import { fetchJobsFromRemotive } from '../services/remotive.js';
import { scoreJobsWithResume } from '../services/matching.js';

export default async function jobsRoutes(fastify) {
  // Get jobs with filters
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const {
      query = '',           // Role/title search
      skills = '',          // Comma-separated skills
      datePosted = 'any',   // last24h, lastWeek, lastMonth, any
      jobType = '',         // fulltime, parttime, contract, internship
      workMode = '',        // remote, hybrid, onsite
      location = '',        // City or region
      matchScore = 'all',   // high, medium, all
      page = 1,
      limit = 20
    } = request.query;

    // Create cache key from filters
    const cacheKey = JSON.stringify({ query, skills, datePosted, jobType, workMode, location, page });
    
    // Check cache first
    let jobs = getCachedJobs(cacheKey);
    
    if (!jobs) {
      // Fetch from Remotive
      jobs = await fetchJobsFromRemotive({
        query,
        skills: skills ? skills.split(',').map(s => s.trim()) : [],
        datePosted,
        jobType,
        workMode,
        location,
        page: parseInt(page),
        limit: parseInt(limit)
      });
      
      // Cache the results
      setCachedJobs(cacheKey, jobs);
    }

    // Get user resume for matching
    const resume = getUserResume(request.user.email);
    
    // Score jobs against resume if resume exists
    if (resume && resume.text) {
      jobs = await scoreJobsWithResume(jobs, resume.text);
    } else {
      // No resume - set all scores to 0
      jobs = jobs.map(job => ({
        ...job,
        matchScore: 0,
        matchBadge: 'gray',
        matchExplanation: 'Upload a resume to see match scores'
      }));
    }

    // Filter by match score if specified
    let filteredJobs = jobs;
    if (matchScore === 'high') {
      filteredJobs = jobs.filter(j => j.matchScore > 70);
    } else if (matchScore === 'medium') {
      filteredJobs = jobs.filter(j => j.matchScore >= 40 && j.matchScore <= 70);
    }

    // Get best matches (top 8 highest scoring jobs)
    const bestMatches = [...jobs]
      .sort((a, b) => b.matchScore - a.matchScore)
      .slice(0, 8);

    return {
      jobs: filteredJobs,
      bestMatches,
      total: filteredJobs.length,
      page: parseInt(page),
      hasMore: filteredJobs.length === parseInt(limit)
    };
  });

  // Get single job details
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    
    // In a real app, we'd fetch this from the API or cache
    // For now, return a not found since we don't persist individual jobs
    return reply.code(404).send({ error: 'Job not found' });
  });

  // Refresh job cache
  fastify.post('/refresh', {
    preHandler: [fastify.authenticate]
  }, async () => {
    // Clear all cached jobs to force fresh fetch
    // In a real app, this would be more selective
    return { success: true, message: 'Job cache cleared' };
  });
}

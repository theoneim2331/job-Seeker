import { 
  createApplication, 
  getApplicationsByUser, 
  getApplication,
  updateApplicationStatus,
  findExistingApplication 
} from '../storage/store.js';

export default async function applicationsRoutes(fastify) {
  // Get all applications for current user
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const applications = getApplicationsByUser(request.user.userId);
    return { applications };
  });

  // Create new application
  fastify.post('/', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { jobId, jobTitle, company, location, jobUrl, matchScore } = request.body || {};
    
    if (!jobId || !jobTitle || !company) {
      return reply.code(400).send({ error: 'Job details are required' });
    }

    // Check if already applied
    const existing = findExistingApplication(request.user.userId, jobId);
    if (existing) {
      return reply.code(409).send({ 
        error: 'Already applied to this job',
        application: existing 
      });
    }

    const application = createApplication({
      userId: request.user.userId,
      jobId,
      jobTitle,
      company,
      location,
      jobUrl,
      matchScore
    });

    return { success: true, application };
  });

  // Get single application
  fastify.get('/:id', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const application = getApplication(id);
    
    if (!application) {
      return reply.code(404).send({ error: 'Application not found' });
    }

    if (application.userId !== request.user.userId) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    return { application };
  });

  // Update application status
  fastify.patch('/:id/status', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    const { id } = request.params;
    const { status, note } = request.body || {};
    
    const validStatuses = ['applied', 'interview', 'offer', 'rejected', 'withdrawn'];
    if (!status || !validStatuses.includes(status)) {
      return reply.code(400).send({ 
        error: `Invalid status. Must be one of: ${validStatuses.join(', ')}` 
      });
    }

    const application = getApplication(id);
    
    if (!application) {
      return reply.code(404).send({ error: 'Application not found' });
    }

    if (application.userId !== request.user.userId) {
      return reply.code(403).send({ error: 'Access denied' });
    }

    const updated = updateApplicationStatus(id, status, note);
    return { success: true, application: updated };
  });

  // Check if already applied to a job
  fastify.get('/check/:jobId', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const { jobId } = request.params;
    const existing = findExistingApplication(request.user.userId, jobId);
    
    return { 
      applied: !!existing,
      application: existing || null
    };
  });
}

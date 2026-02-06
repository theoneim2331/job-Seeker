import Fastify from 'fastify';
import cors from '@fastify/cors';
import multipart from '@fastify/multipart';

// Import routes
import authRoutes from './routes/auth.js';
import jobsRoutes from './routes/jobs.js';
import resumeRoutes from './routes/resume.js';
import applicationsRoutes from './routes/applications.js';
import assistantRoutes from './routes/assistant.js';

const fastify = Fastify({
  logger: true
});

// Register plugins
await fastify.register(cors, {
  origin: true, // Allow all origins in development
  credentials: true
});

await fastify.register(multipart, {
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB max file size
  }
});

// Authentication middleware
fastify.decorate('authenticate', async function (request, reply) {
  const authHeader = request.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    reply.code(401).send({ error: 'Unauthorized' });
    return;
  }
  
  const token = authHeader.substring(7);
  const { getSession } = await import('./storage/store.js');
  const session = getSession(token);
  
  if (!session) {
    reply.code(401).send({ error: 'Invalid or expired token' });
    return;
  }
  
  request.user = session;
});

// Register routes
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(jobsRoutes, { prefix: '/api/jobs' });
fastify.register(resumeRoutes, { prefix: '/api/resume' });
fastify.register(applicationsRoutes, { prefix: '/api/applications' });
fastify.register(assistantRoutes, { prefix: '/api/assistant' });

// Health check endpoint
fastify.get('/api/health', async () => {
  return { status: 'ok', timestamp: new Date().toISOString() };
});

// Root endpoint
fastify.get('/', async () => {
  return { 
    name: 'JobMatch AI Backend',
    version: '1.0.0',
    endpoints: ['/api/auth', '/api/jobs', '/api/resume', '/api/applications', '/api/assistant']
  };
});

// Start server
const start = async () => {
  try {
    const port = process.env.PORT || 3001;
    await fastify.listen({ port, host: '0.0.0.0' });
    console.log(`🚀 Server running at http://localhost:${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();

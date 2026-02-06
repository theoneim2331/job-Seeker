import { getUser, createSession, deleteSession } from '../storage/store.js';

export default async function authRoutes(fastify) {
  // Login endpoint
  fastify.post('/login', async (request, reply) => {
    const { email, password } = request.body || {};
    
    if (!email || !password) {
      return reply.code(400).send({ error: 'Email and password are required' });
    }

    const user = getUser(email);
    
    if (!user || user.password !== password) {
      return reply.code(401).send({ error: 'Invalid email or password' });
    }

    const token = createSession(user.id, user.email);
    
    return {
      success: true,
      token,
      user: {
        id: user.id,
        email: user.email,
        hasResume: !!user.resumeText,
        resumeFileName: user.resumeFileName
      }
    };
  });

  // Logout endpoint
  fastify.post('/logout', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const authHeader = request.headers.authorization;
    const token = authHeader.substring(7);
    deleteSession(token);
    return { success: true };
  });

  // Get current user
  fastify.get('/me', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const user = getUser(request.user.email);
    if (!user) {
      return { error: 'User not found' };
    }
    return {
      id: user.id,
      email: user.email,
      hasResume: !!user.resumeText,
      resumeFileName: user.resumeFileName
    };
  });
}

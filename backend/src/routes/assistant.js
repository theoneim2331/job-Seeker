import { processAssistantMessage, getConversationStarters } from '../services/assistant.js';
import { getChatHistory, addChatMessage, clearChatHistory } from '../storage/store.js';

export default async function assistantRoutes(fastify) {
  // Send message to AI assistant
  fastify.post('/chat', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const { message } = request.body || {};
    
    if (!message || typeof message !== 'string') {
      return { error: 'Message is required' };
    }

    const userId = request.user.userId;
    
    // Get conversation history
    const history = getChatHistory(userId);
    
    // Add user message to history
    addChatMessage(userId, { role: 'user', content: message, timestamp: new Date().toISOString() });
    
    // Process message
    const result = await processAssistantMessage(message, history);
    
    // Add assistant response to history
    addChatMessage(userId, { 
      role: 'assistant', 
      content: result.response, 
      type: result.type,
      timestamp: new Date().toISOString() 
    });

    return {
      type: result.type,
      response: result.response,
      filters: result.filters || null,
      searchResults: result.searchResults || null
    };
  });

  // Get conversation history
  fastify.get('/history', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const history = getChatHistory(request.user.userId);
    return { history };
  });

  // Clear conversation history
  fastify.delete('/history', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    clearChatHistory(request.user.userId);
    return { success: true };
  });

  // Get conversation starters
  fastify.get('/starters', async () => {
    return { starters: getConversationStarters() };
  });
}

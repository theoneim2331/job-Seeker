import { updateUserResume, getUserResume } from '../storage/store.js';
import pdf from 'pdf-parse/lib/pdf-parse.js';

export default async function resumeRoutes(fastify) {
  // Upload resume
  fastify.post('/upload', {
    preHandler: [fastify.authenticate]
  }, async (request, reply) => {
    try {
      const data = await request.file();
      
      if (!data) {
        return reply.code(400).send({ error: 'No file uploaded' });
      }

      const fileName = data.filename;
      const mimeType = data.mimetype;
      
      // Validate file type
      const allowedTypes = ['application/pdf', 'text/plain'];
      if (!allowedTypes.includes(mimeType)) {
        return reply.code(400).send({ 
          error: 'Invalid file type. Only PDF and TXT files are allowed.' 
        });
      }

      // Read file buffer
      const chunks = [];
      for await (const chunk of data.file) {
        chunks.push(chunk);
      }
      const buffer = Buffer.concat(chunks);

      let resumeText = '';

      // Extract text based on file type
      if (mimeType === 'application/pdf') {
        try {
          const pdfData = await pdf(buffer);
          resumeText = pdfData.text;
        } catch (pdfError) {
          console.error('PDF parsing error:', pdfError);
          return reply.code(400).send({ 
            error: 'Could not parse PDF. Please ensure it contains readable text.' 
          });
        }
      } else {
        // Plain text file
        resumeText = buffer.toString('utf-8');
      }

      if (!resumeText || resumeText.trim().length < 50) {
        return reply.code(400).send({ 
          error: 'Resume appears to be empty or too short. Please upload a valid resume.' 
        });
      }

      // Store resume text
      const success = updateUserResume(request.user.email, resumeText.trim(), fileName);
      
      if (!success) {
        return reply.code(500).send({ error: 'Failed to save resume' });
      }

      return {
        success: true,
        fileName,
        textLength: resumeText.length,
        preview: resumeText.substring(0, 200) + '...'
      };
    } catch (error) {
      console.error('Resume upload error:', error);
      return reply.code(500).send({ error: 'Failed to process resume' });
    }
  });

  // Get current resume info
  fastify.get('/', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const resume = getUserResume(request.user.email);
    
    if (!resume || !resume.text) {
      return { hasResume: false };
    }

    return {
      hasResume: true,
      fileName: resume.fileName,
      textLength: resume.text.length,
      preview: resume.text.substring(0, 300) + '...'
    };
  });

  // Delete resume
  fastify.delete('/', {
    preHandler: [fastify.authenticate]
  }, async (request) => {
    const success = updateUserResume(request.user.email, null, null);
    return { success };
  });
}

// LangChain-powered Job Matching Service
// Scores jobs against user resume using embeddings and LLM analysis

import { ChatOpenAI, OpenAIEmbeddings } from '@langchain/openai';
import { HumanMessage, SystemMessage } from '@langchain/core/messages';

// Initialize OpenAI clients (lazy initialization)
let embeddings = null;
let chatModel = null;

function getEmbeddings() {
  if (!embeddings && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
    embeddings = new OpenAIEmbeddings({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'text-embedding-3-small'
    });
  }
  return embeddings;
}

function getChatModel() {
  if (!chatModel && process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY !== 'your_openai_api_key') {
    chatModel = new ChatOpenAI({
      openAIApiKey: process.env.OPENAI_API_KEY,
      modelName: 'gpt-4o-mini',
      temperature: 0.3
    });
  }
  return chatModel;
}

// Calculate cosine similarity between two vectors
function cosineSimilarity(vecA, vecB) {
  const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
  const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
  const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
  return dotProduct / (magnitudeA * magnitudeB);
}

// Get match badge based on score
function getMatchBadge(score) {
  if (score > 70) return 'green';
  if (score >= 40) return 'yellow';
  return 'gray';
}

// Generate match explanation using LLM
async function generateMatchExplanation(jobTitle, jobDescription, resumeText, score) {
  const model = getChatModel();
  
  if (!model) {
    // Return mock explanation if no API key
    return generateMockExplanation(score);
  }

  try {
    const systemPrompt = `You are a job matching assistant. Analyze the match between a job and a resume.
Return a brief explanation (2-3 sentences) of why this is a good/poor match.
Focus on: matching skills, relevant experience, and keyword alignment.
Be specific and concise.`;

    const humanPrompt = `Job: ${jobTitle}
Description: ${jobDescription.substring(0, 500)}...

Resume excerpt: ${resumeText.substring(0, 500)}...

Match score: ${score}%

Provide a brief explanation for this match score.`;

    const response = await model.invoke([
      new SystemMessage(systemPrompt),
      new HumanMessage(humanPrompt)
    ]);

    return response.content;
  } catch (error) {
    console.error('Error generating explanation:', error);
    return generateMockExplanation(score);
  }
}

// Mock explanation generator
function generateMockExplanation(score) {
  if (score > 70) {
    return 'Strong match! Your skills and experience align well with this role. Key qualifications match the job requirements.';
  } else if (score >= 40) {
    return 'Moderate match. Some of your skills are relevant, but additional qualifications may be beneficial.';
  } else {
    return 'Lower match score. This role may require skills or experience not prominently featured in your resume.';
  }
}

// Mock scoring based on keyword matching
function calculateMockScore(job, resumeText) {
  const resumeLower = resumeText.toLowerCase();
  const jobText = `${job.title} ${job.description} ${(job.skills || []).join(' ')}`.toLowerCase();
  
  // Extract keywords from job
  const keywords = [
    ...job.title.toLowerCase().split(/\s+/),
    ...(job.skills || []).map(s => s.toLowerCase())
  ];

  // Count matches
  let matches = 0;
  keywords.forEach(keyword => {
    if (keyword.length > 2 && resumeLower.includes(keyword)) {
      matches++;
    }
  });

  // Calculate score (0-100)
  const maxPossible = Math.min(keywords.length, 10);
  const rawScore = (matches / maxPossible) * 100;
  
  // Add some randomness for variety
  const variance = (Math.random() - 0.5) * 20;
  const finalScore = Math.max(0, Math.min(100, Math.round(rawScore + variance)));
  
  return finalScore;
}

// Main function: Score all jobs against resume
export async function scoreJobsWithResume(jobs, resumeText) {
  const embeddingsClient = getEmbeddings();
  
  if (!embeddingsClient) {
    // Use mock scoring if no OpenAI key
    console.log('Using mock job scoring (OpenAI API key not configured)');
    return jobs.map(job => {
      const score = calculateMockScore(job, resumeText);
      return {
        ...job,
        matchScore: score,
        matchBadge: getMatchBadge(score),
        matchExplanation: generateMockExplanation(score)
      };
    });
  }

  try {
    // Generate resume embedding
    const resumeEmbedding = await embeddingsClient.embedQuery(
      resumeText.substring(0, 8000) // Limit to avoid token limits
    );

    // Score each job
    const scoredJobs = await Promise.all(jobs.map(async (job) => {
      try {
        // Generate job embedding
        const jobText = `${job.title} ${job.description}`;
        const jobEmbedding = await embeddingsClient.embedQuery(
          jobText.substring(0, 4000)
        );

        // Calculate similarity
        const similarity = cosineSimilarity(resumeEmbedding, jobEmbedding);
        const score = Math.round(similarity * 100);

        // Generate explanation for high-scoring matches
        let explanation = generateMockExplanation(score);
        if (score > 50) {
          explanation = await generateMatchExplanation(
            job.title, 
            job.description, 
            resumeText, 
            score
          );
        }

        return {
          ...job,
          matchScore: score,
          matchBadge: getMatchBadge(score),
          matchExplanation: explanation
        };
      } catch (error) {
        console.error('Error scoring job:', job.id, error);
        const fallbackScore = calculateMockScore(job, resumeText);
        return {
          ...job,
          matchScore: fallbackScore,
          matchBadge: getMatchBadge(fallbackScore),
          matchExplanation: generateMockExplanation(fallbackScore)
        };
      }
    }));

    return scoredJobs;
  } catch (error) {
    console.error('Error in scoreJobsWithResume:', error);
    // Fallback to mock scoring
    return jobs.map(job => {
      const score = calculateMockScore(job, resumeText);
      return {
        ...job,
        matchScore: score,
        matchBadge: getMatchBadge(score),
        matchExplanation: generateMockExplanation(score)
      };
    });
  }
}

// Score a single job (for on-demand scoring)
export async function scoreSingleJob(job, resumeText) {
  const result = await scoreJobsWithResume([job], resumeText);
  return result[0];
}

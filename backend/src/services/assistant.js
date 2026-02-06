// LangGraph-powered AI Assistant Service
// Handles natural language queries, filter control, and help

import { ChatOpenAI } from '@langchain/openai';
import { HumanMessage, SystemMessage, AIMessage } from '@langchain/core/messages';
import { StateGraph, END } from '@langchain/langgraph';
import { z } from 'zod';

// Filter schema for structured output
const FilterSchema = z.object({
  query: z.string().optional().describe('Search query for job title/role'),
  skills: z.array(z.string()).optional().describe('Skills to filter by'),
  datePosted: z.enum(['last24h', 'lastWeek', 'lastMonth', 'any']).optional(),
  jobType: z.enum(['fulltime', 'parttime', 'contract', 'internship', '']).optional(),
  workMode: z.enum(['remote', 'hybrid', 'onsite', '']).optional(),
  location: z.string().optional(),
  matchScore: z.enum(['high', 'medium', 'all']).optional(),
  clearAll: z.boolean().optional().describe('Set to true to clear all filters')
});

// State type for the graph
const graphState = {
  messages: [],
  intent: null,
  filters: null,
  response: null,
  searchResults: null
};

// Initialize chat model (lazy)
let chatModel = null;

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

// Intent detection prompts
const INTENT_SYSTEM_PROMPT = `You are an AI assistant for a job tracking application. 
Analyze the user's message and determine their intent.

Possible intents:
- "filter": User wants to update job filters (e.g., "show remote jobs", "filter by React", "clear filters")
- "search": User wants to search for specific jobs (e.g., "find ML engineer roles")
- "help": User has questions about the app (e.g., "how do I upload resume?", "where are my applications?")
- "chat": General conversation or unclear intent

Respond with ONLY the intent word: filter, search, help, or chat`;

const FILTER_SYSTEM_PROMPT = `You are a filter extraction assistant for a job search app.
Extract the filters from the user's message and return them as JSON.

Available filters:
- query: Search term for job title (e.g., "React developer", "ML engineer")
- skills: Array of skills (e.g., ["React", "Node.js", "Python"])
- datePosted: One of "last24h", "lastWeek", "lastMonth", "any"
- jobType: One of "fulltime", "parttime", "contract", "internship"
- workMode: One of "remote", "hybrid", "onsite"
- location: City or region name
- matchScore: One of "high" (>70%), "medium" (40-70%), "all"
- clearAll: true if user wants to reset all filters

Example inputs and outputs:
"Show me remote React jobs" -> {"workMode": "remote", "skills": ["React"]}
"Filter by last 24 hours" -> {"datePosted": "last24h"}
"Clear all filters" -> {"clearAll": true}
"Full-time senior roles in London" -> {"jobType": "fulltime", "query": "senior", "location": "London"}
"High match scores only" -> {"matchScore": "high"}

Return ONLY valid JSON, no markdown or explanation.`;

const HELP_RESPONSES = {
  resume: "To upload your resume, click on your profile icon in the top-right corner, then select 'Upload Resume'. You can upload a PDF or TXT file. Your resume is used to calculate match scores for each job.",
  applications: "To view your applications, click on 'Applications' in the navigation menu. You'll see all jobs you've applied to, along with their status and timeline. You can update the status of each application (Applied → Interview → Offer/Rejected).",
  matching: "Job matching works by analyzing your resume and comparing it to each job description. We use AI to identify matching skills, experience, and keywords. Jobs with a green badge (>70%) are great matches, yellow (40-70%) are moderate, and gray (<40%) may need additional qualifications.",
  filters: "You can filter jobs using the sidebar on the left. Available filters include: Role/Title search, Skills (multi-select), Date Posted, Job Type, Work Mode, Location, and Match Score. You can also ask me to apply filters using natural language!",
  apply: "To apply for a job, click the 'Apply' button on any job card. This will open the external application page. When you return, we'll ask if you completed the application so we can track it for you."
};

// Mock responses for when no API key is available
function getMockResponse(message, history) {
  const msgLower = message.toLowerCase();
  
  // Help intents
  if (msgLower.includes('resume') || msgLower.includes('upload')) {
    return { type: 'help', response: HELP_RESPONSES.resume };
  }
  if (msgLower.includes('application') || msgLower.includes('applied')) {
    return { type: 'help', response: HELP_RESPONSES.applications };
  }
  if (msgLower.includes('match') || msgLower.includes('score')) {
    return { type: 'help', response: HELP_RESPONSES.matching };
  }
  if (msgLower.includes('filter') && msgLower.includes('how')) {
    return { type: 'help', response: HELP_RESPONSES.filters };
  }
  if (msgLower.includes('apply') && msgLower.includes('how')) {
    return { type: 'help', response: HELP_RESPONSES.apply };
  }

  // Filter intents
  if (msgLower.includes('remote')) {
    return { 
      type: 'filter', 
      filters: { workMode: 'remote' }, 
      response: "I've updated the filter to show remote jobs only." 
    };
  }
  if (msgLower.includes('hybrid')) {
    return { 
      type: 'filter', 
      filters: { workMode: 'hybrid' }, 
      response: "I've filtered to show hybrid work opportunities." 
    };
  }
  if (msgLower.includes('on-site') || msgLower.includes('onsite')) {
    return { 
      type: 'filter', 
      filters: { workMode: 'onsite' }, 
      response: "I've updated the filter to show on-site positions." 
    };
  }
  if (msgLower.includes('last 24') || msgLower.includes('today')) {
    return { 
      type: 'filter', 
      filters: { datePosted: 'last24h' }, 
      response: "Showing jobs posted in the last 24 hours." 
    };
  }
  if (msgLower.includes('last week') || msgLower.includes('this week')) {
    return { 
      type: 'filter', 
      filters: { datePosted: 'lastWeek' }, 
      response: "Showing jobs from the past week." 
    };
  }
  if (msgLower.includes('last month')) {
    return { 
      type: 'filter', 
      filters: { datePosted: 'lastMonth' }, 
      response: "Showing jobs from the past month." 
    };
  }
  if (msgLower.includes('full-time') || msgLower.includes('fulltime')) {
    return { 
      type: 'filter', 
      filters: { jobType: 'fulltime' }, 
      response: "Filtering to full-time positions only." 
    };
  }
  if (msgLower.includes('part-time') || msgLower.includes('parttime')) {
    return { 
      type: 'filter', 
      filters: { jobType: 'parttime' }, 
      response: "Showing part-time opportunities." 
    };
  }
  if (msgLower.includes('contract')) {
    return { 
      type: 'filter', 
      filters: { jobType: 'contract' }, 
      response: "Filtering to contract positions." 
    };
  }
  if (msgLower.includes('internship') || msgLower.includes('intern')) {
    return { 
      type: 'filter', 
      filters: { jobType: 'internship' }, 
      response: "Showing internship opportunities." 
    };
  }
  if (msgLower.includes('high') && (msgLower.includes('match') || msgLower.includes('score'))) {
    return { 
      type: 'filter', 
      filters: { matchScore: 'high' }, 
      response: "Showing only high-match jobs (>70% match score)." 
    };
  }
  if (msgLower.includes('clear') && msgLower.includes('filter')) {
    return { 
      type: 'filter', 
      filters: { clearAll: true }, 
      response: "All filters have been cleared. Showing all jobs." 
    };
  }

  // Skills extraction
  const skillKeywords = ['react', 'node', 'python', 'javascript', 'typescript', 'java', 'go', 'rust', 'aws', 'docker', 'kubernetes', 'sql', 'mongodb', 'pytorch', 'tensorflow', 'ml', 'machine learning', 'data science', 'vue', 'angular'];
  const foundSkills = skillKeywords.filter(skill => msgLower.includes(skill));
  if (foundSkills.length > 0) {
    return { 
      type: 'filter', 
      filters: { skills: foundSkills.map(s => s.charAt(0).toUpperCase() + s.slice(1)) }, 
      response: `Filtering jobs that require: ${foundSkills.join(', ')}` 
    };
  }

  // Location detection (simplified)
  const cities = ['london', 'manchester', 'birmingham', 'leeds', 'glasgow', 'edinburgh', 'bristol', 'cambridge', 'oxford', 'bangalore', 'mumbai', 'new york', 'san francisco'];
  const foundCity = cities.find(city => msgLower.includes(city));
  if (foundCity) {
    return { 
      type: 'filter', 
      filters: { location: foundCity.charAt(0).toUpperCase() + foundCity.slice(1) }, 
      response: `Filtering jobs in ${foundCity.charAt(0).toUpperCase() + foundCity.slice(1)}.` 
    };
  }

  // Default response
  return { 
    type: 'chat', 
    response: "I can help you search and filter jobs, or answer questions about the application. Try asking me things like:\n• 'Show remote Python jobs'\n• 'Filter by last 24 hours'\n• 'How do I upload my resume?'\n• 'Clear all filters'" 
  };
}

// Process message with LangGraph
async function processWithLangGraph(message, history) {
  const model = getChatModel();
  
  if (!model) {
    // Use mock processing if no API key
    return getMockResponse(message, history);
  }

  try {
    // Step 1: Detect intent
    const intentResponse = await model.invoke([
      new SystemMessage(INTENT_SYSTEM_PROMPT),
      ...history.slice(-6).map(m => 
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
      new HumanMessage(message)
    ]);
    
    const intent = intentResponse.content.toLowerCase().trim();

    // Step 2: Process based on intent
    if (intent === 'filter' || intent === 'search') {
      // Extract filters
      const filterResponse = await model.invoke([
        new SystemMessage(FILTER_SYSTEM_PROMPT),
        new HumanMessage(message)
      ]);
      
      let filters = {};
      try {
        // Clean the response and parse JSON
        let jsonStr = filterResponse.content.trim();
        jsonStr = jsonStr.replace(/```json?\n?/g, '').replace(/```/g, '').trim();
        filters = JSON.parse(jsonStr);
      } catch (e) {
        console.error('Failed to parse filter JSON:', e);
        // Fall back to mock filter extraction
        return getMockResponse(message, history);
      }

      // Generate friendly response
      let responseText = "I've updated the filters. ";
      if (filters.clearAll) {
        responseText = "All filters have been cleared. Showing all jobs.";
      } else {
        const parts = [];
        if (filters.workMode) parts.push(`${filters.workMode} jobs`);
        if (filters.skills?.length) parts.push(`skills: ${filters.skills.join(', ')}`);
        if (filters.datePosted) parts.push(`posted ${filters.datePosted.replace('last', 'in the last ').replace('any', 'anytime')}`);
        if (filters.jobType) parts.push(`${filters.jobType} positions`);
        if (filters.location) parts.push(`in ${filters.location}`);
        if (filters.matchScore) parts.push(`${filters.matchScore} match scores`);
        if (parts.length) responseText = `Showing ${parts.join(', ')}.`;
      }

      return { type: 'filter', filters, response: responseText };
    }

    if (intent === 'help') {
      // Generate help response
      const helpResponse = await model.invoke([
        new SystemMessage(`You are a helpful assistant for a job tracking app. Answer the user's question concisely.
        
The app features:
- Job feed with search and filters
- Resume upload for AI matching
- Match scores (0-100%) showing job fit
- Application tracking with status updates
- AI assistant (you!) for help and filter control

Keep responses under 3 sentences.`),
        new HumanMessage(message)
      ]);
      
      return { type: 'help', response: helpResponse.content };
    }

    // Default: general chat
    const chatResponse = await model.invoke([
      new SystemMessage(`You are a friendly AI assistant for a job tracking app. 
Help users find jobs, explain features, or just chat.
Keep responses concise and helpful.
You can suggest using filters like: "Show remote jobs" or "Filter by Python"
Or ask for help with app features.`),
      ...history.slice(-4).map(m => 
        m.role === 'user' ? new HumanMessage(m.content) : new AIMessage(m.content)
      ),
      new HumanMessage(message)
    ]);

    return { type: 'chat', response: chatResponse.content };

  } catch (error) {
    console.error('LangGraph processing error:', error);
    return getMockResponse(message, history);
  }
}

// Main export: Process a user message
export async function processAssistantMessage(message, history = []) {
  return await processWithLangGraph(message, history);
}

// Get conversation starters
export function getConversationStarters() {
  return [
    "Show me remote jobs",
    "Filter by Python and ML",
    "How does job matching work?",
    "Show high-match jobs only"
  ];
}

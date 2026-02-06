// In-memory data store for the job tracker application
// In production, this would be replaced with a database like PostgreSQL or MongoDB

const store = {
  // Users storage - keyed by email
  users: new Map([
    ['test@gmail.com', {
      id: 'user-1',
      email: 'test@gmail.com',
      password: 'test@123', // In production, this would be hashed
      resumeText: null,
      resumeFileName: null,
      createdAt: new Date().toISOString()
    }]
  ]),

  // Active sessions - keyed by token
  sessions: new Map(),

  // Job cache - keyed by cache key (filters hash)
  jobCache: new Map(),
  jobCacheExpiry: 15 * 60 * 1000, // 15 minutes

  // Applications - keyed by application ID
  applications: new Map(),

  // Chat history - keyed by user ID
  chatHistory: new Map()
};

// User operations
export function getUser(email) {
  return store.users.get(email);
}

export function updateUserResume(email, resumeText, fileName) {
  const user = store.users.get(email);
  if (user) {
    user.resumeText = resumeText;
    user.resumeFileName = fileName;
    user.updatedAt = new Date().toISOString();
    store.users.set(email, user);
    return true;
  }
  return false;
}

export function getUserResume(email) {
  const user = store.users.get(email);
  return user ? { text: user.resumeText, fileName: user.resumeFileName } : null;
}

// Session operations
export function createSession(userId, email) {
  const token = `token-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  store.sessions.set(token, { userId, email, createdAt: new Date().toISOString() });
  return token;
}

export function getSession(token) {
  return store.sessions.get(token);
}

export function deleteSession(token) {
  return store.sessions.delete(token);
}

// Job cache operations
export function getCachedJobs(cacheKey) {
  const cached = store.jobCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < store.jobCacheExpiry) {
    return cached.jobs;
  }
  // Expired or not found
  store.jobCache.delete(cacheKey);
  return null;
}

export function setCachedJobs(cacheKey, jobs) {
  store.jobCache.set(cacheKey, { jobs, timestamp: Date.now() });
}

// Application operations
export function createApplication(data) {
  const id = `app-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  const application = {
    id,
    ...data,
    status: 'applied',
    timeline: [
      { status: 'applied', timestamp: new Date().toISOString(), note: 'Applied to position' }
    ],
    createdAt: new Date().toISOString()
  };
  store.applications.set(id, application);
  return application;
}

export function getApplicationsByUser(userId) {
  const apps = [];
  for (const [, app] of store.applications) {
    if (app.userId === userId) {
      apps.push(app);
    }
  }
  return apps.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getApplication(id) {
  return store.applications.get(id);
}

export function updateApplicationStatus(id, status, note = '') {
  const app = store.applications.get(id);
  if (app) {
    app.status = status;
    app.timeline.push({
      status,
      timestamp: new Date().toISOString(),
      note: note || `Status updated to ${status}`
    });
    app.updatedAt = new Date().toISOString();
    store.applications.set(id, app);
    return app;
  }
  return null;
}

export function findExistingApplication(userId, jobId) {
  for (const [, app] of store.applications) {
    if (app.userId === userId && app.jobId === jobId) {
      return app;
    }
  }
  return null;
}

// Chat history operations
export function getChatHistory(userId) {
  return store.chatHistory.get(userId) || [];
}

export function addChatMessage(userId, message) {
  const history = store.chatHistory.get(userId) || [];
  history.push(message);
  // Keep last 50 messages
  if (history.length > 50) {
    history.shift();
  }
  store.chatHistory.set(userId, history);
}

export function clearChatHistory(userId) {
  store.chatHistory.delete(userId);
}

export default store;

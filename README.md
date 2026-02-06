# 🎯 JobMatch AI - Smart Job Tracker

An AI-powered job tracking platform with intelligent job matching and conversational AI assistant.

![JobMatch AI](https://img.shields.io/badge/JobMatch-AI%20Powered-6366f1)
![React](https://img.shields.io/badge/React-18.2-61dafb)
![Node.js](https://img.shields.io/badge/Node.js-20+-339933)
![License](https://img.shields.io/badge/License-MIT-green)

## 🌟 Features

- **🔍 Job Feed** - Browse jobs with smart filtering
- **🎯 AI Job Matching** - Resume-based match scores (0-100%)
- **💬 AI Assistant** - Natural language filter control
- **📊 Application Tracking** - Track status from Applied to Offer
- **📄 Resume Upload** - PDF/TXT parsing for matching

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Frontend (React + Vite)                    │
│  ┌───────────┐ ┌──────────────┐ ┌─────────────┐ ┌──────────────────┐│
│  │  Job Feed │ │ Filter Panel │ │ Resume Mgt  │ │ AI Chat Bubble   ││
│  └─────┬─────┘ └──────┬───────┘ └──────┬──────┘ └────────┬─────────┘│
│        │              │                │                  │          │
│        └──────────────┴────────────────┴──────────────────┘          │
│                              ▼                                        │
│                    FilterContext (Shared State)                       │
└─────────────────────────────────┬───────────────────────────────────┘
                                  │ REST API
                                  ▼
┌─────────────────────────────────────────────────────────────────────┐
│                     Backend (Node.js + Fastify)                      │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                        API Routes                             │   │
│  │  /auth  │  /jobs  │  /resume  │  /applications  │  /assistant│   │
│  └────┬────────┬────────────┬───────────────┬────────────┬──────┘   │
│       │        │            │               │            │           │
│       ▼        ▼            ▼               ▼            ▼           │
│  ┌─────────────────────────────────────────────────────────────┐    │
│  │                      Services Layer                          │    │
│  │  ┌──────────────┐  ┌─────────────────┐  ┌────────────────┐  │    │
│  │  │   Adzuna     │  │   LangChain     │  │   LangGraph    │  │    │
│  │  │  (Job API)   │  │ (Job Matching)  │  │ (AI Assistant) │  │    │
│  │  └──────┬───────┘  └────────┬────────┘  └───────┬────────┘  │    │
│  └─────────┼───────────────────┼───────────────────┼───────────┘    │
│            │                   │                   │                 │
│            ▼                   └─────────┬─────────┘                 │
│    External API                          ▼                           │
│                                   OpenAI API                         │
│                           (Embeddings + GPT-4)                       │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- npm or yarn
- OpenAI API key (optional, uses mock data without it)
- Adzuna API keys (optional, uses mock jobs without it)

### Local Setup

1. **Clone the repository**
```bash
git clone <your-repo-url>
cd job-tracker
```

2. **Backend Setup**
```bash
cd backend
cp .env.example .env
# Edit .env with your API keys (optional)
npm install
npm run dev
```

3. **Frontend Setup** (new terminal)
```bash
cd frontend
cp .env.example .env
npm install
npm run dev
```

4. **Open in browser**
```
http://localhost:5173
```

5. **Login with test credentials**
```
Email: test@gmail.com
Password: test@123
```

---

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=3001

# Adzuna Job API (optional - uses mock data if not set)
ADZUNA_APP_ID=your_app_id
ADZUNA_APP_KEY=your_app_key

# OpenAI API (optional - uses mock matching if not set)
OPENAI_API_KEY=your_openai_key
```

### Frontend (.env)
```env
VITE_API_URL=http://localhost:3001
```

---

## 🤖 LangChain Job Matching

### How It Works

1. **Resume Embedding**: When you upload a resume, we extract text and generate embeddings using OpenAI's `text-embedding-3-small` model

2. **Job Embeddings**: Each job description is also converted to an embedding vector

3. **Cosine Similarity**: We calculate the cosine similarity between resume and job embeddings:
   ```
   similarity = (resume · job) / (|resume| × |job|)
   ```

4. **Score Scaling**: Similarity (0-1) is scaled to 0-100% match score

5. **Match Explanation**: For high-scoring jobs, GPT-4 generates a brief explanation of why it's a good match

### Code Location
- `backend/src/services/matching.js` - LangChain matching logic

### Scoring Categories
| Score | Badge | Meaning |
|-------|-------|---------|
| >70% | 🟢 Green | Strong match |
| 40-70% | 🟡 Yellow | Moderate match |
| <40% | ⚪ Gray | Weak match |

---

## 🧠 LangGraph AI Assistant

### Architecture

```
User Message
     │
     ▼
┌─────────────────┐
│ Intent Detection │ ──→ filter / search / help / chat
└────────┬────────┘
         │
    ┌────┴────┬──────────┬────────┐
    ▼         ▼          ▼        ▼
┌──────┐ ┌───────┐ ┌──────┐ ┌──────┐
│Filter│ │Search │ │ Help │ │ Chat │
│Action│ │Action │ │Action│ │Action│
└──┬───┘ └───┬───┘ └──┬───┘ └──┬───┘
   │         │        │        │
   ▼         ▼        ▼        ▼
┌─────────────────────────────────┐
│      Response Generation         │
│  (+ Filter State for Frontend)   │
└─────────────────────────────────┘
```

### How AI Controls Filters

1. User says: "Show me remote Python jobs"
2. LangGraph detects intent: `filter`
3. Filter extraction: `{ workMode: "remote", skills: ["Python"] }`
4. Response returned with filters
5. Frontend `FilterContext` updates UI filters automatically

### Supported Commands

| Command | Example |
|---------|---------|
| Work Mode | "Show remote jobs", "Only on-site roles" |
| Skills | "Filter by React and Node.js" |
| Date | "Last 24 hours", "Posted this week" |
| Job Type | "Full-time only", "Show internships" |
| Match Score | "High match jobs only" |
| Location | "Jobs in London" |
| Clear | "Clear all filters", "Reset" |
| Help | "How do I upload my resume?" |

### Code Location
- `backend/src/services/assistant.js` - LangGraph logic
- `frontend/src/components/Assistant/ChatBubble.jsx` - Chat UI

---

## 📝 Apply Popup Flow

### Design Decision

When a user clicks "Apply", we open the external job link. The challenge: How do we know if they actually applied?

### Solution

1. User clicks Apply → External link opens in new tab
2. We attach a `visibilitychange` listener
3. When user returns to our app, we wait 1.5 seconds
4. Popup appears: "Did you apply to [Job] at [Company]?"

### Options
- **Yes, Applied** → Creates application record with timestamp
- **No, just browsing** → Dismisses popup
- **Applied Earlier** → Acknowledges but doesn't create duplicate

### Edge Cases Handled
- User opens multiple jobs → Last one triggers popup
- User closes tab immediately → Listener auto-cleans after 5 minutes
- Already applied → Shows "Applied" badge, button disabled

### Alternative Considered
- Browser extension to detect form submissions (too invasive)
- Timer-based assumption (inaccurate)
- Manual "Track Application" button (poor UX)

---

## 💬 AI Assistant UI Choice

### Decision: Floating Chat Bubble (Bottom-Right)

### Why Bubble over Sidebar?

| Aspect | Chat Bubble | Sidebar |
|--------|-------------|---------|
| Screen Real Estate | Minimal footprint | Takes 300-400px width |
| Mobile Experience | Works perfectly | Needs drawer pattern |
| Discoverability | Obvious call-to-action | Can be overlooked |
| Multitasking | Chat while viewing jobs | Covers content |
| Familiarity | Like Intercom/Drift | Less common for AI |

### UX Features
- Pulse animation draws attention
- Expandable with smooth animation
- Suggested queries for quick start
- Typing indicators
- Filter confirmation badges

---

## 📈 Scalability Considerations

### Current Implementation (Demo)

| Component | Current | Production Ready |
|-----------|---------|------------------|
| Storage | In-memory | PostgreSQL + Redis |
| Job Cache | 15-min local | Redis with TTL |
| Embeddings | On-demand | Pre-computed + Pinecone |
| API Calls | Direct | Queue + Rate limiting |

### Handling 100+ Jobs

```javascript
// Current: Client-side pagination
const [page, setPage] = useState(1);

// Production: Server-side with cursor
GET /api/jobs?cursor=abc123&limit=20
```

### Handling 10,000 Users

1. **Database**: PostgreSQL with connection pooling (PgBouncer)
2. **Caching**: Redis for sessions, job cache
3. **Queue**: BullMQ for embedding generation
4. **CDN**: CloudFront for static assets
5. **Horizontal Scaling**: Multiple backend instances behind load balancer

---

## ⚠️ Known Limitations & Tradeoffs

| Limitation | Reason | Improvement Path |
|------------|--------|------------------|
| In-memory storage | Demo simplicity | Add PostgreSQL |
| 250 API calls/day | Adzuna free tier | Production API key |
| No real applications | External links only | Partner integrations |
| Single resume | MVP requirement | Resume manager |
| No email notifications | Not in scope | SendGrid integration |

---

## 🧪 Testing

### Run Backend
```bash
cd backend && npm run dev
# Health check: curl http://localhost:3001/api/health
```

### Run Frontend
```bash
cd frontend && npm run dev
# Open: http://localhost:5173
```

### Manual Test Flow
1. Login with test credentials
2. Upload a sample resume (PDF/TXT)
3. Browse job feed, check match scores
4. Try AI assistant: "Show remote jobs"
5. Click Apply on a job, return and respond to popup
6. Check Applications dashboard

---

## 📂 Project Structure

```
job-tracker/
├── backend/
│   ├── src/
│   │   ├── index.js           # Fastify server
│   │   ├── routes/            # API endpoints
│   │   │   ├── auth.js
│   │   │   ├── jobs.js
│   │   │   ├── resume.js
│   │   │   ├── applications.js
│   │   │   └── assistant.js
│   │   ├── services/          # Business logic
│   │   │   ├── adzuna.js      # Job API
│   │   │   ├── matching.js    # LangChain
│   │   │   └── assistant.js   # LangGraph
│   │   └── storage/
│   │       └── store.js       # In-memory DB
│   ├── package.json
│   └── .env.example
│
└── frontend/
    ├── src/
    │   ├── main.jsx
    │   ├── App.jsx
    │   ├── index.css          # Design system
    │   ├── components/
    │   │   ├── Auth/
    │   │   ├── Layout/
    │   │   ├── Jobs/
    │   │   ├── Applications/
    │   │   ├── Resume/
    │   │   └── Assistant/
    │   ├── context/
    │   │   ├── AuthContext.jsx
    │   │   └── FilterContext.jsx
    │   └── services/
    │       └── api.js
    ├── package.json
    └── .env.example
```

---

## 🚀 Deployment

### Frontend (Vercel)
```bash
cd frontend
npx vercel
```

### Backend (Railway)
```bash
cd backend
# Connect to Railway and deploy
railway up
```

### Environment
Set all `.env` variables in deployment platform.

---

## 📜 License

MIT License - Feel free to use for learning and interviews!

---

## 👨‍💻 Author

Built with ❤️ for the AI Job Tracker Assignment

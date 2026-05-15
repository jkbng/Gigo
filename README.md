# ⚡ GigoAI — Single Deployment

One repo, one Vercel project. Frontend (React/Vite) + Backend (Express) deployed together.

## 📁 Structure

```
gigoai/
├── api/
│   ├── index.js          ← Express app (Vercel serverless entry)
│   ├── models/           ← Job.js, Gig.js (Mongoose)
│   └── routes/           ← jobs.js, gigs.js, resume.js
├── src/                  ← React frontend
│   ├── components/       ← NearbyJobs, DailyGigs, ResumeMatch
│   ├── hooks/            ← useGigs, useResumeMatch
│   ├── config/api.js     ← fetch wrapper
│   └── App.jsx
├── public/
├── index.html
├── vite.config.js
├── tailwind.config.js
├── package.json
└── vercel.json           ← routes /api/* to Express, /* to React
```

## 🚀 Deploy to Vercel (1 project only)

### 1. Push to GitHub
```bash
git init
git add .
git commit -m "feat: GigoAI"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/gigoai.git
git push -u origin main
```

### 2. Create ONE Vercel project
1. [vercel.com](https://vercel.com) → **Add New Project**
2. Import your repo
3. **Root Directory** → leave blank (root of repo)
4. **Framework Preset** → **Vite**
5. **Build Command** → `npm run build`
6. **Output Directory** → `dist`
7. Add Environment Variables:

| Key | Value |
|-----|-------|
| `MONGO_URI` | `mongodb+srv://user:pass@cluster.mongodb.net/gigoai` |
| `ANTHROPIC_API_KEY` | `sk-ant-api03-...` |

8. Click **Deploy** ✅

### 3. Seed data (after deploy)
```bash
# Replace with your Vercel URL
curl -X POST https://gigoai.vercel.app/api/jobs/seed \
  -H "Content-Type: application/json" \
  -d '{"lat": 17.385, "lng": 78.486}'

curl -X POST https://gigoai.vercel.app/api/gigs/seed \
  -H "Content-Type: application/json" \
  -d '{"lat": 17.385, "lng": 78.486}'
```

## 💻 Local Dev
```bash
npm install

# Terminal 1 — backend
node -e "require('dotenv').config(); const app = require('./api/index'); app.listen(5000)"

# Terminal 2 — frontend
npm run dev
```

## 📡 API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | `/health` | Health check |
| GET | `/api/jobs` | All jobs |
| GET | `/api/jobs/nearby?lat=&lng=` | Nearby jobs |
| POST | `/api/jobs/seed` | Seed sample jobs |
| GET | `/api/gigs` | All gigs |
| GET | `/api/gigs/nearby?lat=&lng=` | Nearby gigs |
| POST | `/api/gigs/:id/apply` | Apply to gig |
| POST | `/api/gigs/seed` | Seed sample gigs |
| POST | `/api/resume/parse-and-match` | AI resume match |

## ❗ MongoDB Atlas Setup
1. Create free cluster at [mongodb.com/atlas](https://mongodb.com/atlas)
2. Database Access → Add user with password
3. Network Access → Add IP `0.0.0.0/0` (allow all)
4. Connect → Drivers → copy connection string
5. Replace `<password>` with your password in `MONGO_URI`

<div align="center">

# REZIQ

### AI-Powered Resume Intelligence Platform

**Analyze · Optimize · Get Hired**

[![Live Demo](https://img.shields.io/badge/Live-reziqai.vercel.app-black?style=for-the-badge&logo=vercel)](https://reziqai.vercel.app)
[![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge&logo=next.js)](https://nextjs.org)
[![Supabase](https://img.shields.io/badge/Supabase-Auth%20%26%20DB-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=for-the-badge&logo=typescript)](https://typescriptlang.org)

</div>

---

## What is REZIQ?

REZIQ is a single-tool SaaS platform that gives job seekers an unfair advantage. Upload your resume, paste a job description, and receive a multi-page AI analysis that includes ATS scoring, rejection risk assessment, market competition data, skill gap identification with a 21-day learning roadmap, and direct recruiter intelligence insights.

Most job seekers apply blind. REZIQ makes them see.

---

## Core Features

### Skill Gap Finder
The flagship feature. REZIQ compares your resume against a job description and produces a structured 5-section analysis:

| Section | What It Does |
|---|---|
| ATS & Recruiter Scoring | Scores your resume 0–100 against ATS filters and human recruiters |
| Rejection Risk Analysis | Identifies every red flag that gets you filtered out before a human sees you |
| Market Competition Analysis | Shows how you compare to the other 200+ applicants for the same role |
| High-Value Project Recommendations | Suggests specific projects to build that close your skill gaps fast |
| Recruiter Intelligence Insights | Reveals what recruiters actually look for beyond the job description |

**Plus:** 21-day improvement roadmap with direct links to free learning resources.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Auth & Database | Supabase (PostgreSQL + Row Level Security) |
| AI Engine | Groq API (LLaMA 3) |
| Styling | Tailwind CSS |
| Deployment | Vercel (Global Edge Network) |
| File Parsing | PDF.js / Mammoth |

---

## Getting Started (Local Development)

### Prerequisites
- Node.js 18+
- A Supabase project
- A Groq API key

### Setup

```bash
# 1. Clone the repository
git clone https://github.com/YOUR_USERNAME/reziq.git
cd reziq

# 2. Install dependencies
npm install

# 3. Copy env template
cp .env.example .env.local

# 4. Fill in your environment variables
# (see Environment Variables section below)

# 5. Run locally
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Environment Variables

Create a `.env.local` file with the following keys. **Never commit this file.**

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
GROQ_API_KEY=your_groq_api_key
NEXTAUTH_SECRET=your_random_32char_secret
NEXT_PUBLIC_SITE_URL=https://reziqai.vercel.app
```

---

## Architecture

```
reziq/
├── app/                    # Next.js App Router
│   ├── (auth)/             # Auth pages (login, signup)
│   ├── dashboard/          # Protected dashboard
│   ├── skill-gap/          # Skill Gap Finder feature
│   └── api/                # API routes (server-side only)
├── components/             # Reusable UI components
├── lib/                    # Supabase client, Groq client, utils
├── public/                 # Static assets
└── supabase/
    └── migrations/         # Database schema history
```

---

## Security

REZIQ is built with production-grade security from day one:

- All routes behind Supabase Row Level Security (RLS)
- Zero secrets in client-side code
- CSRF protection on all API routes
- Input sanitization on all user-submitted content
- Security headers enforced via `next.config.js`
- Rate limiting on auth and AI endpoints
- Passwords never stored — OAuth only

---

## Deployment

REZIQ is deployed on Vercel at **[reziqai.vercel.app](https://reziqai.vercel.app)**.

Every push to `main` triggers an automatic deployment. Preview deployments are created for every pull request.

---

## Roadmap

- [ ] Resume PDF export with optimization applied
- [ ] Cover letter generator
- [ ] LinkedIn profile analyzer
- [ ] Interview question predictor
- [ ] Salary benchmarking by role and city

---

## License

MIT © REZIQ

---

<div align="center">
Built with focus. Designed for results.
</div>

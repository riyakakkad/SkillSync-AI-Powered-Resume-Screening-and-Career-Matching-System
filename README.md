# SkillSync — AI-Powered Resume Screening & Career Matching System

[![Node.js](https://img.shields.io/badge/Node.js-v18+-68A063.svg?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB.svg?logo=react&logoColor=black)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.100+-009688.svg?logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-6.0+-47A248.svg?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Vite](https://img.shields.io/badge/Vite-5.0+-646CFF.svg?logo=vite&logoColor=white)](https://vitejs.dev/)
[![Status](https://img.shields.io/badge/Phase%201--8-Production%20Ready-success.svg)]()

SkillSync is an enterprise-grade, full-stack AI platform designed for multi-domain resume screening, explainable ATS scoring, candidate-job matching, skill gap analysis, targeted course recommendations, recruiter talent pipelines, and administrative governance.

---

## 📑 Table of Contents
1. [Project Overview](#-1-project-overview)
2. [Multi-Domain Architecture & Intelligence](#-2-multi-domain-architecture--intelligence)
3. [System Architecture](#-3-system-architecture)
4. [Directory Layout](#-4-directory-layout)
5. [Summary of Implemented Modules (Phases 1–8)](#-5-summary-of-implemented-modules-phases-18)
6. [Prerequisites & Environment Configuration](#-6-prerequisites--environment-configuration)
7. [Installation & Getting Started](#-7-installation--getting-started)
8. [Demo Walkthrough & Pre-seeded Accounts](#-8-demo-walkthrough--pre-seeded-accounts)
9. [Complete API Catalog](#-9-complete-api-catalog)
10. [Automated Test Suites & Quality Assurance](#-10-automated-test-suites--quality-assurance)
11. [Known Limitations](#-11-known-limitations)

---

## 📋 1. Project Overview

SkillSync eliminates the traditional limitations of recruitment platforms that cater exclusively to software engineering. Using a modular multi-tier architecture, SkillSync delivers:

- **Universal Multi-Domain Support**: Intelligent parsing and skill extraction for candidates across 10 professional domains (IT, Data Science, Healthcare, Finance, Marketing, HR, Education, Engineering, Business, and Cross-Disciplinary fields).
- **Explainable ATS Scoring**: Transparent candidate scoring breakdown across skills match, formatting, experience depth, and readability.
- **Smart Job Matching & Skill Gap Analysis**: Real-time comparison between candidate competencies and job descriptions, computing match percentages, matched skills, missing skills, and dynamic course recommendations.
- **Role-Based Workspaces**:
  - **Student Portal**: Resume management, ATS score reports, personalized job matching, skill gap insights, and application tracking.
  - **Recruiter Portal**: Job listing management, applicant ranking, candidate match breakdown, and application stage progression.
  - **Admin Control Center**: Platform analytics, user directory management, job moderation, application monitoring, and immutable system audit logging.

---

## 🧠 2. Multi-Domain Architecture & Intelligence

SkillSync's ML engine features a high-precision taxonomy spanning **10 distinct industry domains**:

1. **IT and Software Development** (React, Node.js, Python, TypeScript, Docker, Kubernetes, AWS, Java, etc.)
2. **Data Science and Data Analytics** (Machine Learning, Pandas, Scikit-Learn, PowerBI, Tableau, Deep Learning, etc.)
3. **Healthcare & Medicine** (Patient Care, EHR, Clinical Research, HIPAA Compliance, Nursing, Pharmacology, etc.)
4. **Finance and Accounting** (Financial Modeling, Valuation, Auditing, GAAP, Tax Preparation, Quickbooks, etc.)
5. **Marketing & Growth** (SEO, Content Strategy, Google Analytics, Social Media Marketing, PPC, Brand Strategy, etc.)
6. **Human Resources** (Talent Acquisition, Employee Relations, Onboarding, Performance Management, HRIS, etc.)
7. **Education & Teaching** (Curriculum Development, Classroom Management, Lesson Planning, Instructional Design, etc.)
8. **Engineering (Mechanical, Civil, Electrical)** (AutoCAD, SolidWorks, MATLAB, Circuit Design, Structural Analysis, etc.)
9. **Business & Management** (Strategic Planning, Project Management, Agile/Scrum, Operations, Stakeholder Management, etc.)
10. **Cross-Disciplinary & Multi-Domain Profiles** (Adaptive domain identification with confidence scoring).

The ML microservice dynamically calculates:
$$\text{Domain Confidence} = \frac{\text{Skills Matching Domain}}{\text{Total Detected Skills}}$$
Candidates are matched only against domain-relevant jobs without arbitrary pigeonholing into IT roles.

---

## 🏗️ 3. System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    SkillSync Frontend                       │
│           (React 18 + Vite + Tailwind CSS SPA)              │
│       Student Portal  │  Recruiter Portal  │ Admin Portal   │
└──────────────────────────────┬──────────────────────────────┘
                               │ HTTP / REST / Bearer JWT
                               ▼
┌─────────────────────────────────────────────────────────────┐
│                    SkillSync Backend API                    │
│            (Node.js + Express REST API Server)              │
│  Controllers │ Auth/RBAC │ Audit Logger │ ML Client Proxy   │
└──────────────┬──────────────────────────────┬───────────────┘
               │                              │ HTTP Internal
               ▼                              ▼
┌─────────────────────────────┐  ┌─────────────────────────────┐
│       MongoDB Server        │  │     Python ML Service       │
│  (Users, Resumes, Jobs,     │  │    (FastAPI + Uvicorn)      │
│   Applications, AuditLogs)  │  │  PDF/DOCX Extraction, NLP,  │
│                             │  │  Multi-Domain Engine, ATS   │
└─────────────────────────────┘  └─────────────────────────────┘
```

- **Frontend**: Port `5173` — Responsive, glassmorphic UI with quick demo login chips.
- **Backend API**: Port `5000` — Central orchestrator, RBAC enforcement, file uploads, Mongoose models.
- **Python ML Microservice**: Port `8000` — Asynchronous text extraction (`pdfplumber`, `python-docx`), regex-driven taxonomy matching, and algorithmic ATS scoring.
- **MongoDB**: Port `27017` — Persistent storage with referential integrity.

---

## 📂 4. Directory Layout

```
SkillSync/
├── frontend/                   # React Single Page Application
│   ├── src/
│   │   ├── components/         # Reusable UI (Navbar, Footer, Modal, ProtectedRoute, etc.)
│   │   ├── context/            # AuthContext (state, JWT persistence, roles)
│   │   ├── pages/
│   │   │   ├── admin/          # Admin Dashboard, User Management, Job Moderation, Logs
│   │   │   ├── recruiter/      # Recruiter Dashboard, Job Creation, Applicant Review
│   │   │   ├── student/        # Student Dashboard, Resume Upload, ATS Report, Job Matches
│   │   │   ├── auth/           # Login, Register, Forgot/Reset Password
│   │   │   └── LandingPage.jsx # Public landing page with role portals
│   │   ├── services/           # Axios service instances (api, auth, student, recruiter, admin)
│   │   └── App.jsx             # React Router routing & RBAC route gates
│   └── package.json
│
├── backend/                    # Node.js + Express API
│   ├── config/                 # Database configuration (db.js)
│   ├── controllers/            # Controller business logic (auth, student, recruiter, admin, job)
│   ├── middleware/             # auth.js, role.js, upload.js, adminLog.js
│   ├── models/                 # Mongoose schemas (User, Resume, Job, Application, Course, AdminLog)
│   ├── routes/                 # Express route definitions
│   ├── services/               # Internal integrations (mlClient.js)
│   ├── uploads/                # Stored resume documents
│   ├── utils/                  # Automated test suites and seed scripts
│   │   ├── seedAdmin.js        # Admin seeder
│   │   ├── seedDemoUsers.js    # Demo user & job seeder
│   │   ├── seedStudentData.js  # Multi-domain jobs and courses seeder
│   │   ├── testAuth.js         # Authentication & RBAC test suite
│   │   ├── testPhase3.js       # Student profile & resume test suite
│   │   ├── testPhase4.js       # ATS scoring & parsing test suite
│   │   ├── testMultiDomainBackend.js # Multi-domain extraction suite
│   │   ├── testPhase5.js       # Job matching & skill gap suite
│   │   ├── testPhase6.js       # Recruiter module test suite
│   │   ├── testPhase7.js       # Admin module test suite
│   │   └── testE2E.js          # Full end-to-end regression suite
│   ├── .env.example
│   ├── server.js
│   └── package.json
│
└── ml-service/                 # Python FastAPI Microservice
    ├── app/
    │   ├── models/             # Pydantic validation schemas
    │   ├── routes/             # FastAPI endpoints (resume.py, matching.py)
    │   ├── services/           # extractor.py, nlp_parser.py, ats_scorer.py
    │   ├── utils/              # domain_taxonomy.py, skill_patterns.py
    │   └── main.py
    ├── tests/
    │   └── test_multi_domain.py# Python multi-domain taxonomy test suite
    ├── requirements.txt
    └── .env.example
```

---

## 🚀 5. Summary of Implemented Modules (Phases 1–8)

### Phase 1 — Project Foundation
- Initialized 3-tier microservice architecture.
- Health check endpoints (`/api/health` and `/health`).
- Established MongoDB Mongoose connection and static file streaming.

### Phase 2 — Authentication, JWT & RBAC
- Student, Recruiter, and Admin role support.
- Secure bcrypt password hashing (10 salt rounds).
- Stateless JWT issuance with expiration and bearer token authentication.
- Password reset token generation with cryptographic hash validation.

### Phase 3 — Student Module & File Management
- Multer file upload pipeline with MIME-type validation (`.pdf`, `.docx`).
- Primary resume flag management.
- Student profile customization and bio updates.
- Bookmarking jobs and tracking submitted applications.

### Phase 4 — Multi-Domain Parsing & Explainable ATS Scoring
- Text extraction from binary documents (`pdfplumber`, `python-docx`).
- Section identification (Education, Experience, Skills, Certifications, Projects).
- 10-domain skill extraction engine.
- 4-component ATS scoring formula (Skills 40%, Formatting 20%, Experience 25%, Readability 15%).

### Phase 5 — AI Job Matching, Skill Gap Analysis & Courses
- Jaccard and weighted skill overlap algorithm:
  $$\text{Match Percentage} = \frac{|\text{Resume Skills} \cap \text{Job Skills}|}{|\text{Job Required Skills}|} \times 100$$
- Skill gap prioritization categorizing missing skills into Critical and Recommended.
- Targeted course recommendations linked to active candidate skill gaps.

### Phase 6 — Recruiter Module & Candidate Pipeline
- Recruiter portal with live KPI metrics (Active Listings, Total Applicants, Shortlisted, Hired).
- Job Posting CRUD with ownership authorization enforcement (`postedBy`).
- Candidate review drawer displaying applicant resume, match score, and missing competencies.
- Application stage progression: `Applied` ➔ `Under Review` ➔ `Shortlisted` ➔ `Interview Scheduled` ➔ `Selected/Hired` / `Rejected`.
- Automatic applicant notification creation upon status transition.

### Phase 7 — Platform Administration & Governance
- Protected Admin Dashboard powered by live MongoDB aggregation pipelines.
- User management: List, search, role filtering, and user activation/deactivation.
- Self-lockout prevention ensuring admins cannot deactivate their own accounts.
- Job moderation: Global visibility and soft/hard deletion of inappropriate postings.
- System audit logging: Automatic recording of administrative actions (`AdminLog`).

### Phase 8 — UI Polish, Demo Credentials & Quality Assurance
- Polished responsive layouts, error feedback banners, and empty state cards.
- Quick demo login chips on the Login page for one-click evaluation.
- Quick-access portal launching from the public landing page.
- Comprehensive end-to-end regression test suite (`testE2E.js`).

---

## ⚙️ 6. Prerequisites & Environment Configuration

### Prerequisites
- **Node.js**: v18.0.0 or higher
- **Python**: v3.10.0 or higher
- **MongoDB**: Community Server v6.0+ running locally on port `27017`
- **npm**: v9.0.0 or higher

### Environment Setup

#### Backend Configuration (`backend/.env`)
Create `backend/.env` with the following variables:
```env
PORT=5000
NODE_ENV=development
MONGO_URI=mongodb://localhost:27017/skillsync
JWT_SECRET=skillsync_jwt_super_secret_key_change_in_production_2026
JWT_EXPIRES_IN=7d
ML_SERVICE_URL=http://localhost:8000
CLIENT_URL=http://localhost:5173
```

#### ML Service Configuration (`ml-service/.env`)
Create `ml-service/.env`:
```env
PORT=8000
HOST=0.0.0.0
DEBUG=True
ENVIRONMENT=development
```

#### Frontend Configuration (`frontend/.env`)
Create `frontend/.env`:
```env
VITE_API_URL=http://localhost:5000/api
```

---

## 🏃 7. Installation & Getting Started

### 1. Start MongoDB
Ensure your local MongoDB daemon is running:
```bash
# Windows PowerShell / Services
net start MongoDB
# Or via mongod binary:
mongod --dbpath <path_to_db_folder>
```

### 2. Setup & Start ML Service
```bash
cd ml-service
python -m venv venv
# Windows:
.\venv\Scripts\activate
# Linux/macOS:
source venv/bin/activate

pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
*Health verification: `http://localhost:8000/health`*

### 3. Setup & Start Backend Server
```bash
cd backend
npm install

# Seed Admin and Demo Accounts
node utils/seedDemoUsers.js
# Seed Multi-Domain Jobs and Courses
node utils/seedStudentData.js

# Start API server
npm run dev
```
*Health verification: `http://localhost:5000/api/health`*

### 4. Setup & Start Frontend Application
```bash
cd frontend
npm install
npm run dev
```
*Application available at: `http://localhost:5173`*

---

## 🎭 8. Demo Walkthrough & Pre-seeded Accounts

For rapid evaluation, the login page (`http://localhost:5173/login`) provides **quick-fill credential chips**:

| Role | Email | Password | Pre-populated Data |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@skillsync.com` | `Admin@123456` | Platform-wide stats, user table, job moderation, audit log |
| **Recruiter** | `recruiter.demo@skillsync.com` | `Password123!` | 3 Active Jobs across domains, applicant applications |
| **Student** | `student.demo@skillsync.com` | `Password123!` | Analyzed resume (88 ATS score), matched jobs, skill gaps |

### Demo Evaluation Journeys

1. **Student Journey**:
   - Log in as `student.demo@skillsync.com`.
   - Visit **My Resumes** to see the analyzed resume, detected skills, and ATS score of 88.
   - Navigate to **Job Matching** to observe match percentages, matched skills, and missing competencies.
   - Click **Skill Gap Analysis** to view prioritized learning paths and tailored course recommendations.
   - Apply for an open position and review the application in **My Applications**.

2. **Recruiter Journey**:
   - Log in as `recruiter.demo@skillsync.com`.
   - Access **Recruiter Dashboard** to see live metrics and active postings.
   - Click **Post New Job** to publish a new requisition with domain categorization.
   - View applicants, inspect candidate match percentages, and advance an applicant from `Shortlisted` to `Interview Scheduled`.

3. **Admin Journey**:
   - Log in as `admin@skillsync.com`.
   - Inspect the **Admin Dashboard** metrics aggregated directly from MongoDB.
   - Go to **User Management** to search, filter by role, or toggle user status.
   - Access **Job Moderation** to review or remove postings.
   - Check **Audit Logs** to view timestamped administrative actions.

---

## 📡 9. Complete API Catalog

### Public & Authentication
- `POST /api/auth/register` — Register student or recruiter account.
- `POST /api/auth/login` — Authenticate and receive JWT token.
- `GET /api/auth/me` — Retrieve authenticated user profile.
- `POST /api/auth/forgot-password` — Request password reset email.
- `POST /api/auth/reset-password` — Apply new password via reset token.

### Student Portal
- `GET /api/profile` / `PUT /api/profile` — View or update student profile.
- `POST /api/resumes/upload` — Upload PDF/DOCX resume.
- `GET /api/resumes` — List all uploaded resumes.
- `GET /api/resumes/:id` — Get single resume details.
- `DELETE /api/resumes/:id` — Delete uploaded resume.
- `PUT /api/resumes/:id/primary` — Designate resume as primary.
- `POST /api/resumes/:id/analyze` — Trigger ML parsing and ATS scoring.
- `GET /api/resumes/:id/analysis` — Fetch stored ATS report and breakdown.
- `GET /api/jobs` — Browse active jobs with domain filters.
- `GET /api/jobs/matched` — Retrieve AI-ranked job recommendations.
- `POST /api/jobs/:id/save` / `DELETE /api/jobs/:id/save` — Bookmark or unbookmark a job.
- `POST /api/applications` — Submit job application.
- `GET /api/applications` — List student applications.
- `GET /api/courses/recommended` — Fetch personalized course recommendations.

### Recruiter Portal
- `GET /api/recruiter/dashboard` — Recruiter statistics and metrics.
- `GET /api/recruiter/jobs` — Retrieve jobs posted by authenticated recruiter.
- `POST /api/recruiter/jobs` — Create new job listing.
- `PUT /api/recruiter/jobs/:id` — Update job listing (owner only).
- `DELETE /api/recruiter/jobs/:id` — Delete job listing (owner only).
- `GET /api/recruiter/applications` — List applications for recruiter's jobs.
- `PUT /api/recruiter/applications/:id/status` — Advance candidate stage.

### Admin Portal
- `GET /api/admin/dashboard` — System-wide analytics and distribution.
- `GET /api/admin/users` — Paginated user directory with role filters.
- `PUT /api/admin/users/:id/status` — Toggle user active/inactive status.
- `GET /api/admin/jobs` — Global job directory across all recruiters.
- `DELETE /api/admin/jobs/:id` — Administrative removal of a job listing.
- `GET /api/admin/applications` — Comprehensive platform application tracking.
- `GET /api/admin/logs` — Immutable administrative audit log.

### ML Microservice (`http://localhost:8000`)
- `GET /health` — Service health and uptime.
- `POST /api/ml/analyze-resume` — Text extraction, multi-domain classification, ATS scoring.
- `POST /api/ml/extract-skills` — Standalone regex-based skill extraction.
- `POST /api/ml/ats-score` — Standalone 4-pillar ATS score evaluation.
- `POST /api/ml/match-job` — Standalone candidate-job match evaluation.

---

## 🧪 10. Automated Test Suites & Quality Assurance

SkillSync includes a multi-layered automated test suite verifying security, ML models, API contracts, and user workflows.

### Running Backend & E2E Suites
Execute from `backend/`:
```bash
# 1. Phase 2: Authentication & RBAC Suite (18 tests)
node utils/testAuth.js

# 2. Phase 3: Student Module Suite (19 tests)
node utils/testPhase3.js

# 3. Phase 4: ATS Scoring & ML Integration Suite (8 tests)
node utils/testPhase4.js

# 4. Multi-Domain Skill Extraction Backend Suite (8 tests)
node utils/testMultiDomainBackend.js

# 5. Phase 5: Job Matching & Skill Gap Suite (16 tests)
node utils/testPhase5.js

# 6. Phase 6: Recruiter Module Suite (20 tests)
node utils/testPhase6.js

# 7. Phase 7: Admin Module & RBAC Suite (20 tests)
node utils/testPhase7.js

# 8. Phase 8: Comprehensive End-to-End Regression Suite (23 tests)
node utils/testE2E.js
```

### Running ML Microservice Python Suite
Execute from `ml-service/`:
```bash
pytest tests/test_multi_domain.py -v
```

### Running Frontend Production Build
Execute from `frontend/`:
```bash
npm run build
```

---

## ⚠️ 11. Known Limitations

1. **Email Delivery**: The password reset and interview notification workflows log security tokens and alert records to the server database/console; an external SMTP provider (e.g., SendGrid, AWS SES) should be configured for live external emailing.
2. **Document OCR**: Resume text extraction is optimized for text-based PDF and DOCX documents. Scanned resumes consisting solely of flat raster images require an additional OCR engine (e.g., Tesseract).
3. **ML Scale**: The current skill matching engine utilizes deterministic tokenized regex matching and Jaccard similarity. For multi-million resume workloads, vector embeddings (e.g., pgvector, Pinecone, or FAISS) can be integrated.

---

## 📄 License
This project is proprietary and developed as part of the SkillSync Career Platform.

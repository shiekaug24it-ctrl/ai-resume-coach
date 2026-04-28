# TODO: Add Java + MySQL Backend to AI Resume Coach

## Phase 1: Java Spring Boot Backend ✅ COMPLETE
- [x] 1.1 Initialize Spring Boot project structure (backend/)
- [x] 1.2 Create pom.xml with dependencies (Web, JPA, MySQL, Security, Validation, Lombok, WebFlux)
- [x] 1.3 Create application.yml config (MySQL, JWT, Gemini API, CORS, upload path)
- [x] 1.4 Create Flyway migration V1__init.sql (users, resumes tables)
- [x] 1.5 Create JPA Entities (User, Resume)
- [x] 1.6 Create Repositories (UserRepository, ResumeRepository)
- [x] 1.7 Create JWT utilities and Security config
- [x] 1.8 Create AuthController (register, login, me)
- [x] 1.9 Create ResumeController (upload, list, get, delete, download)
- [x] 1.10 Create FileStorageService
- [x] 1.11 Create AiAnalysisService (Gemini API integration)
- [x] 1.12 Create AuthService
- [x] 1.13 Create ResumeService
- [x] 1.14 Create Application.java entry point
- [x] 1.15 Create Dockerfile for backend

## Phase 2: Frontend Updates
- [ ] 2.1 Create src/lib/api.ts (Axios client with JWT)
- [ ] 2.2 Rewrite src/lib/auth.tsx (JWT-based auth, remove Supabase)
- [ ] 2.3 Update src/routes/auth.tsx (call Java auth API)
- [ ] 2.4 Update src/routes/dashboard.tsx (call Java resume API)
- [ ] 2.5 Update src/routes/resume.$id.tsx (call Java resume API)
- [ ] 2.6 Remove src/integrations/supabase/ directory
- [ ] 2.7 Update package.json (remove @supabase/supabase-js)
- [ ] 2.8 Create TypeScript types for API responses

## Phase 3: DevOps & Documentation
- [x] 3.1 Create docker-compose.yml (MySQL + Java backend)
- [x] 3.2 Create .env.example files
- [ ] 3.3 Update README.md with setup instructions

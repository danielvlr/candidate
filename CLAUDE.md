# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Default Lang
pr_bt

## Project Architecture

This is a full-stack web application for candidate management with the following structure:

### Backend (Spring Boot)
- **Framework**: Spring Boot 3.3.1 with Java 21
- **Location**: `backend/` directory
- **Main class**: `com.empresa.sistema.SistemaApplication.java`
- **Base package**: `com.empresa.sistema`
- **Controller package**: `com/empresa/sistema/api`
- **Database package**: `com/empresa/sistema/domain`
- **Config package**: `com/empresa/sistema/config`
- **Security**: OAuth2 Resource Server with JWT authentication
- **Key dependencies**: Spring Security, Spring Web, Spring Data JPA, ModelMapper, Lombok

### Frontend (React)
- **Framework**: React 18 with Vite
- **Location**: `frontend/` directory
- **Build Tool**: Vite
- **UI Framework**: Tailwind CSS
- **State Management**: React Hooks

### Architecture Patterns
- **Backend**: Standard Spring Boot layered architecture (Controller → Service → Repository)
- **Frontend**: Feature-based modules with shared utilities
- **Authentication**: JWT-based with OAuth2 Resource Server
- **API Communication**: REST API with proxy configuration (`/api` → `localhost:8080`)

## Development Commands

### Backend (Maven/Spring Boot)
```bash
# Navigate to backend directory first
cd backend

# Build the project
./mvnw clean package

# Run the application (default port 8080)
./mvnw spring-boot:run

# Run tests
./mvnw test

# Skip tests during build
./mvnw clean package -DskipTests
```

### Frontend (React)
```bash
# Navigate to frontend directory first
cd frontend

# Install dependencies
npm install

# Start development server (with proxy to backend)
npm run dev

# Build for production
npm run build

# Run unit tests
npm test

# Preview production build
npm run preview
```

### Docker
```bash
# Build Docker image (uses multi-stage build with Maven)
docker build -t sistema .

# Run container
docker run -p 8080:8080 sistema
```

## Key Backend Components

### Controllers
- `AuthController`: Authentication endpoints
- `CandidatoController`: Candidate management
- `HistoricoDeContatoController`: Contact history management

### Security
- JWT-based authentication with `JwtAuthFilter` and `JwtService`
- OAuth2 Resource Server configuration in `SecurityConfig`
- User management with `UserInfo` and `UserRole` entities

### Database Models
- `Candidato`: Main candidate entity
- `Contato`: Contact information
- `UserInfo` and `UserRole`: Security/authentication entities

## Key Frontend Components

### Core Layout
- `login`: Authentication component
- `main`: Main application layout
- `topbar`: Navigation component

### Features
- `candidate`: Complete candidate management module with:
  - `candidate-index`: Main listing page
  - `candidate-insert`: Add new candidates
  - `candidate-table`: Data display component
  - `candidate-filter`: Search and filtering
  - `candidate-historic`: Contact history

### Services
- Feature-specific services in each module
- Form services for validation and data handling
- Authentication service with guards

### Utilities
- Shared components (datepicker, input-group, modal)
- Helper functions for data transformation
- Portuguese localization for Material components

## Development Workflow

1. **Backend development**: Start with `./mvnw spring-boot:run` from `backend/` directory
2. **Frontend development**: Start with `npm run dev` from `frontend/` directory
3. **Full stack**: Run both backend and frontend simultaneously
4. **API testing**: Backend runs on `localhost:8080`, frontend proxies `/api` calls
5. **Database**: Configure PostgreSQL connection in `application.properties`

## Testing

- **Backend**: Use `./mvnw test` for Spring Boot tests
- **Frontend**: Use `npm test` for Angular/Karma tests
- **Test files**: Follow Angular naming convention (*.spec.ts)
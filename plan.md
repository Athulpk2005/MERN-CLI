# Product Requirement Document: MERN Scaffolder CLI

## 1. Executive Summary
The goal is to create an npm package (`npm install -g create-mern-app`) that allows developers to spin up a production-ready, standardized MERN stack project with a single command. This reduces the "boilerplate fatigue" associated with configuring React, Express, and Mongoose from scratch.

## 2. Target Audience
- Full-stack developers and students.
- Teams requiring a standardized project structure for new microservices or web apps.

## 3. Functional Requirements
| Feature | Status | Description |
| :--- | :--- | :--- |
| **Command Execution** | ✅ | User runs `npx create-mern-app <project-name>`. |
| **Interactive Prompt** | ✅ | Multi-step prompts for Redux, Tailwind, TS/JS, and advanced libraries. |
| **Project Generation** | ✅ | Professional Monorepo structure with `/client` and `/server`. |
| **Auto-Dependency Install** | ✅ | Executes `npm install` in root, `/client`, and `/server`. |
| **Environment Setup** | ✅ | Generates a `.env` file from templates. |
| **Monorepo Scripts** | ✅ | `npm run dev` in root starts both frontend and backend. |

## 4. Non-Functional Requirements
- **Performance**: Optimized template cloning for fast setup (Under 60s).
- **Compatibility**: Supports Node.js versions 18 and higher.
- **Maintainability**: Modular template system for easy updates.

## 5. Technical Stack
- **Runtime**: Node.js.
- **CLI Framework**: `commander`.
- **Interaction**: `inquirer` (with checkbox support).
- **File Operations**: `fs-extra`.
- **Process Management**: `execa`.
- **UI Enhancements**: `ora` (spinners), `chalk` (colors).

## 6. User Experience (UX) Flow
1. **Input**: User executes the command.
2. **Validation**: CLI checks directory existence.
3. **Prompt**: Interactive selection of tech stack + advanced libraries (React Query, Zod, etc.).
4. **Action**: Real-time progress spinners for file creation and dependency installation.
5. **Completion**: Success report with highlighted "Next steps" commands.

## 7. Success Metrics
- **Time-to-First-Code**: Reduced by ~90% compared to manual setup.
- **Deployment Readiness**: Includes standard directory structure (controllers, models, hooks).

## 8. Project Status / Roadmap
- **Phase 1: Foundation** ✅
  - Basic file structure cloning.
  - Hardcoded core dependencies.
- **Phase 2: Interactivity** ✅
  - Options for Tailwind, Redux, and TypeScript.
  - Advanced selection for React Query, Zod, Framer Motion, etc.
- **Phase 3: DX & Optimization** ✅
  - Automated `.env` generation.
  - Git initialization.
  - Monorepo `concurrently` setup.
  - Professional folder structure implementation.

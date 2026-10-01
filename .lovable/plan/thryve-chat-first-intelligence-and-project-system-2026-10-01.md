# THRYVE: Chat-first intelligence and project system

## Goal
Keep the fast, single-window THRYVE chat as the main experience, while adding an optional connected project area for deeper research, decisions, plans, and progress. Accounts will support email/password and Google, with profiles and secure cloud-synced data.

## What will be built

### 1. Premium chat experience
- Smooth, independently scrollable transcript while THRYVE is responding.
- Improved display font, spacing, composer, loading states, keyboard behavior, and mobile layout.
- Reliable chat switching: save the user's prompt immediately, keep generation attached to its conversation, and allow moving between chats without losing it.
- Mode selector for Brainstorm, Research, Challenge, Debate, Verify, Decide, Plan, and Build.
- Right evidence rail with source identity, URL, evidence quality, agreement/conflict status, and claim confidence.
- Dictation remains available in the composer.

### 2. Projects and persistent context
- Create and switch projects from the chat sidebar.
- Each project remembers its goal, constraints, ideas, decisions, rejected ideas, research, open questions, tasks, and conversations.
- THRYVE receives the active project's relevant context in future requests.
- Conversation outputs can be saved as ideas, evidence, decisions, insights, or tasks.

### 3. Full project area
- Overview: goal, stage, progress, key decisions, insights, open questions, and tasks.
- Ideas: generate, refine, combine, expand, regenerate, and compare versions.
- Research: findings, trends, competitors, opportunities, gaps, claims, evidence, and contradictions.
- Debate: Creator, Skeptic, Customer, Competitor, Researcher, and Investor perspectives with synthesis.
- Decisions: compare options against user-defined criteria, risks, assumptions, and unanswered questions.
- Plan: milestones, priorities, dependencies, and completion tracking.
- Evolution: compare previous and current idea versions with change reasons.
- Export and sharing: downloadable project report and a shareable read-only project view.

### 4. AI behavior
- Keep THRYVE evidence-first: claim → evidence → contradiction → confidence → conclusion → action.
- Use the supported THRYVE AI model for structured research, brainstorming, challenge, debate, verification, and planning.
- Explicitly separate verified facts, assumptions, inference, and speculation.
- Preserve real URLs in structured source records and never present unverified citations as evidence.
- Surface safe provider errors directly and follow bounded retry rules only for temporary failures.

### 5. Accounts and security
- Add email/password sign-up, sign-in, email confirmation, password reset, Google sign-in, and sign-out.
- Add user profiles with display name, avatar URL, and preferences.
- Store projects, conversations, messages, sources, insights, idea versions, decisions, and tasks in Lovable Cloud.
- Apply owner-only access rules to private records and separate secure server checks for AI and sharing actions.
- Migrate existing browser-saved chats into the signed-in account once, without deleting local data until migration succeeds.

## Technical details
- Keep TanStack Start routing and the existing streaming chat endpoint, modernized to the current Responses protocol and model.
- Use protected routes for private project pages and public routes only for sign-in, password recovery, and explicitly shared read-only projects.
- Use normalized cloud tables with ownership rules; profiles are created automatically when an account is created.
- Store structured message metadata for mode, claims, evidence, citations, confidence, and saved outputs.
- Build the shared visual shell from semantic design tokens and existing controls; no return to the old dashboard-heavy design.

## Delivery order
1. Cloud schema, account flows, profiles, and protected data access.
2. Chat persistence, reliable switching, polished scrolling, and upgraded AI protocol.
3. Modes, evidence cards, and source verification presentation.
4. Project area covering all 15 requested capabilities.
5. Export/share, local-chat migration, responsive checks, and end-to-end verification.

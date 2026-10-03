# Complete THRYVE

## Goal
Finish THRYVE as a polished evidence-first AI product: chat remains the fast front door, while signed-in users can turn useful conversations into persistent projects, structured research, decisions, plans, and build-ready outputs.

## Experience direction
- Keep a disciplined near-black, deep-blue, and electric-blue palette with high contrast and semantic color roles for evidence states.
- Use only Manrope for interface/body text and Fraunces for major editorial headings; increase normal body copy to at least 16px.
- Strengthen hierarchy around the current question, active mode, primary action, evidence status, and next step.
- Add purposeful visual elements rather than stock imagery: an evidence-flow graphic, claim/confidence meters, perspective lanes, progress rings, source-quality marks, and compact timelines.
- Standardize spacing, button states, icon controls, empty/loading/error states, focus styles, motion, and reduced-motion behavior across chat, accounts, and projects.

## Build scope

### 1. Stabilize chat and accounts
- Fix all current build, runtime, navigation, streaming, scrolling, and chat-switching glitches before adding more screens.
- Keep live answers running when users switch chats, preserve partial answers when stopped, and show a clear per-chat activity state.
- Finish email/password, Google sign-in, password reset, sign-out, profile creation, account-aware chat sync, and guest-chat migration.
- Validate helpful error states for invalid sign-in, unavailable AI, lost network, rate limits, and insufficient credits.

### 2. Upgrade the chat front door
- Recompose the opening state with stronger type hierarchy, an evidence-flow visual, clearer mode selection, a more tactile prompt area, and concise animated starter prompts.
- Preserve dictation, source rail, SVG preview, answer streaming, and mobile behavior.
- Add answer actions for copy, export, save to project, challenge, verify, continue as a plan, and create a project from the conversation.
- Make cited sources inspectable with publisher, date when available, stance, source quality, and what the source actually supports.

### 3. Add project library and project detail
- Replace the placeholder Projects page with a real library: create, search, sort, rename, archive/delete, stage/progress, latest activity, and quick-open.
- Add a project detail page with an overview header and focused views for Brainstorm, Research, Challenge, Debate, Verify, Decide, Plan, Build, Test, and History.
- Surface the project goal, current stage, saved decisions, insights, open questions, risks, tasks, confidence, and recent changes without using nested decorative cards.
- Reuse saved project context automatically in related chats and AI actions.

### 4. Deliver all 15 planned capabilities end to end
1. **Brainstorming:** diverse approaches with refine, combine, expand, and regenerate actions.
2. **Structured thinking:** goals, assumptions, constraints, options, risks, and next steps.
3. **Challenge:** weaknesses, hidden assumptions, counterarguments, failure modes, and follow-up questions.
4. **Multi-perspective debate:** Creator, Skeptic, Customer, Competitor, Researcher, and Investor lanes plus synthesis.
5. **Verification:** claim extraction, evidence for/against, source quality, status, and confidence.
6. **Persistent project brain:** goals, constraints, rejected ideas, decisions, research, open questions, and remembered context.
7. **Idea evolution:** version timeline, comparison, change reason, and restore/continue from a version.
8. **Decision support:** criteria editor, option comparison, risks, assumptions, unknowns, and recommendation.
9. **Research:** facts, trends, competitors, opportunities, gaps, contradictions, and linked sources.
10. **Action plans:** milestones, priorities, dependencies, task status, and completion progress.
11. **Context-aware AI:** use current project knowledge and ask only for genuinely missing context.
12. **Mode continuity:** move among research, challenge, verification, decisions, and execution without losing context.
13. **Project overview:** goal, stage, evidence health, decisions, open questions, tasks, and progress.
14. **Conversation-to-insight:** extract and review ideas, decisions, facts, risks, insights, and tasks before saving.
15. **Export and sharing:** export Markdown/JSON, copy concise briefs, and enable/revoke read-only project share links.

### 5. Add project snippets and pointer summaries
- Add a “Save snippet” action to selected answer text and whole answers.
- Generate concise pointer summaries containing the key claim, evidence status, why it matters, source links, unresolved question, and suggested next action.
- Place snippets in the selected project and link each back to its originating chat and answer.
- Provide snippet filters by type/status and allow users to edit, pin, copy, export, or remove them.

### 6. Product safeguards and data quality
- Keep project and account data owner-scoped; shared links expose only explicitly shared read-only data.
- Validate all AI and project inputs, preserve safe gateway errors, avoid invented citations, and never silently convert assumptions into facts.
- Persist structured sources and extracted items so project views do not depend on reparsing rendered Markdown.
- Add only the smallest database changes needed for snippets, versions, and sharing, with grants and row-level access rules included.

## Technical approach
- Keep TanStack Start routes and Lovable Cloud authentication/data.
- Use server functions for authenticated project actions and server routes for streaming chat/transcription.
- Split the current oversized chat screen into focused chat, composer, mode selector, answer actions, and evidence components.
- Add project query modules and small reusable project views; avoid duplicated state and client-only authorization checks.
- Keep the assigned AI protocols and model IDs already used by the project; improve request structure and error handling without changing providers.
- Record the project architecture in `AGENTS.md` and maintain a lean `roadmap.md` until every open item is verified.

## Verification
- Check the preview build and browser console after each implementation group.
- Test desktop and mobile layouts for overflow, overlap, focus order, keyboard use, dictation controls, reduced motion, and long content.
- Test guest chat → create account → migrated chat, email sign-in/reset, Google sign-in entry, sign-out, and protected project access.
- Test new chat, streaming, stop, switching chats mid-answer, returning to the answer, source links, and save-to-project.
- Test project creation, every AI mode, snippet extraction, version comparison, task completion, exports, share enable/revoke, and deletion.
- Run focused automated tests plus final type, lint, build, runtime, and end-to-end checks; fix all discovered glitches before reporting completion.

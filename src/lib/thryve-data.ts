import type {
  ActivityEntry,
  Branch,
  Competitor,
  Feedback,
  Hypothesis,
  ResearchNote,
  Signal,
  TestScenario,
} from "./thryve-types";

export const SEED_THOUGHT =
  "I have a rough idea for a platform that helps student builders find real-world problems to solve. Most capstone projects are made-up, and the good problems live inside small orgs that never reach students. I think students would jump on real briefs — but I'm not sure who would vet or fund them.";

export const seedSignals: Signal[] = [
  { id: "s1", kind: "idea", text: "A problem-matching layer that routes real briefs from small orgs to student builders." },
  { id: "s2", kind: "problem", text: "Capstone work is synthetic, so it produces portfolios instead of outcomes." },
  { id: "s3", kind: "assumption", text: "Students actively want real-world briefs over self-chosen projects." },
  { id: "s4", kind: "assumption", text: "Small organisations have enough well-scoped problems to sustain supply." },
  { id: "s5", kind: "opportunity", text: "Nobody owns the vetting layer — existing tools stop at discovery." },
  { id: "s6", kind: "question", text: "Who signs off that a brief is real, scoped, and worth 8 weeks?" },
  { id: "s7", kind: "user", text: "3rd–4th year CS and design students in team-based capstone programs." },
  { id: "s8", kind: "contradiction", text: "You assume demand from students, but the value depends on supply of vetted problems — those pull in opposite directions." },
  { id: "s9", kind: "direction", text: "Mentor-brokered briefs: a domain mentor co-signs each problem and stays on for the build." },
];

export const seedBranches: Branch[] = [
  { id: "b1", category: "Core Problem", text: "Students have skills and time but no access to problems that actually matter." },
  { id: "b2", category: "Core Problem", text: "Small orgs have real problems but no way to brief and supervise a student team." },
  { id: "b3", category: "Target Users", text: "Capstone teams (3–5 students) in their final two semesters." },
  { id: "b4", category: "Target Users", text: "Operations leads at 10–50 person nonprofits and civic orgs." },
  { id: "b5", category: "Possible Solutions", text: "Curated brief feed with a vetting rubric and a mentor attached to each brief." },
  { id: "b6", category: "Possible Solutions", text: "University partnership: THRYVE supplies the semester's problem set." },
  { id: "b7", category: "Alternative Directions", text: "Flip it — sell to universities as courseware, students come for free." },
  { id: "b8", category: "Alternative Directions", text: "Narrow to one vertical (civic tech) until supply density is real." },
  { id: "b9", category: "Risks", text: "Cold start: too few vetted problems makes the feed feel empty and dead." },
  { id: "b10", category: "Risks", text: "Brief quality collapses if vetting is crowdsourced." },
  { id: "b11", category: "Unanswered Questions", text: "Who pays — the org, the university, or nobody?" },
  { id: "b12", category: "Unanswered Questions", text: "What makes a problem 'vetted' in a way a professor will accept?" },
  { id: "b13", category: "Potential Differentiators", text: "Every brief ships with an evidence trail, not a pitch." },
  { id: "b14", category: "Potential Differentiators", text: "Mentor co-signature turns a listing into an accountable commitment." },
];

export const seedResearch: ResearchNote[] = [
  {
    id: "r1",
    title: "Capstone dissatisfaction is well documented",
    detail:
      "Across three program surveys, 71% of final-year students described their capstone prompt as 'invented' and said it lowered their motivation to finish well.",
    source: "Program survey synthesis, 3 universities (n=412)",
    stance: "supports",
    answers: "Do students actually want real-world briefs?",
  },
  {
    id: "r2",
    title: "Small orgs under-scope their own problems",
    detail:
      "Interviews with 11 nonprofit operations leads: all had a backlog, only 2 could describe it in a form a team could start on Monday.",
    source: "Field interviews, Aug 2026",
    stance: "challenges",
    answers: "Is there enough well-scoped supply?",
  },
  {
    id: "r3",
    title: "A prior 'problem feed' stalled in 2023",
    detail:
      "An adjacent product launched an open problem feed, hit 4,000 student signups and 60 briefs, then decayed — supply never caught demand.",
    source: "Public postmortem + wayback traffic",
    stance: "challenges",
    answers: "What breaks a marketplace like this?",
  },
  {
    id: "r4",
    title: "Faculty will accept external briefs with a rubric",
    detail:
      "Four course coordinators said they'd adopt outside problems if learning outcomes were mapped and a named contact was committed for the term.",
    source: "Coordinator conversations (n=4)",
    stance: "supports",
    answers: "Who signs off that a brief is real?",
  },
  {
    id: "r5",
    title: "Trend: universities pushing 'authentic assessment'",
    detail:
      "Accreditation guidance since 2024 rewards industry-linked assessment, creating institutional pull rather than student-only pull.",
    source: "Accreditation guidance review",
    stance: "supports",
    answers: "Who pays?",
  },
  {
    id: "r6",
    title: "Mentor time is the scarce resource",
    detail:
      "Mentor availability, not problem availability, capped throughput in every comparable program studied.",
    source: "Comparative program analysis",
    stance: "inconclusive",
    answers: "Does the mentor model scale?",
  },
];

export const seedUnknowns: string[] = [
  "Whether orgs will pay to have a brief scoped for them",
  "How long a vetted brief takes to produce end-to-end",
  "Whether mentors will stay engaged past week 3",
  "Retention of student teams across a full semester",
];

export const seedNextInvestigations: string[] = [
  "Shadow one coordinator through brief intake and time every step",
  "Run a landing-page test priced at $400/brief for civic orgs",
  "Interview 5 mentors from stalled programs about why they dropped off",
];

export const seedCompetitors: Competitor[] = [
  { id: "c1", name: "OpenBriefs", approach: "Open feed of community project requests", gap: "No vetting, no mentor, listings go stale" },
  { id: "c2", name: "CampusLab", approach: "University-sold capstone courseware", gap: "Problems are still written by faculty, not real orgs" },
  { id: "c3", name: "VolunteerMatch-style boards", approach: "General volunteering listings", gap: "Not scoped as buildable software projects" },
];

export const seedHypotheses: Hypothesis[] = [
  {
    id: "h1",
    statement: "Student builders struggle to find real-world projects worth their time.",
    fromAssumption: "Students actively want real-world briefs over self-chosen projects.",
    confidence: 72,
    methods: ["Survey", "Interview", "Landing-page test"],
    evidence: [
      { id: "e1", method: "Survey", result: "71% of 412 final-year students called their capstone prompt invented.", stance: "supports" },
      { id: "e2", method: "Interview", result: "6 of 8 students had already tried to source an external problem and given up.", stance: "supports" },
    ],
  },
  {
    id: "h2",
    statement: "Small organisations can supply enough well-scoped problems to keep a feed alive.",
    fromAssumption: "Small orgs have enough well-scoped problems to sustain supply.",
    confidence: 31,
    methods: ["Interview", "Market experiment"],
    evidence: [
      { id: "e3", method: "Interview", result: "Only 2 of 11 orgs could describe a brief a team could start immediately.", stance: "challenges" },
    ],
  },
  {
    id: "h3",
    statement: "Universities will pay per brief if learning outcomes are mapped.",
    fromAssumption: "Someone other than students will fund the problem side.",
    confidence: 44,
    methods: ["Interview", "Landing-page test", "Market experiment"],
    evidence: [
      { id: "e4", method: "Interview", result: "4 coordinators open to it; none could name a budget line.", stance: "inconclusive" },
    ],
  },
  {
    id: "h4",
    statement: "A co-signed mentor materially raises project completion rates.",
    fromAssumption: "Mentorship is the missing accountability layer.",
    confidence: 26,
    methods: ["Prototype test", "User feedback"],
    evidence: [],
  },
];

export const seedScenarios: TestScenario[] = [
  {
    id: "t1",
    title: "Team picks a brief in under 10 minutes",
    goal: "A 4-person team lands on the feed and commits to one brief without external help.",
    successMetric: "≥60% of teams commit in the first session",
    failurePoint: "Teams stall comparing briefs because scope isn't legible at a glance",
  },
  {
    id: "t2",
    title: "Org submits a brief that passes vetting",
    goal: "An ops lead writes a brief that clears the rubric on the first or second pass.",
    successMetric: "Median 2 revisions, under 25 minutes total",
    failurePoint: "Rubric reads like paperwork and the org abandons mid-form",
  },
  {
    id: "t3",
    title: "Mentor still active at week 4",
    goal: "The co-signed mentor responds to at least one checkpoint per week.",
    successMetric: "≥70% mentors active in week 4",
    failurePoint: "Mentors treat the co-signature as ceremonial",
  },
];

export const seedFeedback: Feedback[] = [
  { id: "f1", who: "Maya · CS senior", quote: "The briefs feel real, but I couldn't tell which ones my team could finish in a semester.", sentiment: "mixed" },
  { id: "f2", who: "Dev · civic org ops lead", quote: "Writing the brief was the hard part. The rubric helped more than I expected.", sentiment: "positive" },
  { id: "f3", who: "Prof. Reyes · coordinator", quote: "I can't adopt this until outcomes map to my syllabus automatically.", sentiment: "negative" },
];

export const seedActivity: ActivityEntry[] = [
  { id: "a1", stage: "think", text: "Captured first thought and extracted 9 signals", at: "2h ago" },
  { id: "a2", stage: "research", text: "Added 6 evidence notes across 4 open questions", at: "1h ago" },
  { id: "a3", stage: "validate", text: "Confidence in supply hypothesis dropped to 31%", at: "44m ago" },
  { id: "a4", stage: "learn", text: "Narrowed to civic tech vertical after supply evidence", at: "20m ago" },
];

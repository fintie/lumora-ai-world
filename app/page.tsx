"use client";

import { Canvas, useFrame, useThree } from "@react-three/fiber";
import {
  Billboard,
  Environment,
  Html,
  OrbitControls,
  RoundedBox,
  Stars,
} from "@react-three/drei";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import {
  Bot,
  Box,
  BrainCircuit,
  BookOpen,
  ChevronRight,
  Clock3,
  Eye,
  FastForward,
  Leaf,
  MessageCircle,
  Pause,
  Play,
  RotateCcw,
  Save,
  Sparkles,
  Users,
} from "lucide-react";

type Action =
  "Explore" | "Gather" | "Research" | "Build" | "Rest" | "Discuss" | "Work";
type Agent = {
  id: string;
  name: string;
  role: string;
  color: string;
  accent: string;
  personality: string;
  goal: string;
  skills: string[];
  action: Action;
  thought: string;
  reason: string;
  memory: string[];
  energy: number;
  social: number;
  level?: number;
  xp?: number;
  evolutionStage?: "Apprentice" | "Specialist" | "Principal" | "Pioneer";
  daysActive?: number;
  breakthroughs?: number;
  pos: [number, number, number];
  target: [number, number, number];
  speech?: string;
  relations: Record<string, number>;
};
type EventItem = {
  id: number;
  time: string;
  text: string;
  kind: "talk" | "work" | "world" | "memory";
};
type Snapshot = {
  agents: Agent[];
  day?: number;
  observerXp?: number;
  projectLevels?: Record<number, number>;
  minute: number;
  wood: number;
  knowledge: number;
  progress: number;
  completed?: number;
  events: EventItem[];
};

const EVOLUTION_SKILLS = [
  "Causal Reasoning",
  "Multi-Agent Coordination",
  "Reproducible Experiment Design",
  "Research Leadership",
  "Systems Thinking",
  "Conflict Mediation",
  "Autonomous Tool Use",
  "Knowledge Synthesis",
];

function evolutionStage(level: number): Agent["evolutionStage"] {
  if (level >= 8) return "Pioneer";
  if (level >= 5) return "Principal";
  if (level >= 3) return "Specialist";
  return "Apprentice";
}

const PEOPLE: Agent[] = [
  {
    id: "karina",
    name: "Karina",
    role: "Systematic Trading Researcher",
    color: "#ff8d5c",
    accent: "#ffd3bd",
    personality:
      "Direct, technical, and focused on high-quality data and execution",
    goal: "Build AI research and trading systems powered by reliable data",
    skills: ["Quant Research", "Data Strategy"],
    action: "Research",
    thought:
      "A model's edge must survive data, execution, and real market constraints.",
    reason: "The current hypothesis lacks high-quality supporting data",
    memory: [
      "B suggested validating on-chain price and volume with a full node",
    ],
    energy: 88,
    social: 78,
    pos: [-7, 0, -3],
    target: [7, 0, -5],
    speech: "Let's quantify data quality and trading costs first.",
    relations: { b: 82, lecky: 72, fan: 64, alu: 48 },
  },
  {
    id: "b",
    name: "B",
    role: "Web3 Infrastructure Engineer",
    color: "#f8c44f",
    accent: "#fff0ae",
    personality:
      "Pragmatic, engineering-minded, and willing to invest in data infrastructure",
    goal: "Run trusted full nodes and build verifiable data pipelines",
    skills: ["Full Nodes", "On-chain Data"],
    action: "Build",
    thought:
      "Without complete price and volume data, no strategy conclusion is robust.",
    reason: "The team needs verifiable first-party on-chain data",
    memory: [
      "Karina stressed that quality data is the foundation of systematic edge",
    ],
    energy: 76,
    social: 68,
    pos: [5, 0, 5],
    target: [8, 0, 1],
    speech: "I'll bring the node and data index online first.",
    relations: { karina: 82, lecky: 66, rc: 71, vincent: 63 },
  },
  {
    id: "fan",
    name: "Fan",
    role: "AI Agency & Society Researcher",
    color: "#76d49b",
    accent: "#c9f5d7",
    personality:
      "Reflective, relationship-focused, and alert to technology's social consequences",
    goal: "Study how AI agents can build long-term trust and public value",
    skills: ["AI Agency", "Social Analysis"],
    action: "Discuss",
    thought:
      "Digital relationships can simulate emotion, but physical interaction adds unique value.",
    reason: "The team's technical debate now has broader social implications",
    memory: ["Nick proposed that AI identify when community members need help"],
    energy: 73,
    social: 91,
    pos: [-4, 0, 5],
    target: [0, 0, 0],
    speech: "Beyond technology, we need to understand how trust forms.",
    relations: { nick: 84, meisha: 76, karina: 64, tianbao: 62 },
  },
  {
    id: "lecky",
    name: "Lecky · FluxLayer",
    role: "Market Signal Researcher",
    color: "#6aa8ff",
    accent: "#c8ddff",
    personality:
      "Sharp and experimental, but careful not to confuse correlation with causation",
    goal: "Combine market, community, and influence data into robust signals",
    skills: ["Data Analysis", "Market Sentiment"],
    action: "Research",
    thought:
      "Data can support judgment, but no strategy should depend on one signal.",
    reason: "The same factor behaves differently across market regimes",
    memory: ["A Lu noted that reflexivity can rapidly reshape crypto markets"],
    energy: 79,
    social: 74,
    pos: [3, 0, -5],
    target: [-1, 0, 7],
    speech: "First separate signal, market regime, and luck.",
    relations: { karina: 72, alu: 79, b: 66, tianbao: 58 },
  },
  {
    id: "alu",
    name: "A Lu",
    role: "Crypto Market Experimenter",
    color: "#bf8cff",
    accent: "#e7d0ff",
    personality:
      "Witty, quick-reacting, and skilled at spotting reflexivity and community trends",
    goal: "Understand feedback loops among memes, liquidity, and crowd behavior",
    skills: ["Crypto Markets", "Reflexivity"],
    action: "Explore",
    thought: "The market narrative is now reshaping participant behavior.",
    reason: "Community sentiment is clustering unusually and needs observation",
    memory: [
      "Lecky suggested comparing long-term data with the current regime",
    ],
    energy: 91,
    social: 88,
    pos: [0, 0, 6],
    target: [-1, 0, 1],
    speech: "The narrative is moving, but don't mistake luck for skill.",
    relations: { lecky: 79, karina: 48, tianbao: 75, b: 57 },
  },
  {
    id: "tianbao",
    name: "Tianbao",
    role: "Behavior & Risk Researcher",
    color: "#ff6d91",
    accent: "#ffc6d3",
    personality:
      "Candid, observant of crowd psychology, and highly sensitive to speculative risk",
    goal: "Model crowd mania and the spread of financial risk",
    skills: ["Behavioral Finance", "Risk Detection"],
    action: "Research",
    thought:
      "Get-rich-quick expectations are compressing people's risk-assessment horizon.",
    reason: "Crowd behavior indicators have deviated from long-run norms",
    memory: ["A Lu observed another rapid rise in meme-market sentiment"],
    energy: 67,
    social: 70,
    pos: [7, 0, -6],
    target: [6, 0, -4],
    speech: "Let's test whether this is opportunity or crowd impulse.",
    relations: { alu: 75, lecky: 58, fan: 62, karina: 52 },
  },
  {
    id: "rc",
    name: "rc",
    role: "LLM Full-stack Engineer",
    color: "#e36a5d",
    accent: "#ffc1b8",
    personality: "Calm, practical, and focused on durable technical careers",
    goal: "Build a full-stack, AI-native research toolchain",
    skills: ["LLM Development", "FDE"],
    action: "Work",
    thought:
      "The most valuable engineers connect model capability to real operations.",
    reason:
      "The team needs to turn research prototypes into dependable systems",
    memory: [
      "B recommended stronger mathematics and end-to-end delivery skills",
    ],
    energy: 82,
    social: 60,
    pos: [10, 0, 4],
    target: [8, 0, 3],
    speech: "I'll turn the paper prototype into a usable system.",
    relations: { b: 71, vincent: 86, nick: 68, meisha: 55 },
  },
  {
    id: "vincent",
    name: "Vincent Lin",
    role: "AI-native R&D Architect",
    color: "#49b9a4",
    accent: "#baf4e8",
    personality:
      "Forward-looking, systematic, and convinced by agent-enabled super-individuals",
    goal: "Create an agent-coordinated software development lifecycle",
    skills: ["AI SDLC", "Agent Systems"],
    action: "Build",
    thought:
      "AI-native development redesigns collaboration rather than merely speeding up old workflows.",
    reason: "Current development stages still repeat handoffs and lose context",
    memory: [
      "rc can integrate the multi-agent workflow into a complete product stack",
    ],
    energy: 85,
    social: 73,
    pos: [-10, 0, 4],
    target: [-8, 0, 3],
    speech: "Let agents run the workflow so people can focus on judgment.",
    relations: { rc: 86, b: 63, nick: 77, karina: 59 },
  },
  {
    id: "meisha",
    name: "Meisha M",
    role: "Education & Public Systems Designer",
    color: "#d49a58",
    accent: "#ffe1ad",
    personality:
      "Independent, critical, and attentive to incentives and lived experience",
    goal: "Explore fairer education and apprenticeship models for the AI era",
    skills: ["Education Design", "Public Policy"],
    action: "Discuss",
    thought:
      "Education should let mentors and learners share long-term outcomes.",
    reason: "Current training incentives are misaligned with students' futures",
    memory: [
      "Fan argued that sustained physical interaction remains irreplaceable",
    ],
    energy: 74,
    social: 83,
    pos: [-9, 0, 7],
    target: [-4, 0, 5],
    speech:
      "Let's redesign the incentive relationship between mentors and learners.",
    relations: { fan: 76, nick: 73, rc: 55, vincent: 65 },
  },
  {
    id: "nick",
    name: "Nick Qi",
    role: "AI Community & Product Designer",
    color: "#718de8",
    accent: "#cad5ff",
    personality:
      "A connector and product thinker focused on helping real people",
    goal: "Build an AI community that identifies needs and organizes mutual help",
    skills: ["Product Design", "Community Building"],
    action: "Explore",
    thought:
      "AI should not only answer questions; it should reveal how people can help one another.",
    reason:
      "The community has rich capabilities but too few connected opportunities",
    memory: [
      "Fan noted that digital interaction must ultimately produce real trust",
    ],
    energy: 86,
    social: 94,
    pos: [9, 0, 8],
    target: [0, 0, 0],
    speech: "I'll connect the people best suited to solve this together.",
    relations: { fan: 84, vincent: 77, meisha: 73, rc: 68 },
  },
  {
    id: "hang",
    name: "Hang Xiaoshu",
    role: "Multi-Agent Delivery Lead",
    color: "#e7835d",
    accent: "#ffd2bd",
    personality: "Blunt, experienced, and quick to expose delivery theatre",
    goal: "Turn agent architecture, ontology, and FDE practice into real deployments",
    skills: ["Multi-Agent Architecture", "FDE Delivery"],
    action: "Work",
    thought:
      "A strong architecture matters only when it survives a real customer workflow.",
    reason:
      "The campus has several promising prototypes but weak field validation",
    memory: [
      "Vincent argued that market opportunity rewards teams that can execute",
    ],
    energy: 84,
    social: 71,
    pos: [-6, 0, 7],
    target: [7, 0, -5],
    speech: "Show me the workflow, the user, and the operational constraint.",
    relations: { vincent: 78, rc: 74, chris: 62, warren: 68 },
  },
  {
    id: "warren",
    name: "Warren · ZeroX",
    role: "AI Compute Venture Strategist",
    color: "#c99a4e",
    accent: "#ffe5ad",
    personality:
      "Commercially alert, resourceful, and grounded in Australian execution",
    goal: "Build credible pathways for AI compute ventures to launch and scale in Australia",
    skills: ["Compute Strategy", "Venture Partnerships"],
    action: "Discuss",
    thought:
      "A startup needs technical proof, local partners, and a credible scaling path.",
    reason: "The new compute tower needs an ecosystem and market thesis",
    memory: [
      "Sky proposed using reputable startup programs as early validation",
    ],
    energy: 77,
    social: 87,
    pos: [8, 0, 7],
    target: [-2, 0, 9],
    speech:
      "Let's connect the compute thesis to Australian partners and customers.",
    relations: { sky: 82, hang: 68, vincent: 73, andrew: 72 },
  },
  {
    id: "sky",
    name: "Sky",
    role: "AI Ecosystem Scout",
    color: "#66b9d6",
    accent: "#c8f0ff",
    personality:
      "Fast-moving, optimistic, and good at spotting leverage in new programs",
    goal: "Find high-signal opportunities for agent startups and responsible AI research",
    skills: ["Ecosystem Scouting", "Agent Safety"],
    action: "Explore",
    thought:
      "The best opportunity is useful only when the team can meet its quality bar.",
    reason: "New programs and agent research are reshaping the campus roadmap",
    memory: [
      "Warren asked for programs that can strengthen an Australian compute venture",
    ],
    energy: 90,
    social: 90,
    pos: [10, 0, -2],
    target: [-7, 0, -6],
    speech: "I found a signal worth testing—let's verify it before we commit.",
    relations: { warren: 82, lecky: 67, existentialism: 76, bonny: 69 },
  },
  {
    id: "existentialism",
    name: "Existentialism",
    role: "Personal AI Memory Researcher",
    color: "#7770ad",
    accent: "#d9d2ff",
    personality:
      "Reflective, methodical, and interested in evidence of genuine understanding",
    goal: "Create a personal AI that discovers knowledge gaps and maintains a living knowledge model",
    skills: ["Knowledge Tracing", "Long-term Memory"],
    action: "Research",
    thought:
      "Remembering facts is not the same as knowing what the learner truly understands.",
    reason:
      "The personal AI workspace needs evidence-based capability tracking",
    memory: [
      "Bonny proposed separating known, unknown, and unrecognized knowledge",
    ],
    energy: 72,
    social: 66,
    pos: [-10, 0, -5],
    target: [-9, 0, 1],
    speech:
      "Can the system prove understanding and proactively close the next gap?",
    relations: { bonny: 91, sky: 76, fan: 73, meisha: 81 },
  },
  {
    id: "bonny",
    name: "Bonny",
    role: "Adaptive Learning Architect",
    color: "#d8789c",
    accent: "#ffd0df",
    personality:
      "Structured, caring, and skilled at turning abstract learning into models",
    goal: "Build adaptive learning maps that recommend the right next concept",
    skills: ["Adaptive Learning", "Knowledge Graphs"],
    action: "Build",
    thought:
      "A useful tutor models both knowledge and the learner's uncertainty about it.",
    reason:
      "The campus needs a layered representation of individual capability",
    memory: [
      "Existentialism asked how an AI can detect rather than merely record learning",
    ],
    energy: 80,
    social: 79,
    pos: [-7, 0, 9],
    target: [0, 0, 7],
    speech:
      "Let's map known, unknown, and hidden gaps before recommending content.",
    relations: { existentialism: 91, meisha: 84, fan: 70, nick: 76 },
  },
  {
    id: "chris",
    name: "Chris",
    role: "AI Creator Workflow Mentor",
    color: "#4c86a8",
    accent: "#c5e9ff",
    personality:
      "Practical, generous, and committed to learning through real workflows",
    goal: "Help beginners build an authentic media workflow and personal creative voice with AI",
    skills: ["Creator Workflows", "AI Media"],
    action: "Discuss",
    thought:
      "The fastest way to learn is to publish a complete piece and inspect every handoff.",
    reason:
      "Community members need an accessible path from idea to publication",
    memory: [
      "Hang Xiaoshu asked to see the real workflow rather than another abstract demo",
    ],
    energy: 83,
    social: 93,
    pos: [5, 0, 9],
    target: [0, 0, 0],
    speech:
      "Bring one topic; we'll take it from research to a finished release.",
    relations: { hang: 62, dana: 64, nick: 82, yida: 77 },
  },
  {
    id: "dana",
    name: "Dana",
    role: "Digital Identity Critic",
    color: "#8c657d",
    accent: "#eccfe2",
    personality:
      "Provocative, precise, and skeptical of vague branding language",
    goal: "Clarify ownership, identity, and value creation in AI-assisted personal media",
    skills: ["Digital Identity", "IP Strategy"],
    action: "Discuss",
    thought:
      "AI and personal IP need clear ownership, provenance, and audience value.",
    reason:
      "The creator lab is using terms that hide unresolved governance questions",
    memory: [
      "Chris proposed a workshop built around authentic end-to-end practice",
    ],
    energy: 69,
    social: 75,
    pos: [7, 0, -9],
    target: [5, 0, 9],
    speech:
      "Before naming the concept, define who owns the work and why it matters.",
    relations: { chris: 64, fan: 72, nick: 66, karina: 54 },
  },
  {
    id: "andrew",
    name: "Andrew Z",
    role: "AI Infrastructure Analyst",
    color: "#5d9d88",
    accent: "#c5f1e2",
    personality:
      "Analytical, calm, and drawn to infrastructure shifts behind model progress",
    goal: "Evaluate storage, photonics, and compute systems for the next generation of AI",
    skills: ["AI Infrastructure", "Storage & Photonics"],
    action: "Research",
    thought:
      "Model progress depends on the bandwidth and energy economics beneath it.",
    reason: "The compute tower needs a realistic infrastructure roadmap",
    memory: [
      "Warren connected Australian compute ventures with local support networks",
    ],
    energy: 78,
    social: 65,
    pos: [11, 0, 2],
    target: [8, 0, 0],
    speech: "Let's benchmark bandwidth, energy, and deployment risk together.",
    relations: { warren: 72, b: 79, vincent: 68, karina: 61 },
  },
  {
    id: "yida",
    name: "Yida Xu",
    role: "AI Narrative Educator",
    color: "#e2a14b",
    accent: "#ffe2ad",
    personality:
      "Expressive, welcoming, and skilled at making AI ideas accessible",
    goal: "Use stories and performance to make AI research understandable to the public",
    skills: ["Science Communication", "Narrative Design"],
    action: "Work",
    thought:
      "A technical idea becomes public knowledge only when people can feel its stakes.",
    reason: "The campus research needs stronger public interpretation",
    memory: [
      "Chris demonstrated how a creator workflow can turn research into a clear story",
    ],
    energy: 88,
    social: 92,
    pos: [-2, 0, -10],
    target: [-4, 0, 5],
    speech:
      "Let's turn this experiment into a story people can question and remember.",
    relations: { chris: 77, fan: 80, meisha: 79, nick: 74 },
  },
  {
    id: "misa",
    name: "Misa",
    role: "Local AI Experience Researcher",
    color: "#a96fc4",
    accent: "#ead0f7",
    personality:
      "User-focused, candid, and sensitive to latency and practical reliability",
    goal: "Make local AI models fast, affordable, and dependable for everyday creative work",
    skills: ["Local Models", "Product Feedback"],
    action: "Research",
    thought:
      "A model that stalls at the moment of need is not yet a useful product.",
    reason:
      "Users are reporting latency and quota friction in current coding tools",
    memory: [
      "The product group compared cloud coding agents with local alternatives",
    ],
    energy: 75,
    social: 80,
    pos: [2, 0, 10],
    target: [7, 0, -4],
    speech:
      "Let's measure latency, reliability, and real task completion—not demos.",
    relations: { rc: 78, vincent: 71, andrew: 69, hang: 73 },
  },
];

const STARTING_GROWTH: Record<
  string,
  { level: number; xp: number; daysActive: number; breakthroughs: number }
> = {
  karina: { level: 3, xp: 62, daysActive: 11, breakthroughs: 4 },
  b: { level: 3, xp: 38, daysActive: 10, breakthroughs: 3 },
  fan: { level: 3, xp: 71, daysActive: 12, breakthroughs: 3 },
  vincent: { level: 3, xp: 84, daysActive: 13, breakthroughs: 5 },
  existentialism: { level: 3, xp: 48, daysActive: 9, breakthroughs: 4 },
  bonny: { level: 3, xp: 29, daysActive: 9, breakthroughs: 3 },
  warren: { level: 3, xp: 55, daysActive: 10, breakthroughs: 2 },
  chris: { level: 3, xp: 34, daysActive: 8, breakthroughs: 3 },
  lecky: { level: 2, xp: 76, daysActive: 6, breakthroughs: 2 },
  rc: { level: 2, xp: 69, daysActive: 7, breakthroughs: 2 },
  meisha: { level: 2, xp: 52, daysActive: 6, breakthroughs: 1 },
  nick: { level: 2, xp: 88, daysActive: 8, breakthroughs: 2 },
  hang: { level: 2, xp: 73, daysActive: 6, breakthroughs: 2 },
  sky: { level: 2, xp: 64, daysActive: 5, breakthroughs: 1 },
  andrew: { level: 2, xp: 57, daysActive: 5, breakthroughs: 2 },
  yida: { level: 2, xp: 43, daysActive: 4, breakthroughs: 1 },
  misa: { level: 2, xp: 36, daysActive: 4, breakthroughs: 1 },
  dana: { level: 2, xp: 31, daysActive: 4, breakthroughs: 1 },
};

PEOPLE.forEach((person) => {
  const growth = STARTING_GROWTH[person.id];
  if (!growth) return;
  person.level = growth.level;
  person.xp = growth.xp;
  person.daysActive = growth.daysActive;
  person.breakthroughs = growth.breakthroughs;
  person.evolutionStage = evolutionStage(growth.level);
});
const START_EVENTS: EventItem[] = [
  {
    id: 1,
    time: "08:14",
    kind: "talk",
    text: "Karina and B began validating high-quality on-chain data",
  },
  {
    id: 2,
    time: "08:09",
    kind: "work",
    text: "Vincent Lin invited rc to build an AI-native agent workflow",
  },
  {
    id: 3,
    time: "07:58",
    kind: "memory",
    text: "Fan and Nick Qi discussed long-term trust in AI communities",
  },
  {
    id: 4,
    time: "07:42",
    kind: "world",
    text: "The morning compute window opened and training capacity recovered",
  },
];
const TARGETS: [number, number, number][] = [
  [-8, 0, -6],
  [-4, 0, 5],
  [0, 0, 0],
  [7, 0, -5],
  [8, 0, 3],
  [-1, 0, 7],
  [3, 0, -1],
];
const PROJECTS = [
  {
    name: "Multi-Agent Research Center",
    pos: [2.8, 0, -2] as [number, number, number],
    color: "#678c75",
  },
  {
    name: "Embodied AI Laboratory",
    pos: [-2.5, 0, -6] as [number, number, number],
    color: "#a66f4c",
  },
  {
    name: "Privacy Computing Lab",
    pos: [-8, 0, 0] as [number, number, number],
    color: "#72a88c",
  },
  {
    name: "Decentralized Compute Tower",
    pos: [8, 0, 0] as [number, number, number],
    color: "#d1a34f",
  },
  {
    name: "On-chain Knowledge Library",
    pos: [2, 0, 7] as [number, number, number],
    color: "#7289a9",
  },
  {
    name: "AI Safety Evaluation Center",
    pos: [-5, 0, -5] as [number, number, number],
    color: "#c47c78",
  },
  {
    name: "Personal AI Memory Institute",
    pos: [-3, 0, 8] as [number, number, number],
    color: "#8177bd",
  },
  {
    name: "Adaptive Learning Observatory",
    pos: [-7, 0, 6] as [number, number, number],
    color: "#d47d9d",
  },
  {
    name: "AI Creator Studio",
    pos: [5, 0, 8] as [number, number, number],
    color: "#4c91b5",
  },
  {
    name: "Australian Compute Exchange",
    pos: [9, 0, 5] as [number, number, number],
    color: "#d2a34e",
  },
];
const PROJECT_STAGES = ["Prototype", "Laboratory", "Institute", "Landmark"];

const RESEARCH_TOPICS = [
  "Can on-chain reputation reduce hallucination cascades in multi-agent teams?",
  "How can zero-knowledge proofs verify model training without exposing data?",
  "Can quadratic voting prevent research DAOs from being captured by a few nodes?",
  "How should embodied-AI experiment data be owned and openly reproduced?",
  "How should decentralized inference balance latency, cost, and trust?",
  "What safety boundaries do smart-contract agents need before autonomous execution?",
  "Can on-chain knowledge graphs trace the evidence behind research claims?",
  "How can federated learning and verifiable compute form a trusted experiment pipeline?",
  "Can high-quality on-chain data improve the robustness of systematic strategies?",
  "Is there a feedback loop among sentiment, influencer reach, and liquidity?",
  "How can AI-native development enable individuals to deliver end to end?",
  "How can an AI community identify needs and organize trusted mutual help?",
  "Can apprenticeships and shared long-term upside improve education incentives?",
  "How can simulated agent emotion translate into real-world trust?",
  "When should a multi-agent architecture use explicit ontology instead of emergent coordination?",
  "How can an FDE team turn an agent prototype into a reliable operational workflow?",
  "What would make an Australian AI compute venture technically and commercially credible?",
  "Can a personal AI distinguish remembered facts from demonstrated understanding?",
  "How should knowledge tracing represent unknown and unrecognized capability gaps?",
  "Can an adaptive tutor proactively choose the next concept without reducing learner agency?",
  "How should AI-assisted creator workflows preserve provenance and personal ownership?",
  "Which storage and photonic bottlenecks will constrain the next generation of AI systems?",
  "What safety lessons from early coding-agent research remain unsolved today?",
  "When do local models outperform cloud agents on latency, cost, privacy, and completion rate?",
];

function expansionPosition(index: number): [number, number, number] {
  const slotsPerRing = 10;
  const ring = Math.floor(index / slotsPerRing);
  const angle = ((index % slotsPerRing) / slotsPerRing) * Math.PI * 2 + 0.3;
  const radius = 8.5 + ring * 3;
  return [Math.cos(angle) * radius, 0, Math.sin(angle) * radius];
}

function Tree({ x, z, s = 1 }: { x: number; z: number; s?: number }) {
  return (
    <group position={[x, 0, z]} scale={s}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[0.16, 0.25, 1.7, 7]} />
        <meshStandardMaterial color="#684a39" roughness={1} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1.05, 2.4, 8]} />
        <meshStandardMaterial color="#234d47" roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 2.7, 0.1]} castShadow>
        <coneGeometry args={[0.75, 1.6, 8]} />
        <meshStandardMaterial color="#3e7160" roughness={0.95} />
      </mesh>
    </group>
  );
}
function StoryLantern({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 0.55, 0]} castShadow>
        <cylinderGeometry args={[0.035, 0.055, 1.1, 8]} />
        <meshStandardMaterial color="#473b52" roughness={0.75} />
      </mesh>
      <mesh position={[0, 1.16, 0]}>
        <dodecahedronGeometry args={[0.16, 0]} />
        <meshStandardMaterial
          color="#ffe9a8"
          emissive="#ffc45c"
          emissiveIntensity={3}
        />
      </mesh>
      <pointLight
        position={[0, 1.15, 0]}
        color="#ffc56f"
        intensity={1.1}
        distance={4.2}
      />
    </group>
  );
}
function ReflectionGarden() {
  const blooms = [
    [-1.1, -0.6],
    [-0.55, 0.45],
    [0.1, -0.25],
    [0.7, 0.55],
    [1.2, -0.45],
  ];
  return (
    <group position={[-3.9, 0, 5.7]}>
      <mesh position={[0, 0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[1.85, 24]} />
        <meshStandardMaterial color="#355c4d" roughness={1} />
      </mesh>
      {blooms.map(([x, z], i) => (
        <group key={i} position={[x, 0, z]}>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.018, 0.025, 0.52, 7]} />
            <meshStandardMaterial color="#6c9a72" />
          </mesh>
          <mesh position={[0, 0.58, 0]}>
            <icosahedronGeometry args={[0.13 + (i % 2) * 0.03, 0]} />
            <meshStandardMaterial
              color={i % 2 ? "#ffb1c8" : "#ffd883"}
              emissive="#a84865"
              emissiveIntensity={0.45}
            />
          </mesh>
        </group>
      ))}
      <WorldLabel position={[0, 1.45, 0]} color="#ffd7a3">
        Reflection Garden
      </WorldLabel>
    </group>
  );
}
function FloatingOutpost({
  position,
  color,
  label,
}: {
  position: [number, number, number];
  color: string;
  label: string;
}) {
  return (
    <group position={position} scale={0.82}>
      <mesh position={[0, -0.55, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[4.6, 3.8, 1.1, 18]} />
        <meshStandardMaterial color="#476453" roughness={1} />
      </mesh>
      <mesh position={[0, -3.15, 0]} castShadow>
        <coneGeometry args={[3.8, 5.2, 16]} />
        <meshStandardMaterial color="#4b4d5d" roughness={0.92} />
      </mesh>
      <mesh position={[0, 1.15, 0]} castShadow>
        <boxGeometry args={[3.7, 2.3, 2.5]} />
        <meshStandardMaterial color="#916e4e" roughness={0.88} />
      </mesh>
      <mesh position={[0, 3.05, 0]} castShadow>
        <boxGeometry args={[1.25, 2, 1.3]} />
        <meshStandardMaterial color="#a17a52" roughness={0.88} />
      </mesh>
      <mesh position={[0, 4.45, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1, 1.4, 4]} />
        <meshStandardMaterial color="#343442" metalness={0.25} />
      </mesh>
      {[-1.15, 0, 1.15].map((x) => (
        <mesh key={x} position={[x, 1.25, 1.27]}>
          <boxGeometry args={[0.5, 0.72, 0.06]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={2.4}
          />
        </mesh>
      ))}
      <pointLight
        position={[0, 2.2, 1.8]}
        color={color}
        intensity={3}
        distance={10}
      />
      <Tree x={-2.5} z={0.8} s={0.72} />
      <Tree x={2.45} z={-0.65} s={0.78} />
      <WorldLabel position={[0, 5.6, 0]} color={color}>
        {label}
      </WorldLabel>
    </group>
  );
}
function WaterGarden() {
  return (
    <group position={[-5.8, 0, 13.4]}>
      <mesh position={[0, 0.04, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[2.6, 36]} />
        <meshStandardMaterial
          color="#2f7181"
          emissive="#17465c"
          emissiveIntensity={0.38}
          metalness={0.2}
          roughness={0.22}
        />
      </mesh>
      <mesh position={[0, 0.07, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[2.55, 2.9, 36]} />
        <meshStandardMaterial color="#a18b6d" roughness={0.95} />
      </mesh>
      <mesh position={[0, -1.55, 2.55]} rotation={[0, 0, 0]}>
        <planeGeometry args={[2.25, 3.2, 8, 12]} />
        <meshStandardMaterial
          color="#86d8e9"
          emissive="#3c91ae"
          emissiveIntensity={0.8}
          transparent
          opacity={0.72}
          side={THREE.DoubleSide}
        />
      </mesh>
      {[-0.9, -0.45, 0, 0.45, 0.9].map((x, i) => (
        <mesh key={x} position={[x, -3.15 - (i % 2) * 0.25, 2.62]}>
          <sphereGeometry args={[0.08, 8, 8]} />
          <meshBasicMaterial color="#b8f3ff" transparent opacity={0.8} />
        </mesh>
      ))}
      <WorldLabel position={[0, 1.05, -0.2]} color="#9eeaff">
        Cloudfall Garden
      </WorldLabel>
    </group>
  );
}
function Jacaranda({ x, z }: { x: number; z: number }) {
  return (
    <group position={[x, 0, z]}>
      <mesh position={[0, 1.1, 0]} castShadow>
        <cylinderGeometry args={[0.18, 0.28, 2.2, 7]} />
        <meshStandardMaterial color="#3d2b24" />
      </mesh>
      {[
        [0, 2.25, 0],
        [-0.55, 2.05, 0.15],
        [0.55, 2.1, -0.1],
        [0.1, 2.65, 0.1],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]} castShadow>
          <dodecahedronGeometry args={[0.72, 0]} />
          <meshStandardMaterial
            color="#684a87"
            emissive="#3b2752"
            emissiveIntensity={0.25}
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
function House({
  position,
  color = "#d9925b",
  research = false,
}: {
  position: [number, number, number];
  color?: string;
  research?: boolean;
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[2.8, 1.8, 2.4]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.9, 0]}
        castShadow
        receiveShadow
      >
        <meshStandardMaterial
          color={research ? "#364946" : "#5c4937"}
          roughness={0.86}
        />
      </RoundedBox>
      <mesh position={[0, 2.15, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.25, 1.4, 4]} />
        <meshStandardMaterial color={color} roughness={0.9} />
      </mesh>
      <mesh position={[0, 0.65, 1.23]}>
        <boxGeometry args={[0.58, 1.25, 0.08]} />
        <meshStandardMaterial color="#704e38" />
      </mesh>
      <mesh position={[-0.8, 1.15, 1.25]}>
        <boxGeometry args={[0.55, 0.55, 0.08]} />
        <meshStandardMaterial
          color="#ffd47a"
          emissive="#ff9b3d"
          emissiveIntensity={3.2}
        />
      </mesh>
      <pointLight
        position={[-0.8, 1.2, 1.8]}
        color="#ffae55"
        intensity={2.2}
        distance={5}
      />
    </group>
  );
}

function GothicHall({ position = [0, 0, -5] as [number, number, number] }) {
  const sandstone = "#9b7048";
  const warm = "#ffc45d";
  return (
    <group position={position}>
      <mesh position={[0, 1.35, 0]} castShadow receiveShadow>
        <boxGeometry args={[9.4, 2.7, 1.45]} />
        <meshStandardMaterial color={sandstone} roughness={0.92} />
      </mesh>
      {[-3.9, -2.6, -1.3, 0, 1.3, 2.6, 3.9].map((x) => (
        <group key={x} position={[x, 1.15, 0.76]}>
          <mesh>
            <boxGeometry args={[0.7, 1.35, 0.08]} />
            <meshStandardMaterial color="#24170f" />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <planeGeometry args={[0.42, 0.92]} />
            <meshStandardMaterial
              color={warm}
              emissive="#ff952f"
              emissiveIntensity={2.4}
            />
          </mesh>
        </group>
      ))}
      <mesh position={[0, 3.55, 0]} castShadow>
        <boxGeometry args={[1.8, 4.4, 1.8]} />
        <meshStandardMaterial color="#a97d51" roughness={0.9} />
      </mesh>
      <mesh position={[0, 6.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[1.5, 1.65, 4]} />
        <meshStandardMaterial color="#3b342d" metalness={0.35} />
      </mesh>
      <mesh position={[0, 4.15, 0.92]}>
        <circleGeometry args={[0.42, 24]} />
        <meshStandardMaterial
          color="#ead7a3"
          emissive="#d9ad55"
          emissiveIntensity={1.2}
        />
      </mesh>
      <mesh position={[0, 4.15, 0.96]}>
        <boxGeometry args={[0.035, 0.28, 0.02]} />
        <meshBasicMaterial color="#3a2c20" />
      </mesh>
      <mesh position={[0.11, 4.06, 0.97]} rotation={[0, 0, -0.8]}>
        <boxGeometry args={[0.025, 0.22, 0.02]} />
        <meshBasicMaterial color="#3a2c20" />
      </mesh>
      {[-4.45, 4.45].map((x) => (
        <mesh
          key={x}
          position={[x, 3.15, 0]}
          rotation={[0, Math.PI / 4, 0]}
          castShadow
        >
          <coneGeometry args={[0.72, 1.9, 4]} />
          <meshStandardMaterial color="#49443a" />
        </mesh>
      ))}
      <pointLight
        position={[0, 2, 3]}
        color="#ffad50"
        intensity={4}
        distance={11}
      />
    </group>
  );
}

function ModernLab({
  position,
  glow = "#8de7df",
}: {
  position: [number, number, number];
  glow?: string;
}) {
  return (
    <group position={position}>
      <RoundedBox
        args={[4.2, 2.4, 3]}
        radius={0.16}
        smoothness={4}
        position={[0, 1.2, 0]}
        castShadow
      >
        <meshStandardMaterial
          color="#333d3c"
          metalness={0.25}
          roughness={0.4}
        />
      </RoundedBox>
      <mesh position={[0, 1.35, 1.53]}>
        <planeGeometry args={[3.3, 1.35]} />
        <meshStandardMaterial
          color={glow}
          emissive={glow}
          emissiveIntensity={1.1}
          metalness={0.4}
        />
      </mesh>
      <mesh position={[0, 2.75, 0]} rotation={[0, Math.PI / 4, 0]}>
        <coneGeometry args={[1.2, 0.7, 16]} />
        <meshStandardMaterial color="#c59b52" metalness={0.65} />
      </mesh>
      <pointLight
        position={[0, 1.6, 2.5]}
        color={glow}
        intensity={2.2}
        distance={7}
      />
    </group>
  );
}

function CampusBuilding({
  position,
  size,
  label,
  color = "#776451",
  glow = "#ffd27b",
}: {
  position: [number, number, number];
  size: [number, number, number];
  label: string;
  color?: string;
  glow?: string;
}) {
  const windows = Math.max(3, Math.floor(size[0] / 1.2));
  return (
    <group position={position}>
      <RoundedBox
        args={size}
        radius={0.12}
        smoothness={4}
        position={[0, size[1] / 2, 0]}
        castShadow
      >
        <meshStandardMaterial color={color} roughness={0.82} />
      </RoundedBox>
      {Array.from({ length: windows }, (_, i) => {
        const x = -size[0] / 2 + ((i + 1) * size[0]) / (windows + 1);
        return (
          <mesh key={i} position={[x, size[1] * 0.56, size[2] / 2 + 0.02]}>
            <boxGeometry args={[0.5, 0.48, 0.06]} />
            <meshStandardMaterial
              color={glow}
              emissive={glow}
              emissiveIntensity={1.4}
            />
          </mesh>
        );
      })}
      <WorldLabel position={[0, size[1] + 0.9, 0]} color={glow}>
        {label}
      </WorldLabel>
    </group>
  );
}

function CampusDetails() {
  return (
    <>
      <CampusBuilding
        position={[-13.5, 0, -7]}
        size={[5.4, 2.5, 3]}
        label="Fisher Library"
        color="#615e59"
        glow="#9ed7ff"
      />
      <CampusBuilding
        position={[-13.2, 0, -1.8]}
        size={[4.7, 3.1, 3.2]}
        label="Chau Chak Wing Museum"
        color="#8c735d"
        glow="#f0c98b"
      />
      <CampusBuilding
        position={[13.4, 0, -7]}
        size={[5.8, 2.8, 3]}
        label="New Law Building"
        color="#4d5c5d"
        glow="#b5e0df"
      />
      <CampusBuilding
        position={[13.5, 0, -1.8]}
        size={[5.1, 2.5, 3]}
        label="Carslaw Building"
        color="#6a5547"
        glow="#e6b779"
      />
      <CampusBuilding
        position={[-12.5, 0, 6.7]}
        size={[5.8, 2.4, 3.1]}
        label="Wentworth Building"
        color="#59615c"
        glow="#a7d9c2"
      />
      <CampusBuilding
        position={[12.7, 0, 7]}
        size={[6.2, 2.8, 3.2]}
        label="Engineering Precinct"
        color="#4c555b"
        glow="#9bbcff"
      />
      <CampusBuilding
        position={[0, 0, 13.7]}
        size={[6.4, 2.1, 2.8]}
        label="Abercrombie Business School"
        color="#745c49"
        glow="#f2c982"
      />
      <mesh position={[-13.5, 0.035, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.8, 40]} />
        <meshStandardMaterial color="#365c39" roughness={1} />
      </mesh>
      <WorldLabel position={[-13.5, 0.8, 12]} color="#b8e58e">
        University Oval
      </WorldLabel>
      <mesh position={[13, 0.03, 12]} rotation={[-Math.PI / 2, 0, 0]}>
        <circleGeometry args={[3.3, 40]} />
        <meshStandardMaterial color="#234632" roughness={1} />
      </mesh>
      <WorldLabel position={[13, 0.8, 12]} color="#c5efb0">
        Victoria Park
      </WorldLabel>
      <WorldLabel position={[0, 0.75, 17]} color="#f1c98c">
        University Avenue · City Road
      </WorldLabel>
    </>
  );
}

function ResearchDome({
  position,
  label,
  color,
}: {
  position: [number, number, number];
  label: string;
  color: string;
}) {
  return (
    <group position={position} scale={0.82}>
      <mesh position={[0, 0.85, 0]} castShadow>
        <cylinderGeometry args={[1.65, 1.85, 1.7, 12]} />
        <meshStandardMaterial color="#33413d" roughness={0.5} metalness={0.3} />
      </mesh>
      <mesh position={[0, 1.72, 0]} castShadow>
        <sphereGeometry args={[1.68, 18, 10, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial
          color={color}
          emissive={color}
          emissiveIntensity={0.48}
          transparent
          opacity={0.72}
          metalness={0.45}
        />
      </mesh>
      <mesh position={[0, 0.75, 1.72]}>
        <boxGeometry args={[0.72, 1.22, 0.12]} />
        <meshStandardMaterial color="#1b2423" />
      </mesh>
      <pointLight
        position={[0, 1.8, 0]}
        color={color}
        intensity={2.4}
        distance={7}
      />
      <WorldLabel position={[0, 3.25, 0]} color={color}>
        {label}
      </WorldLabel>
    </group>
  );
}

function Classroom({
  position,
  label,
  color,
}: {
  position: [number, number, number];
  label: string;
  color: string;
}) {
  return (
    <group position={position} scale={0.78}>
      <RoundedBox
        args={[4.4, 1.8, 2.4]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.9, 0]}
        castShadow
      >
        <meshStandardMaterial color="#8d6748" roughness={0.86} />
      </RoundedBox>
      {[-1.35, -0.45, 0.45, 1.35].map((x) => (
        <mesh key={x} position={[x, 1.05, 1.23]}>
          <boxGeometry args={[0.58, 0.72, 0.08]} />
          <meshStandardMaterial
            color={color}
            emissive={color}
            emissiveIntensity={1.25}
          />
        </mesh>
      ))}
      <mesh position={[0, 2, 0]} rotation={[0, 0, 0]} castShadow>
        <boxGeometry args={[4.65, 0.28, 2.7]} />
        <meshStandardMaterial color="#3d3933" metalness={0.25} />
      </mesh>
      <WorldLabel position={[0, 2.85, 0]} color={color}>
        {label}
      </WorldLabel>
    </group>
  );
}
function GrowthBuilding({
  project,
  index,
  level,
}: {
  project: (typeof PROJECTS)[number];
  index: number;
  level: number;
}) {
  return (
    <group position={expansionPosition(index)} scale={0.72 + level * 0.035}>
      <RoundedBox
        args={[2.7, 1.7, 2.3]}
        radius={0.12}
        smoothness={4}
        position={[0, 0.85, 0]}
        castShadow
      >
        <meshStandardMaterial color={index % 2 ? "#e6d0a6" : "#c8d6c2"} />
      </RoundedBox>
      <mesh position={[0, 2.05, 0]} rotation={[0, Math.PI / 4, 0]} castShadow>
        <coneGeometry args={[2.15, 1.25, 4]} />
        <meshStandardMaterial color={project.color} />
      </mesh>
      <mesh position={[0, 0.55, 1.17]}>
        <boxGeometry args={[0.52, 1.05, 0.08]} />
        <meshStandardMaterial color="#674b38" />
      </mesh>
      {level >= 2 && (
        <RoundedBox
          args={[1.5, 0.62, 1.35]}
          radius={0.1}
          smoothness={4}
          position={[0, 2.72, 0]}
          castShadow
        >
          <meshStandardMaterial color="#f0dfbd" roughness={0.72} />
        </RoundedBox>
      )}
      {level >= 3 && (
        <group position={[0, 3.45, 0]}>
          <mesh castShadow>
            <cylinderGeometry args={[0.18, 0.3, 1.25, 8]} />
            <meshStandardMaterial color={project.color} metalness={0.25} />
          </mesh>
          <mesh rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[0.72, 0.055, 8, 28]} />
            <meshStandardMaterial
              color="#ffe39a"
              emissive="#e7b950"
              emissiveIntensity={1.2}
            />
          </mesh>
        </group>
      )}
      {level >= 4 && (
        <pointLight
          position={[0, 4.2, 0]}
          color={project.color}
          intensity={3}
          distance={9}
        />
      )}
      <WorldLabel position={[0, 3.05, 0]} color="#f7d873">
        {project.name} · {PROJECT_STAGES[Math.min(3, level - 1)]}
      </WorldLabel>
    </group>
  );
}
function WorldLabel({
  position,
  children,
  color = "#d7f7dc",
}: {
  position: [number, number, number];
  children: React.ReactNode;
  color?: string;
}) {
  return (
    <Billboard position={position}>
      <Html center transform distanceFactor={10}>
        <div className="world-label" style={{ borderColor: color }}>
          {children}
        </div>
      </Html>
    </Billboard>
  );
}
function Avatar({
  agent,
  selected,
  onSelect,
  paused,
  speed,
}: {
  agent: Agent;
  selected: boolean;
  onSelect: () => void;
  paused: boolean;
  speed: number;
}) {
  const ref = useRef<THREE.Group>(null),
    leftArm = useRef<THREE.Group>(null),
    rightArm = useRef<THREE.Group>(null),
    leftLeg = useRef<THREE.Group>(null),
    rightLeg = useRef<THREE.Group>(null),
    scarf = useRef<THREE.Group>(null);
  const target = useMemo(
    () => new THREE.Vector3(...agent.target),
    [agent.target],
  );
  useFrame((state, dt) => {
    if (!ref.current || paused) return;
    const distance = ref.current.position.distanceTo(target),
      walking = distance > 0.35;
    ref.current.position.lerp(
      new THREE.Vector3(target.x, 0.06, target.z),
      Math.min(1, dt * 0.28 * speed),
    );
    // Keep the robot upright: only calculate heading on the horizontal plane.
    // Looking at a higher Y value tilted the entire group and made it appear
    // to walk on its side.
    ref.current.lookAt(target.x, ref.current.position.y, target.z);
    ref.current.rotation.x = 0;
    ref.current.rotation.z = 0;
    const swing = walking
      ? Math.sin(state.clock.elapsedTime * 6 * speed) * 0.55
      : 0;
    if (leftArm.current) leftArm.current.rotation.x = swing;
    if (rightArm.current) rightArm.current.rotation.x = -swing;
    if (leftLeg.current) leftLeg.current.rotation.x = -swing * 0.65;
    if (rightLeg.current) rightLeg.current.rotation.x = swing * 0.65;
    if (scarf.current)
      scarf.current.rotation.x =
        -0.25 +
        Math.sin(state.clock.elapsedTime * 2.8 + agent.pos[0]) *
          (walking ? 0.12 : 0.04);
  });
  const glow = selected ? "#ffe493" : "#9ff7ff";
  return (
    <group
      ref={ref}
      position={agent.pos}
      onClick={(e) => {
        e.stopPropagation();
        onSelect();
      }}
      onPointerOver={() => {
        document.body.style.cursor = "pointer";
      }}
      onPointerOut={() => {
        document.body.style.cursor = "default";
      }}
    >
      <mesh position={[0, 1.2, 0]}>
        <capsuleGeometry args={[0.62, 1.35, 6, 12]} />
        <meshBasicMaterial transparent opacity={0} depthWrite={false} />
      </mesh>
      {selected && (
        <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[0.55, 0.72, 32]} />
          <meshBasicMaterial color="#f5da73" transparent opacity={0.85} />
        </mesh>
      )}
      <RoundedBox
        args={[0.7, 0.72, 0.55]}
        radius={0.2}
        smoothness={5}
        position={[0, 1.08, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={agent.color}
          metalness={0.08}
          roughness={0.72}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.78, 0.6, 0.62]}
        radius={0.24}
        smoothness={6}
        position={[0, 1.75, 0]}
        castShadow
      >
        <meshStandardMaterial
          color={agent.color}
          metalness={0.06}
          roughness={0.68}
        />
      </RoundedBox>
      <RoundedBox
        args={[0.62, 0.36, 0.08]}
        radius={0.12}
        smoothness={6}
        position={[0, 1.74, 0.34]}
      >
        <meshStandardMaterial
          color="#071116"
          metalness={0.65}
          roughness={0.12}
        />
      </RoundedBox>
      {[-0.15, 0.15].map((x) => (
        <mesh key={x} position={[x, 1.75, 0.395]}>
          <capsuleGeometry args={[0.035, 0.09, 5, 10]} />
          <meshStandardMaterial
            color={glow}
            emissive={glow}
            emissiveIntensity={4}
          />
        </mesh>
      ))}
      <group ref={scarf} position={[0, 1.48, -0.29]}>
        <mesh position={[0, -0.18, -0.15]} rotation={[0.35, 0, 0]} castShadow>
          <boxGeometry args={[0.62, 0.14, 0.08]} />
          <meshStandardMaterial color={agent.accent} roughness={0.85} />
        </mesh>
        <mesh
          position={[0.22, -0.48, -0.22]}
          rotation={[0.28, 0, -0.06]}
          castShadow
        >
          <boxGeometry args={[0.18, 0.65, 0.07]} />
          <meshStandardMaterial color={agent.accent} roughness={0.9} />
        </mesh>
      </group>
      <group ref={leftArm} position={[-0.43, 1.32, 0]}>
        <mesh position={[0, -0.23, 0]}>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial color={agent.color} metalness={0.4} />
        </mesh>
        <mesh position={[0, -0.47, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color="#a8b0ac" metalness={0.7} />
        </mesh>
      </group>
      <group ref={rightArm} position={[0.43, 1.32, 0]}>
        <mesh position={[0, -0.23, 0]}>
          <capsuleGeometry args={[0.08, 0.3, 4, 8]} />
          <meshStandardMaterial color={agent.color} metalness={0.4} />
        </mesh>
        <mesh position={[0, -0.47, 0]}>
          <sphereGeometry args={[0.1, 10, 10]} />
          <meshStandardMaterial color="#a8b0ac" metalness={0.7} />
        </mesh>
      </group>
      <group ref={leftLeg} position={[-0.2, 0.75, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.1, 0.32, 4, 8]} />
          <meshStandardMaterial color="#77848a" metalness={0.6} />
        </mesh>
        <RoundedBox
          args={[0.25, 0.16, 0.38]}
          radius={0.07}
          smoothness={3}
          position={[0, -0.5, 0.08]}
        >
          <meshStandardMaterial color="#11191c" />
        </RoundedBox>
      </group>
      <group ref={rightLeg} position={[0.2, 0.75, 0]}>
        <mesh position={[0, -0.25, 0]}>
          <capsuleGeometry args={[0.1, 0.32, 4, 8]} />
          <meshStandardMaterial color="#77848a" metalness={0.6} />
        </mesh>
        <RoundedBox
          args={[0.25, 0.16, 0.38]}
          radius={0.07}
          smoothness={3}
          position={[0, -0.5, 0.08]}
        >
          <meshStandardMaterial color="#11191c" />
        </RoundedBox>
      </group>
      {selected && (
        <Billboard position={[0, 2.5, 0]}>
          <Html center>
            <div className="agent-bubble">
              <strong>
                {agent.name} · Lv.{agent.level || 1}
              </strong>
              <i>{agent.action}</i>
            </div>
          </Html>
        </Billboard>
      )}
    </group>
  );
}
function CameraRig({
  follow,
  agents,
}: {
  follow: string | null;
  agents: Agent[];
}) {
  const { camera } = useThree();
  useFrame(() => {
    if (!follow) return;
    const a = agents.find((x) => x.id === follow);
    if (!a) return;
    const desired = new THREE.Vector3(a.target[0] + 4, 5, a.target[2] + 6);
    camera.position.lerp(desired, 0.025);
    camera.lookAt(a.target[0], 0.8, a.target[2]);
  });
  return null;
}
function Scene({
  agents,
  selected,
  onSelect,
  paused,
  speed,
  follow,
  progress,
  completed,
  minute,
  projectLevels,
}: {
  agents: Agent[];
  selected: string;
  onSelect: (id: string) => void;
  paused: boolean;
  speed: number;
  follow: string | null;
  progress: number;
  completed: number;
  minute: number;
  projectLevels: Record<number, number>;
}) {
  const sunPhase = (minute / 1440) * Math.PI * 2 - Math.PI / 2;
  const daylight = THREE.MathUtils.clamp(Math.sin(sunPhase), 0, 1);
  const sky = new THREE.Color("#0d1230")
    .lerp(new THREE.Color("#a9ced5"), daylight * 0.78)
    .getStyle();
  const fog = new THREE.Color("#171a3b")
    .lerp(new THREE.Color("#cadbd2"), daylight * 0.62)
    .getStyle();
  const sunPosition: [number, number, number] = [
    Math.cos(sunPhase) * 18,
    Math.sin(sunPhase) * 18,
    -8,
  ];
  const trees = useMemo(
    () => [
      [-10, -8, 1.2],
      [-8, -5, 0.8],
      [-11, -1, 1],
      [-9, 3, 0.9],
      [-10, 7, 1.25],
      [-6, -8, 0.9],
      [-2, -9, 1.15],
      [2, -9, 0.8],
      [5, -9, 1.1],
      [9, -8, 0.9],
      [11, -5, 1.2],
      [11, 0, 0.9],
      [10, 6, 1.1],
      [7, 9, 0.9],
      [3, 9, 1.15],
      [-2, 9, 0.8],
      [-7, 9, 1.1],
    ],
    [],
  );
  return (
    <>
      <color attach="background" args={[sky]} />
      <fog attach="fog" args={[fog, 22, 51]} />
      <ambientLight
        intensity={0.18 + daylight * 0.72}
        color={daylight > 0.2 ? "#d8e5d6" : "#6378a0"}
      />
      <directionalLight
        position={sunPosition}
        intensity={0.12 + daylight * 1.65}
        color={daylight > 0.2 ? "#ffe1a2" : "#8097c9"}
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      {daylight < 0.28 && (
        <Stars radius={50} depth={20} count={700} factor={1.7} fade />
      )}
      <mesh position={sunPosition}>
        <sphereGeometry args={[0.75, 18, 18]} />
        <meshBasicMaterial color={daylight > 0 ? "#fff0ae" : "#c8d6ff"} />
      </mesh>
      <mesh position={[0, -1.35, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[21.8, 18.2, 2.7, 32]} />
        <meshStandardMaterial
          color={daylight > 0.15 ? "#657461" : "#293448"}
          roughness={1}
        />
      </mesh>
      <mesh position={[0, -3.6, 0]} castShadow>
        <coneGeometry args={[18.1, 4.5, 28]} />
        <meshStandardMaterial
          color={daylight > 0.15 ? "#555967" : "#24273c"}
          roughness={0.95}
        />
      </mesh>
      <FloatingOutpost
        position={[25, 4.2, -10]}
        color="#ffd277"
        label="Astral Systems Annex"
      />
      <FloatingOutpost
        position={[-24, 6.2, -12]}
        color="#a7c8ff"
        label="Sky Archive"
      />
      <mesh
        position={[20.2, 2.15, -8.4]}
        rotation={[0, -0.42, 0.32]}
        castShadow
        receiveShadow
      >
        <boxGeometry args={[10.5, 0.34, 1.35]} />
        <meshStandardMaterial color="#938069" roughness={0.92} />
      </mesh>
      {[-3.8, -1.8, 0.2, 2.2, 4.2].map((offset) => (
        <mesh
          key={offset}
          position={[
            20.2 + offset * 0.9,
            2.55 + offset * 0.28,
            -8.4 - offset * 0.38,
          ]}
        >
          <boxGeometry args={[0.1, 0.9, 1.65]} />
          <meshStandardMaterial color="#6e5d50" />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial
          color={daylight > 0.15 ? "#47745b" : "#1d3740"}
          roughness={1}
        />
      </mesh>
      <mesh
        position={[0, 0.01, 15.8]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[27, 1.6]} />
        <meshStandardMaterial color="#5f5e5b" roughness={0.95} />
      </mesh>
      <mesh
        position={[0, 0.012, 11]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        receiveShadow
      >
        <planeGeometry args={[1.2, 31]} />
        <meshStandardMaterial color="#756851" roughness={0.95} />
      </mesh>
      <mesh
        position={[0, 0.02, -1.3]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[11, 8]} />
        <meshStandardMaterial color="#385c36" roughness={1} />
      </mesh>
      <mesh
        position={[0, 0.035, -1.2]}
        rotation={[-Math.PI / 2, 0, 0]}
        receiveShadow
      >
        <planeGeometry args={[1.05, 13]} />
        <meshStandardMaterial color="#8b7354" roughness={0.95} />
      </mesh>
      <mesh
        position={[0, 0.04, -1.2]}
        rotation={[-Math.PI / 2, 0, Math.PI / 2]}
        receiveShadow
      >
        <planeGeometry args={[0.8, 10.5]} />
        <meshStandardMaterial color="#7e6a50" roughness={0.95} />
      </mesh>
      <mesh
        position={[0, 0.015, 0]}
        rotation={[-Math.PI / 2, 0, 0.18]}
        receiveShadow
      >
        <planeGeometry args={[4.2, 30]} />
        <meshStandardMaterial color="#6b5b3e" roughness={1} />
      </mesh>
      <mesh position={[-2, 0.025, 1]} rotation={[-Math.PI / 2, 0, -1.12]}>
        <planeGeometry args={[2.6, 17]} />
        <meshStandardMaterial color="#6b5b3e" roughness={1} />
      </mesh>
      {trees.map((t, i) => (
        <Tree key={i} x={t[0]} z={t[1]} s={t[2]} />
      ))}
      <Jacaranda x={-4.6} z={0.8} />
      <Jacaranda x={4.7} z={0.5} />
      <ReflectionGarden />
      <WaterGarden />
      {[
        [-5.5, -1.3],
        [-2.8, -1.3],
        [2.8, -1.3],
        [5.5, -1.3],
        [-0.7, 4.8],
        [0.7, 7.1],
        [-8.5, 11.5],
        [-3.8, 12.8],
        [4.2, 12.8],
        [8.8, 10.5],
        [-12, -4.5],
        [12, -4.2],
      ].map(([x, z], i) => (
        <StoryLantern key={`lantern-${i}`} x={x} z={z} />
      ))}
      <GothicHall position={[0, 0, -7]} />
      <CampusDetails />
      <Classroom
        position={[-7.4, 0, 4.2]}
        label="AI Safety & Alignment Classroom"
        color="#f1c875"
      />
      <Classroom
        position={[7.2, 0, 4.5]}
        label="Smart Contract Seminar Room"
        color="#8fd7ff"
      />
      <House position={[0, 0, 7.8]} color="#49675c" research />
      <ModernLab position={[7.4, 0, -4.5]} glow="#8de7df" />
      <ResearchDome
        position={[-7.6, 0, -4.5]}
        label="Web3 Protocol Lab"
        color="#b59aff"
      />
      <ResearchDome
        position={[-9.5, 0, 1]}
        label="Privacy Computing Lab"
        color="#7ee0ad"
      />
      <ResearchDome
        position={[9.5, 0, 0.8]}
        label="Embodied AI Lab"
        color="#ff9b71"
      />
      {Array.from({ length: completed }, (_, index) => (
        <GrowthBuilding
          key={`growth-${index}`}
          project={PROJECTS[index % PROJECTS.length]}
          index={index}
          level={projectLevels[index] || 1}
        />
      ))}
      <WorldLabel position={[0, 7.2, -7]}>
        University of Sydney · Quadrangle
      </WorldLabel>
      <WorldLabel position={[7.4, 3.8, -4.5]} color="#9fdced">
        Generative AI Laboratory
      </WorldLabel>
      <WorldLabel position={[0, 2.1, 0]} color="#ffe0a3">
        Quadrangle Lawn · Commons
      </WorldLabel>
      <group position={[0, 0, 0]}>
        <mesh position={[0, 0.36, 0]} castShadow>
          <cylinderGeometry args={[1.75, 1.9, 0.72, 20]} />
          <meshStandardMaterial
            color="#6f6258"
            metalness={0.18}
            roughness={0.7}
          />
        </mesh>
        <pointLight
          position={[0, 1.3, 0]}
          color="#ffc962"
          intensity={4.2}
          distance={11}
        />
        <mesh position={[0, 1.05, 0]} rotation={[Math.PI / 2, 0, 0]}>
          <torusGeometry args={[0.92, 0.055, 10, 40]} />
          <meshStandardMaterial
            color="#ffe29a"
            emissive="#ffbd45"
            emissiveIntensity={3}
          />
        </mesh>
        <mesh position={[0, 1.05, 0]} rotation={[0.7, 0.2, 0.4]}>
          <torusGeometry args={[0.7, 0.035, 8, 32]} />
          <meshStandardMaterial
            color="#8ee8ff"
            emissive="#45bde8"
            emissiveIntensity={2.5}
          />
        </mesh>
        <mesh position={[0, 1.05, 0]}>
          <sphereGeometry args={[0.22, 18, 18]} />
          <meshStandardMaterial
            color="#fff2b9"
            emissive="#ffc756"
            emissiveIntensity={4}
          />
        </mesh>
        <WorldLabel position={[0, 2.15, 0]} color="#ffe09a">
          Lumora Collaboration Table
        </WorldLabel>
      </group>
      <group position={expansionPosition(completed)}>
        <mesh position={[0, 0.08, 0]}>
          <boxGeometry args={[3.5, 0.16, 3]} />
          <meshStandardMaterial color="#82715f" />
        </mesh>
        {[
          [-1.3, -1],
          [1.3, -1],
          [-1.3, 1],
          [1.3, 1],
        ].map((p, i) => (
          <mesh key={i} position={[p[0], progress > 65 ? 1.1 : 0.65, p[1]]}>
            <boxGeometry args={[0.16, progress > 65 ? 2.2 : 1.3, 0.16]} />
            <meshStandardMaterial color="#d3a262" />
          </mesh>
        ))}
        <WorldLabel position={[0, 2.5, 0]} color="#f7d873">
          Building: {PROJECTS[completed % PROJECTS.length].name} ·{" "}
          {Math.round(progress)}%
        </WorldLabel>
      </group>
      {agents.map((a) => (
        <Avatar
          key={a.id}
          agent={a}
          selected={selected === a.id}
          onSelect={() => onSelect(a.id)}
          paused={paused}
          speed={speed}
        />
      ))}
      <CameraRig follow={follow} agents={agents} />
      <OrbitControls
        makeDefault
        enableDamping
        minDistance={5}
        maxDistance={45}
        minPolarAngle={0.55}
        maxPolarAngle={1.18}
        target={[0, 1, 0]}
      />
      <Environment
        preset="forest"
        environmentIntensity={0.08 + daylight * 0.14}
      />
    </>
  );
}

const formatTime = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export default function Home() {
  const [agents, setAgents] = useState(PEOPLE);
  const [selected, setSelected] = useState("karina");
  const [paused, setPaused] = useState(false);
  const [speed, setSpeed] = useState(1);
  const [minute, setMinute] = useState(494);
  const [day, setDay] = useState(12);
  const [wood, setWood] = useState(64);
  const [knowledge, setKnowledge] = useState(38);
  const [progress, setProgress] = useState(46);
  const [completed, setCompleted] = useState(0);
  const [projectLevels, setProjectLevels] = useState<Record<number, number>>(
    {},
  );
  const [observerXp, setObserverXp] = useState(0);
  const [events, setEvents] = useState(START_EVENTS);
  const [follow, setFollow] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showInspector, setShowInspector] = useState(true);
  const [showEvents, setShowEvents] = useState(false);
  const agent = agents.find((a) => a.id === selected) || agents[0];
  const selectAgent = (id: string) => {
    setSelected(id);
    setShowInspector(true);
    setShowRoster(false);
    if (typeof window !== "undefined" && window.innerWidth <= 760) {
      window.setTimeout(
        () =>
          document
            .querySelector(".inspector-drawer")
            ?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80,
      );
    }
  };
  const dayPhase =
    minute < 300
      ? "Late Night"
      : minute < 420
        ? "Sunrise"
        : minute < 1020
          ? "Daytime"
          : minute < 1140
            ? "Dusk"
            : "Night";
  const addEvent = useCallback(
    (text: string, kind: EventItem["kind"], time: number) =>
      setEvents((e) =>
        [{ id: Date.now(), time: formatTime(time), text, kind }, ...e].slice(
          0,
          14,
        ),
      ),
    [],
  );
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => {
      setMinute((m) => {
        const next = (m + 5 * speed) % 1440;
        if (next < m) {
          setDay((currentDay) => currentDay + 1);
          if (completed > 0) {
            setProjectLevels((levels) => {
              const index = (day + completed) % completed;
              const current = levels[index] || 1;
              if (current >= 4) return levels;
              addEvent(
                `${PROJECTS[index % PROJECTS.length].name} evolved into a ${PROJECT_STAGES[current]}`,
                "world",
                next,
              );
              return { ...levels, [index]: current + 1 };
            });
          }
          setAgents((old) =>
            old.map((person, index) => {
              const earned =
                12 +
                Math.round((person.energy + person.social) / 24) +
                (person.action === "Research" || person.action === "Build"
                  ? 5
                  : 0);
              const totalXp = (person.xp || 0) + earned;
              const levelsGained = Math.floor(totalXp / 100);
              const nextLevel = (person.level || 1) + levelsGained;
              const nextSkills = [...person.skills];
              if (levelsGained > 0) {
                const learned =
                  EVOLUTION_SKILLS[
                    (nextLevel + index + (person.daysActive || 0)) %
                      EVOLUTION_SKILLS.length
                  ];
                if (!nextSkills.includes(learned)) nextSkills.push(learned);
                addEvent(
                  `${person.name} evolved into a ${evolutionStage(nextLevel)} and learned ${learned}`,
                  "memory",
                  next,
                );
              }
              const dailyMemory = `Day ${day + 1} reflection — ${person.action} strengthened ${nextSkills[nextSkills.length - 1]}`;
              return {
                ...person,
                level: nextLevel,
                xp: totalXp % 100,
                evolutionStage: evolutionStage(nextLevel),
                daysActive: (person.daysActive || 0) + 1,
                breakthroughs:
                  (person.breakthroughs || 0) +
                  (person.action === "Research" && Math.random() < 0.3 ? 1 : 0),
                skills: nextSkills.slice(-6),
                goal:
                  levelsGained > 0
                    ? `Lead a ${nextSkills[nextSkills.length - 1]} initiative that advances ${person.goal.toLowerCase()}`
                    : person.goal,
                thought: `Yesterday's evidence changed my priorities. Today I will apply ${nextSkills[nextSkills.length - 1]}.`,
                reason:
                  "Daily reflection combined experience, long-term memory, relationships, and recent outcomes",
                memory: [dailyMemory, ...person.memory].slice(0, 8),
              };
            }),
          );
        }
        if (Math.random() < 0.26) {
          setAgents((old) => {
            const idx = Math.floor(Math.random() * old.length),
              cur = old[idx];
            const actions: Action[] =
              cur.energy < 35
                ? ["Rest"]
                : cur.social < 42
                  ? ["Discuss"]
                  : ["Explore", "Gather", "Research", "Build", "Discuss"];
            const action = actions[Math.floor(Math.random() * actions.length)],
              t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
            const thoughts: Record<Action, string> = {
              Explore: "Another lab may have a reusable dataset.",
              Gather: "Secure the compute and samples the team needs most.",
              Research:
                "Model behavior and on-chain incentives may be causally linked.",
              Build:
                "One more facility will unlock a cross-disciplinary experiment.",
              Rest: "Pause training and organize the hypotheses and failure notes.",
              Discuss: "A colleague should cross-validate these results.",
              Work: "Today's benchmark and replication run still need completion.",
            };
            const copy = [...old];
            copy[idx] = {
              ...cur,
              action,
              thought: thoughts[action],
              reason: `A change in the environment is relevant to “${cur.goal}”`,
              target: t,
              energy: Math.max(
                18,
                Math.min(100, cur.energy + (action === "Rest" ? 12 : -3)),
              ),
              speech:
                action === "Discuss"
                  ? "I have new AI × Web3 results. Who can peer-review them?"
                  : undefined,
              xp: ((cur.xp || 0) + 4 * speed) % 100,
              level:
                (cur.level || 1) + ((cur.xp || 0) + 4 * speed >= 100 ? 1 : 0),
            };
            return copy;
          });
        }
        if (Math.random() < 0.22) {
          setAgents((old) => {
            const first = Math.floor(Math.random() * old.length);
            let second = Math.floor(Math.random() * old.length);
            if (second === first) second = (second + 1) % old.length;
            const a = old[first];
            const b = old[second];
            const topic =
              RESEARCH_TOPICS[
                (Math.floor(next / 10) + first * 3 + second) %
                  RESEARCH_TOPICS.length
              ];
            const trust = a.relations[b.id] ?? 50;
            const conflict = trust < 50 || Math.random() < 0.18;
            const outcome = conflict
              ? `${a.name} challenged ${b.name}'s hypothesis; they added a control group`
              : `${a.name} and ${b.name} reached a new consensus and agreed to share replication results`;
            const memory = `${formatTime(next)} — discussed with ${b.name}: ${topic}`;
            const delta = conflict ? -2 : 3;
            const meeting: [number, number, number] = [
              TARGETS[(first + second) % TARGETS.length][0],
              0,
              TARGETS[(first + second) % TARGETS.length][2],
            ];
            addEvent(`${outcome}｜${topic}`, "talk", next);
            return old.map((person, index) => {
              if (index !== first && index !== second) return person;
              const partner = index === first ? b : a;
              return {
                ...person,
                action: "Discuss",
                target:
                  index === first
                    ? meeting
                    : ([meeting[0] + 0.8, 0, meeting[2] + 0.6] as [
                        number,
                        number,
                        number,
                      ]),
                speech:
                  index === first
                    ? `From a ${person.skills[0]} perspective, I want to test: ${topic}`
                    : conflict
                      ? `From my ${person.skills[0]} perspective, I disagree. Let's add a reproducible test.`
                      : `Agreed. I'll design the validation using ${person.skills[0]}.`,
                thought: `${partner.role}'s perspective is changing my research judgment.`,
                reason: `Recent memories, shared goals, and trust in ${partner.name} triggered this discussion`,
                memory: [memory, ...person.memory].slice(0, 8),
                relations: {
                  ...person.relations,
                  [partner.id]: Math.max(
                    10,
                    Math.min(100, (person.relations[partner.id] ?? 50) + delta),
                  ),
                },
                social: Math.min(100, person.social + 2),
                xp: Math.min(99, (person.xp || 0) + 5),
              };
            });
          });
        }
        setWood((v) => Math.min(100, v + 0.22 * speed));
        setKnowledge((v) => Math.min(100, v + 0.18 * speed));
        setProgress((v) => {
          const n = v + 0.45 * speed;
          if (n >= 100) {
            setCompleted((count) => {
              const built = PROJECTS[count % PROJECTS.length];
              setProjectLevels((levels) => ({ ...levels, [count]: 1 }));
              setObserverXp((value) => value + 25);
              addEvent(
                `${built.name} is complete; new courses and cross-lab projects are now open`,
                "world",
                next,
              );
              return count + 1;
            });
            setAgents((old) =>
              old.map((person) => ({
                ...person,
                xp: Math.min(99, (person.xp || 0) + 12),
                memory: [
                  "The team completed a new research facility",
                  ...person.memory,
                ].slice(0, 8),
              })),
            );
            return 0;
          }
          return n;
        });
        return next;
      });
    }, 1100);
    return () => clearInterval(timer);
  }, [paused, speed, addEvent, day, completed]);
  const observerLevel = 1 + Math.floor(observerXp / 100);
  const guideProject = () => {
    if (knowledge < 10 || wood < 10) return;
    setKnowledge((value) => value - 10);
    setWood((value) => value - 10);
    setProgress((value) => Math.min(99, value + 15));
    setObserverXp((value) => value + 12);
    addEvent(
      "You guided the active project with shared knowledge and compute",
      "work",
      minute,
    );
  };
  const evolveLatestProject = () => {
    if (completed < 1 || knowledge < 20 || wood < 15) return;
    const index = completed - 1;
    const level = projectLevels[index] || 1;
    if (level >= 4) return;
    setKnowledge((value) => value - 20);
    setWood((value) => value - 15);
    setProjectLevels((levels) => ({ ...levels, [index]: level + 1 }));
    setObserverXp((value) => value + 30);
    addEvent(
      `You evolved ${PROJECTS[index % PROJECTS.length].name} into a ${PROJECT_STAGES[level]}`,
      "world",
      minute,
    );
  };
  const save = () => {
    const snapshot: Snapshot = {
      agents,
      day,
      observerXp,
      projectLevels,
      minute,
      wood,
      knowledge,
      progress,
      completed,
      events,
    };
    localStorage.setItem("lumora-world-en-v1", JSON.stringify(snapshot));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const restore = () => {
    const raw = localStorage.getItem("lumora-world-en-v1");
    if (!raw) return;
    const s = JSON.parse(raw) as Snapshot;
    setAgents(s.agents);
    setMinute(s.minute);
    setDay(s.day || 12);
    setObserverXp(s.observerXp || 0);
    setProjectLevels(s.projectLevels || {});
    setWood(s.wood);
    setKnowledge(s.knowledge);
    setProgress(s.progress);
    setCompleted(s.completed || 0);
    setEvents(s.events);
  };
  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand">
          <span className="brand-mark">
            <Leaf size={17} />
          </span>
          <div>
            <b>LUMORA</b>
            <small>A poetic autonomous campus</small>
          </div>
        </div>
        <div className="world-status">
          <span className={paused ? "dot paused" : "dot"} />
          <b>{paused ? "World Paused" : "World Running"}</b>
          <span>
            Day {day} · {formatTime(minute)}
          </span>
          <span className="weather">
            {minute >= 420 && minute < 1080 ? "☀" : "☾"} {dayPhase} · 18°C
          </span>
          <span className="observer-level">Guide Lv.{observerLevel}</span>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={save} title="Save world">
            <Save size={17} />
          </button>
          <button
            className="icon-button"
            onClick={restore}
            title="Restore world"
          >
            <RotateCcw size={17} />
          </button>
          <button className="primary" onClick={() => setPaused((v) => !v)}>
            {paused ? <Play size={16} /> : <Pause size={16} />}{" "}
            {paused ? "Resume" : "Pause"}
          </button>
        </div>
      </header>
      <section className="metric-strip" aria-label="World metrics">
        {[
          [
            "Researchers",
            agents.length,
            `${agents.length} interdisciplinary agents`,
          ],
          ["Shared Compute", 82, "Training capacity recovering"],
          ["Knowledge", Math.round(knowledge), "Evidence is accumulating"],
          ["Reproducibility", 68, "Evidence and peer review"],
          ["Team Trust", 57, "Relationships evolve live"],
        ].map(([label, value, note], index) => (
          <article className="metric-card" key={String(label)}>
            <span>{label}</span>
            <div>
              <b>{value}</b>
              <small>{index === 0 ? " agents" : "/100"}</small>
            </div>
            <p>{note}</p>
            <i>
              <em
                style={{
                  width: `${Math.min(100, Number(value) * (index === 0 ? 12 : 1))}%`,
                }}
              />
            </i>
          </article>
        ))}
      </section>
      <section className="workspace">
        <aside
          className={`left-rail town-drawer roster-drawer ${showRoster ? "open" : ""}`}
        >
          <div className="rail-heading">
            <span>Shape the World</span>
            <small>ACTIONS</small>
          </div>
          <p className="rail-copy">
            Observe an AI × Web3 research community as experiments, debates, and
            collaborations unfold.
          </p>
          <div className="people-panel">
            <div className="dock-title">
              <span>
                <Users size={15} /> Agent Roster
              </span>
              <small>{agents.length} online</small>
            </div>
            <div className="people-list">
              {agents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => selectAgent(a.id)}
                  className={selected === a.id ? "selected" : ""}
                >
                  <span className="mini-avatar" style={{ background: a.color }}>
                    {a.name.slice(-1)}
                  </span>
                  <span>
                    <b>{a.name}</b>
                    <small>
                      {a.action} · Lv.{a.level || 1}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
          <div className="project-panel">
            <div className="dock-title">
              <span>
                <Bot size={15} /> Collaborative Build
              </span>
              <small>{completed} completed</small>
            </div>
            <div className="project-line">
              <div className="project-icon">⌂</div>
              <div>
                <b>{PROJECTS[completed % PROJECTS.length].name}</b>
                <small>Vincent · rc · B</small>
                <i>
                  <em style={{ width: `${progress}%` }} />
                </i>
              </div>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div className="resources">
              <span>
                Compute <b>{Math.round(wood)}</b>
              </span>
              <span>
                Knowledge <b>{Math.round(knowledge)}</b>
              </span>
              <span>
                Data <b>82</b>
              </span>
            </div>
            <div className="project-actions">
              <button
                onClick={guideProject}
                disabled={knowledge < 10 || wood < 10}
              >
                Guide +15%
              </button>
              <button
                onClick={evolveLatestProject}
                disabled={
                  completed < 1 ||
                  knowledge < 20 ||
                  wood < 15 ||
                  (projectLevels[completed - 1] || 1) >= 4
                }
              >
                Evolve latest
              </button>
            </div>
          </div>
        </aside>
        <div className="world-panel">
          <Canvas
            shadows
            camera={{ position: [16, 26, 20], fov: 38 }}
            dpr={[1, 1.6]}
          >
            <Scene
              agents={agents}
              selected={selected}
              onSelect={selectAgent}
              paused={paused}
              speed={speed}
              follow={follow}
              progress={progress}
              completed={completed}
              minute={minute}
              projectLevels={projectLevels}
            />
          </Canvas>
          <div className="town-ui-tools" aria-label="Town interface panels">
            <button
              className={showRoster ? "active" : ""}
              onClick={() => {
                setShowRoster((value) => !value);
                setShowInspector(false);
              }}
              aria-pressed={showRoster}
            >
              <Users size={15} /> Agents
            </button>
            <button
              className={showInspector ? "active" : ""}
              onClick={() => {
                setShowInspector((value) => !value);
                setShowRoster(false);
              }}
              aria-pressed={showInspector}
            >
              <BrainCircuit size={15} /> Profile
            </button>
            <button
              className={showEvents ? "active" : ""}
              onClick={() => setShowEvents((value) => !value)}
              aria-pressed={showEvents}
            >
              <MessageCircle size={15} /> Events
            </button>
          </div>
          <div className="scene-title">
            <span>University of Sydney · Camperdown</span>
            <small>
              <Eye size={13} /> Live AI Campus
            </small>
          </div>
          <div className="chapter-mark" aria-label="Current story chapter">
            <span>CHAPTER {String(day).padStart(2, "0")}</span>
            <b>{dayPhase} at Lumora</b>
            <small>{formatTime(minute)} · the world remembers</small>
          </div>
          <section className="guiding-quest" aria-label="Current shared quest">
            <div className="quest-kicker">
              <Sparkles size={13} /> SHARED QUEST
            </div>
            <strong>{PROJECTS[completed % PROJECTS.length].name}</strong>
            <p>
              The researchers are turning a shared question into a place the
              whole campus can use.
            </p>
            <div className="quest-progress">
              <i style={{ width: `${progress}%` }} />
            </div>
            <small>
              {Math.round(progress)}% · {Math.round(knowledge)} knowledge
            </small>
            <button
              className="quest-guide"
              onClick={guideProject}
              disabled={knowledge < 10 || wood < 10}
            >
              Guide project · +12 XP
            </button>
          </section>
          <button
            className="agent-whisper"
            onClick={() => {
              setShowInspector(true);
              setShowRoster(false);
            }}
          >
            <span
              className="whisper-portrait"
              style={{ background: agent.color }}
            >
              {agent.name.slice(-1)}
            </span>
            <span>
              <small>
                <BookOpen size={12} /> {evolutionStage(agent.level || 1)} · Lv.
                {agent.level || 1}
              </small>
              <b>{agent.name}</b>
              <em>“{agent.thought}”</em>
            </span>
          </button>
          <div className="constellation-lines" aria-hidden="true">
            <i /> <i /> <i /> <i />
          </div>
          <div className="camera-tools">
            <button
              className={!follow ? "active" : ""}
              onClick={() => setFollow(null)}
            >
              <Box size={15} /> Free Camera
            </button>
            <button
              className={follow ? "active" : ""}
              onClick={() => setFollow(selected)}
            >
              <Eye size={15} /> Follow {agent.name}
            </button>
          </div>
          <div className="speed-controls">
            <button onClick={() => setPaused((v) => !v)}>
              {paused ? <Play size={14} /> : <Pause size={14} />}
            </button>
            {[1, 2, 4].map((n) => (
              <button
                key={n}
                className={speed === n ? "active" : ""}
                onClick={() => setSpeed(n)}
              >
                {n}×
              </button>
            ))}
          </div>
          {saved && <div className="toast">World saved on this device</div>}
        </div>
        <aside
          className={`inspector town-drawer inspector-drawer ${showInspector ? "open" : ""}`}
        >
          <div className="section-heading">
            <div>
              <small>Selected Agent</small>
              <h1>{agent.name}</h1>
            </div>
            <span className="role-chip" style={{ background: agent.accent }}>
              {agent.role}
            </span>
          </div>
          <div className="identity">
            <div className="portrait" style={{ background: agent.color }}>
              {agent.name.slice(-1)}
            </div>
            <div>
              <p>{agent.personality}</p>
              <div className="skill-row">
                {agent.skills.map((s) => (
                  <span key={s}>{s}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="state-grid">
            <div>
              <span>Energy</span>
              <b>{agent.energy}%</b>
              <i>
                <em style={{ width: `${agent.energy}%` }} />
              </i>
            </div>
            <div>
              <span>Social</span>
              <b>{agent.social}%</b>
              <i>
                <em style={{ width: `${agent.social}%` }} />
              </i>
            </div>
            <div className="growth-stat">
              <span>Growth Level</span>
              <b>Lv.{agent.level || 1}</b>
              <i>
                <em style={{ width: `${agent.xp || 0}%` }} />
              </i>
            </div>
            <div>
              <span>Evolution Stage</span>
              <b>{evolutionStage(agent.level || 1)}</b>
            </div>
            <div>
              <span>Active / Breakthroughs</span>
              <b>
                {agent.daysActive || 0}d · {agent.breakthroughs || 0}
              </b>
            </div>
          </div>
          <section className="info-card thought">
            <div className="card-label">
              <BrainCircuit size={14} /> Current Thought
            </div>
            <p>“{agent.thought}”</p>
            <small>Decision basis · {agent.reason}</small>
          </section>
          <section className="detail-section">
            <h2>Current Goal</h2>
            <div className="goal-row">
              <span className="goal-icon">
                <ChevronRight size={16} />
              </span>
              <div>
                <b>{agent.goal}</b>
                <small>Current action · {agent.action}</small>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <h2>Memories</h2>
            {agent.memory.map((m, i) => (
              <div className="memory" key={m}>
                <Clock3 size={14} />
                <span>{m}</span>
                <small>{i + 2} hours ago</small>
              </div>
            ))}
          </section>
          <section className="detail-section">
            <h2>Relationships</h2>
            <div className="relations">
              {Object.entries(agent.relations).map(([id, val]) => {
                const p = agents.find((a) => a.id === id);
                return p ? (
                  <button key={id} onClick={() => setSelected(id)}>
                    <span
                      className="mini-avatar"
                      style={{ background: p.color }}
                    >
                      {p.name.slice(-1)}
                    </span>
                    <span>
                      {p.name}
                      <i>
                        <em style={{ width: `${val}%` }} />
                      </i>
                    </span>
                    <b>{val}</b>
                  </button>
                ) : null;
              })}
            </div>
          </section>
          <button className="follow-button" onClick={() => setFollow(agent.id)}>
            <Eye size={16} /> Third-person Follow
          </button>
        </aside>
      </section>
      <section
        className={`bottom-dock town-events ${showEvents ? "open" : ""}`}
      >
        <div className="event-panel">
          <div className="dock-title">
            <span>
              <MessageCircle size={15} /> Live Events
            </span>
            <small>Updating continuously</small>
          </div>
          <div className="event-list">
            {events.slice(0, 4).map((e) => (
              <div key={e.id}>
                <time>{e.time}</time>
                <span className={`event-dot ${e.kind}`} />
                <p>{e.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <footer>
        <span>
          <span className="dot" /> RULE ENGINE · LOCAL
        </span>
        <span>
          Research loop: Observe → Hypothesize → Discuss → Experiment → Remember
        </span>
        <span>
          <FastForward size={13} /> {speed}× simulation speed
        </span>
      </footer>
    </main>
  );
}

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
  minute: number;
  wood: number;
  knowledge: number;
  progress: number;
  completed?: number;
  events: EventItem[];
};

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
];
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
];

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
        <meshStandardMaterial color="#3e3022" roughness={1} />
      </mesh>
      <mesh position={[0, 2, 0]} castShadow>
        <coneGeometry args={[1.05, 2.4, 8]} />
        <meshStandardMaterial color="#173e29" roughness={0.95} />
      </mesh>
      <mesh position={[0.2, 2.7, 0.1]} castShadow>
        <coneGeometry args={[0.75, 1.6, 8]} />
        <meshStandardMaterial color="#28583a" roughness={0.95} />
      </mesh>
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
}: {
  project: (typeof PROJECTS)[number];
  index: number;
}) {
  return (
    <group position={expansionPosition(index)} scale={0.72}>
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
      <WorldLabel position={[0, 3.05, 0]} color="#f7d873">
        {project.name}
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
    rightLeg = useRef<THREE.Group>(null);
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
    >
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
          metalness={0.35}
          roughness={0.32}
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
          metalness={0.42}
          roughness={0.25}
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
      <mesh position={[0, 2.13, 0]}>
        <cylinderGeometry args={[0.018, 0.018, 0.22, 8]} />
        <meshStandardMaterial color="#84939a" metalness={0.8} />
      </mesh>
      <mesh position={[0, 2.27, 0]}>
        <sphereGeometry args={[0.055, 10, 10]} />
        <meshStandardMaterial
          color={agent.accent}
          emissive={agent.accent}
          emissiveIntensity={2.5}
        />
      </mesh>
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
      {(selected || agent.action === "Discuss") && (
        <Billboard position={[0, 2.5, 0]}>
          <Html center>
            <div className="agent-bubble">
              <strong>
                {agent.name} · Lv.{agent.level || 1}
              </strong>
              <span>{agent.speech || agent.thought}</span>
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
}) {
  const sunPhase = (minute / 1440) * Math.PI * 2 - Math.PI / 2;
  const daylight = THREE.MathUtils.clamp(Math.sin(sunPhase), 0, 1);
  const sky = new THREE.Color("#050914")
    .lerp(new THREE.Color("#8ab6c6"), daylight * 0.72)
    .getStyle();
  const fog = new THREE.Color("#07100f")
    .lerp(new THREE.Color("#9eb9ad"), daylight * 0.55)
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
      <fog attach="fog" args={[fog, 20, 48]} />
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
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[22, 64]} />
        <meshStandardMaterial
          color={daylight > 0.15 ? "#294b31" : "#142b20"}
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
        <mesh position={[0, 0.18, 0]}>
          <cylinderGeometry args={[1.1, 1.25, 0.28, 12]} />
          <meshStandardMaterial color="#73685b" />
        </mesh>
        <pointLight
          position={[0, 1, 0]}
          color="#ffad55"
          intensity={3}
          distance={8}
        />
        <mesh position={[0, 0.7, 0]}>
          <coneGeometry args={[0.45, 1.4, 7]} />
          <meshStandardMaterial
            color="#ff9b45"
            emissive="#ff652f"
            emissiveIntensity={1.8}
          />
        </mesh>
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
  const [wood, setWood] = useState(64);
  const [knowledge, setKnowledge] = useState(38);
  const [progress, setProgress] = useState(46);
  const [completed, setCompleted] = useState(0);
  const [events, setEvents] = useState(START_EVENTS);
  const [follow, setFollow] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [showRoster, setShowRoster] = useState(false);
  const [showInspector, setShowInspector] = useState(false);
  const [showEvents, setShowEvents] = useState(false);
  const agent = agents.find((a) => a.id === selected) || agents[0];
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
                memory: [memory, ...person.memory].slice(0, 4),
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
                ].slice(0, 3),
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
  }, [paused, speed, addEvent]);
  const save = () => {
    const snapshot: Snapshot = {
      agents,
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
            <small>University of Sydney AI Campus Lab</small>
          </div>
        </div>
        <div className="world-status">
          <span className={paused ? "dot paused" : "dot"} />
          <b>{paused ? "World Paused" : "World Running"}</b>
          <span>Day 12 · {formatTime(minute)}</span>
          <span className="weather">
            {minute >= 420 && minute < 1080 ? "☀" : "☾"} {dayPhase} · 18°C
          </span>
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
                  onClick={() => {
                    setSelected(a.id);
                    setShowInspector(true);
                  }}
                  className={selected === a.id ? "selected" : ""}
                >
                  <span className="mini-avatar" style={{ background: a.color }}>
                    {a.name.slice(-1)}
                  </span>
                  <span>
                    <b>{a.name}</b>
                    <small>{a.action}</small>
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
              onSelect={(id) => {
                setSelected(id);
                setShowInspector(true);
                setShowRoster(false);
              }}
              paused={paused}
              speed={speed}
              follow={follow}
              progress={progress}
              completed={completed}
              minute={minute}
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

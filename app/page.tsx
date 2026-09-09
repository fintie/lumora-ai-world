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

type Action = "探索" | "采集" | "研究" | "建造" | "休息" | "交流" | "工作";
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
    id: "lin",
    name: "林岚",
    role: "生态学家",
    color: "#ff8d5c",
    accent: "#ffd3bd",
    personality: "好奇、温和、重视证据",
    goal: "建立森林生态档案",
    skills: ["观察", "研究"],
    action: "探索",
    thought: "北侧林地的苔藓分布很反常。",
    reason: "知识储备不足，优先调查未知区域",
    memory: ["苏禾愿意共享土壤样本"],
    energy: 88,
    social: 72,
    pos: [-7, 0, -3],
    target: [-2, 0, -7],
    speech: "我去看看北坡。",
    relations: { su: 74, yan: 58, kai: 42 },
  },
  {
    id: "kai",
    name: "凯洛",
    role: "建造师",
    color: "#f8c44f",
    accent: "#fff0ae",
    personality: "务实、果断、有保护欲",
    goal: "完成公共观测站",
    skills: ["建造", "规划"],
    action: "采集",
    thought: "还差一些木材就能搭起主梁。",
    reason: "观测站项目当前缺少木材",
    memory: ["言川答应下午协助施工"],
    energy: 76,
    social: 61,
    pos: [5, 0, 5],
    target: [8, 0, 1],
    relations: { yan: 81, lin: 42, mio: 55 },
  },
  {
    id: "su",
    name: "苏禾",
    role: "农艺师",
    color: "#76d49b",
    accent: "#c9f5d7",
    personality: "耐心、乐于协作",
    goal: "让聚落实现食物自给",
    skills: ["种植", "照料"],
    action: "工作",
    thought: "温室幼苗需要在日落前浇水。",
    reason: "作物健康度下降，先处理高优先需求",
    memory: ["林岚发现了新的授粉路径"],
    energy: 68,
    social: 89,
    pos: [-4, 0, 5],
    target: [-7, 0, 5],
    relations: { lin: 74, nova: 66, mio: 70 },
  },
  {
    id: "yan",
    name: "言川",
    role: "工程师",
    color: "#6aa8ff",
    accent: "#c8ddff",
    personality: "理性、专注、略显固执",
    goal: "建成自循环能源网络",
    skills: ["工程", "维修"],
    action: "建造",
    thought: "支撑结构可以减少 12% 的用料。",
    reason: "拥有最高工程能力且与凯洛信任度高",
    memory: ["上次独自施工导致体力透支"],
    energy: 63,
    social: 48,
    pos: [3, 0, -5],
    target: [1, 0, -2],
    speech: "凯洛，结构图我改好了。",
    relations: { kai: 81, nova: 39, lin: 58 },
  },
  {
    id: "mio",
    name: "米欧",
    role: "信使",
    color: "#bf8cff",
    accent: "#e7d0ff",
    personality: "外向、机敏、爱讲故事",
    goal: "连接所有人的信息孤岛",
    skills: ["沟通", "探索"],
    action: "交流",
    thought: "诺瓦还不知道研究区的发现。",
    reason: "检测到团队之间的信息差",
    memory: ["凯洛喜欢直接、简短的汇报"],
    energy: 91,
    social: 95,
    pos: [0, 0, 6],
    target: [-1, 0, 1],
    speech: "大家，北坡有新发现！",
    relations: { kai: 55, su: 70, nova: 78 },
  },
  {
    id: "nova",
    name: "诺瓦",
    role: "系统研究员",
    color: "#ff6d91",
    accent: "#ffc6d3",
    personality: "大胆、独立、追求突破",
    goal: "解码遗迹中的信号",
    skills: ["分析", "实验"],
    action: "研究",
    thought: "样本序列里出现了重复脉冲。",
    reason: "新信息与长期目标高度相关",
    memory: ["苏禾的菌丝样本放大了信号"],
    energy: 57,
    social: 54,
    pos: [7, 0, -6],
    target: [6, 0, -4],
    relations: { mio: 78, su: 66, yan: 39 },
  },
];
const START_EVENTS: EventItem[] = [
  {
    id: 1,
    time: "08:14",
    kind: "talk",
    text: "米欧向团队分享了北坡的最新发现",
  },
  {
    id: 2,
    time: "08:09",
    kind: "work",
    text: "言川加入「森林观测站」建设项目",
  },
  {
    id: 3,
    time: "07:58",
    kind: "memory",
    text: "林岚记住了苏禾关于菌丝网络的观察",
  },
  { id: 4, time: "07:42", kind: "world", text: "晨光出现，太阳能产出开始回升" },
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
    name: "森林观测站",
    pos: [2.8, 0, -2] as [number, number, number],
    color: "#678c75",
  },
  {
    name: "溪谷工坊",
    pos: [-2.5, 0, -6] as [number, number, number],
    color: "#a66f4c",
  },
  {
    name: "社区温室",
    pos: [-8, 0, 0] as [number, number, number],
    color: "#72a88c",
  },
  {
    name: "太阳能塔",
    pos: [8, 0, 0] as [number, number, number],
    color: "#d1a34f",
  },
  {
    name: "记忆图书馆",
    pos: [2, 0, 7] as [number, number, number],
    color: "#7289a9",
  },
  {
    name: "河畔医务所",
    pos: [-5, 0, -5] as [number, number, number],
    color: "#c47c78",
  },
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
    ref.current.lookAt(target.x, 0.75, target.z);
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
}: {
  agents: Agent[];
  selected: string;
  onSelect: (id: string) => void;
  paused: boolean;
  speed: number;
  follow: string | null;
  progress: number;
  completed: number;
}) {
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
      <color attach="background" args={["#07130f"]} />
      <fog attach="fog" args={["#081710", 15, 38]} />
      <ambientLight intensity={0.3} color="#6f8c79" />
      <directionalLight
        position={[10, 14, 6]}
        intensity={1.15}
        color="#e5b76c"
        castShadow
        shadow-mapSize={[1024, 1024]}
      />
      <Stars radius={50} depth={20} count={500} factor={1.5} fade />
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[18, 64]} />
        <meshStandardMaterial color="#243e2a" roughness={1} />
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
      <House position={[-6, 0, 3]} color="#bd6f52" />
      <House position={[5, 0, 4]} color="#618898" />
      <House position={[6, 0, -5]} research color="#586f85" />
      {Array.from({ length: completed }, (_, index) => (
        <GrowthBuilding
          key={`growth-${index}`}
          project={PROJECTS[index % PROJECTS.length]}
          index={index}
        />
      ))}
      <WorldLabel position={[-6, 3.3, 3]}>生活区</WorldLabel>
      <WorldLabel position={[6, 3.3, -5]} color="#9fdced">
        林地研究站
      </WorldLabel>
      <WorldLabel position={[0, 2.1, 0]} color="#ffe0a3">
        篝火广场 · 公共区
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
          建造中：{PROJECTS[completed % PROJECTS.length].name} ·{" "}
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
        maxDistance={35}
        maxPolarAngle={Math.PI / 2.1}
        target={[0, 1, 0]}
      />
      <Environment preset="forest" environmentIntensity={0.12} />
    </>
  );
}

const formatTime = (m: number) =>
  `${String(Math.floor(m / 60) % 24).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
export default function Home() {
  const [agents, setAgents] = useState(PEOPLE);
  const [selected, setSelected] = useState("lin");
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
  const agent = agents.find((a) => a.id === selected) || agents[0];
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
                ? ["休息"]
                : cur.social < 42
                  ? ["交流"]
                  : ["探索", "采集", "研究", "建造", "交流"];
            const action = actions[Math.floor(Math.random() * actions.length)],
              t = TARGETS[Math.floor(Math.random() * TARGETS.length)];
            const thoughts: Record<Action, string> = {
              探索: "也许那条小路通向新的资源。",
              采集: "先补足团队最紧缺的材料。",
              研究: "这些数据之间一定有关联。",
              建造: "再完成一段结构就更接近目标。",
              休息: "保持精力才能作出好判断。",
              交流: "这条信息应该对伙伴有帮助。",
              工作: "这项日常工作需要完成。",
            };
            const copy = [...old];
            copy[idx] = {
              ...cur,
              action,
              thought: thoughts[action],
              reason: `环境变化与「${cur.goal}」产生关联`,
              target: t,
              energy: Math.max(
                18,
                Math.min(100, cur.energy + (action === "休息" ? 12 : -3)),
              ),
              speech:
                action === "交流" ? "我有个发现，谁想一起看看？" : undefined,
              xp: ((cur.xp || 0) + 4 * speed) % 100,
              level:
                (cur.level || 1) + ((cur.xp || 0) + 4 * speed >= 100 ? 1 : 0),
            };
            return copy;
          });
        }
        if (Math.random() < 0.18) {
          const texts = [
            "凯洛与言川协作完成了一段观测站结构",
            "米欧在广场同步了各组的资源信息",
            "林岚记录了一条新的动物迁徙路径",
            "苏禾把食物送给了体力较低的伙伴",
          ];
          addEvent(
            texts[Math.floor(Math.random() * texts.length)],
            Math.random() > 0.5 ? "work" : "talk",
            next,
          );
        }
        setWood((v) => Math.min(100, v + 0.22 * speed));
        setKnowledge((v) => Math.min(100, v + 0.18 * speed));
        setProgress((v) => {
          const n = v + 0.45 * speed;
          if (n >= 100) {
            setCompleted((count) => {
              const built = PROJECTS[count % PROJECTS.length];
              addEvent(
                `${built.name}完工，聚落规模与生产能力获得提升`,
                "world",
                next,
              );
              return count + 1;
            });
            setAgents((old) =>
              old.map((person) => ({
                ...person,
                xp: Math.min(99, (person.xp || 0) + 12),
                memory: ["团队完成了新的聚落建设", ...person.memory].slice(
                  0,
                  3,
                ),
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
    localStorage.setItem("lumora-world", JSON.stringify(snapshot));
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };
  const restore = () => {
    const raw = localStorage.getItem("lumora-world");
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
            <small>自主世界实验室</small>
          </div>
        </div>
        <div className="world-status">
          <span className={paused ? "dot paused" : "dot"} />
          <b>{paused ? "世界已暂停" : "世界运行中"}</b>
          <span>第 12 天 · {formatTime(minute)}</span>
          <span className="weather">☀ 18°C</span>
        </div>
        <div className="header-actions">
          <button className="icon-button" onClick={save} title="保存世界">
            <Save size={17} />
          </button>
          <button className="icon-button" onClick={restore} title="恢复存档">
            <RotateCcw size={17} />
          </button>
          <button className="primary" onClick={() => setPaused((v) => !v)}>
            {paused ? <Play size={16} /> : <Pause size={16} />}{" "}
            {paused ? "继续" : "暂停"}
          </button>
        </div>
      </header>
      <section className="metric-strip" aria-label="世界指标">
        {[
          ["居民人口", agents.length, "6 位活跃居民"],
          ["食物储备", 82, "今日净增 +4.5"],
          ["知识总量", Math.round(knowledge), "研究持续积累"],
          ["聚落幸福度", 68, "关系与需求综合"],
          ["社会凝聚力", 57, "信任网络稳定"],
        ].map(([label, value, note], index) => (
          <article className="metric-card" key={String(label)}>
            <span>{label}</span>
            <div>
              <b>{value}</b>
              <small>{index === 0 ? "人" : "/100"}</small>
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
        <aside className="left-rail">
          <div className="rail-heading">
            <span>改变世界</span>
            <small>ACTIONS</small>
          </div>
          <p className="rail-copy">
            观察社区、配置建设，并查看居民此刻的协作。
          </p>
          <div className="people-panel">
            <div className="dock-title">
              <span>
                <Users size={15} /> 居民名册
              </span>
              <small>{agents.length} 在线</small>
            </div>
            <div className="people-list">
              {agents.map((a) => (
                <button
                  key={a.id}
                  onClick={() => setSelected(a.id)}
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
                <Bot size={15} /> 共同建设
              </span>
              <small>{completed} 座完成</small>
            </div>
            <div className="project-line">
              <div className="project-icon">⌂</div>
              <div>
                <b>{PROJECTS[completed % PROJECTS.length].name}</b>
                <small>凯洛 · 言川</small>
                <i>
                  <em style={{ width: `${progress}%` }} />
                </i>
              </div>
              <strong>{Math.round(progress)}%</strong>
            </div>
            <div className="resources">
              <span>
                木材 <b>{Math.round(wood)}</b>
              </span>
              <span>
                知识 <b>{Math.round(knowledge)}</b>
              </span>
              <span>
                食物 <b>82</b>
              </span>
            </div>
          </div>
        </aside>
        <div className="world-panel">
          <Canvas
            shadows
            camera={{ position: [15, 14, 18], fov: 43 }}
            dpr={[1, 1.6]}
          >
            <Scene
              agents={agents}
              selected={selected}
              onSelect={setSelected}
              paused={paused}
              speed={speed}
              follow={follow}
              progress={progress}
              completed={completed}
            />
          </Canvas>
          <div className="scene-title">
            <span>晨溪聚落</span>
            <small>
              <Eye size={13} /> 全局生态视图
            </small>
          </div>
          <div className="camera-tools">
            <button
              className={!follow ? "active" : ""}
              onClick={() => setFollow(null)}
            >
              <Box size={15} /> 自由镜头
            </button>
            <button
              className={follow ? "active" : ""}
              onClick={() => setFollow(selected)}
            >
              <Eye size={15} /> 跟随 {agent.name}
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
          {saved && <div className="toast">世界状态已保存到此设备</div>}
        </div>
        <aside className="inspector">
          <div className="section-heading">
            <div>
              <small>已选择角色</small>
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
              <span>体力</span>
              <b>{agent.energy}%</b>
              <i>
                <em style={{ width: `${agent.energy}%` }} />
              </i>
            </div>
            <div>
              <span>社交</span>
              <b>{agent.social}%</b>
              <i>
                <em style={{ width: `${agent.social}%` }} />
              </i>
            </div>
            <div className="growth-stat">
              <span>成长等级</span>
              <b>Lv.{agent.level || 1}</b>
              <i>
                <em style={{ width: `${agent.xp || 0}%` }} />
              </i>
            </div>
          </div>
          <section className="info-card thought">
            <div className="card-label">
              <BrainCircuit size={14} /> 当前想法
            </div>
            <p>“{agent.thought}”</p>
            <small>决策依据 · {agent.reason}</small>
          </section>
          <section className="detail-section">
            <h2>当前目标</h2>
            <div className="goal-row">
              <span className="goal-icon">
                <ChevronRight size={16} />
              </span>
              <div>
                <b>{agent.goal}</b>
                <small>正在执行 · {agent.action}</small>
              </div>
            </div>
          </section>
          <section className="detail-section">
            <h2>记忆</h2>
            {agent.memory.map((m, i) => (
              <div className="memory" key={m}>
                <Clock3 size={14} />
                <span>{m}</span>
                <small>{i + 2} 小时前</small>
              </div>
            ))}
          </section>
          <section className="detail-section">
            <h2>社会关系</h2>
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
            <Eye size={16} /> 第三人称跟随
          </button>
        </aside>
      </section>
      <section className="bottom-dock">
        <div className="event-panel">
          <div className="dock-title">
            <span>
              <MessageCircle size={15} /> 实时事件
            </span>
            <small>持续更新</small>
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
        <span>决策循环：观察 → 思考 → 行动 → 记忆</span>
        <span>
          <FastForward size={13} /> {speed}× 模拟速度
        </span>
      </footer>
    </main>
  );
}

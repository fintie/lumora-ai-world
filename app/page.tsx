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
    role: "生成式 AI 研究员",
    color: "#ff8d5c",
    accent: "#ffd3bd",
    personality: "好奇、严谨、重视可复现性",
    goal: "训练可解释的校园多智能体模型",
    skills: ["模型训练", "评测"],
    action: "探索",
    thought: "代理的协作涌现需要一组消融实验。",
    reason: "当前评测证据不足，优先补齐对照组",
    memory: ["苏禾愿意共享隐私计算数据集"],
    energy: 88,
    social: 72,
    pos: [-7, 0, -3],
    target: [-2, 0, -7],
    speech: "谁来复核这组推理轨迹？",
    relations: { su: 74, yan: 58, kai: 42 },
  },
  {
    id: "kai",
    name: "凯洛",
    role: "智能合约工程师",
    color: "#f8c44f",
    accent: "#fff0ae",
    personality: "务实、果断、有保护欲",
    goal: "完成可信科研协作协议",
    skills: ["Solidity", "协议设计"],
    action: "采集",
    thought: "激励函数还需要处理女巫攻击。",
    reason: "协议审计发现边界条件，优先修复",
    memory: ["言川答应协助进行形式化验证"],
    energy: 76,
    social: 61,
    pos: [5, 0, 5],
    target: [8, 0, 1],
    relations: { yan: 81, lin: 42, mio: 55 },
  },
  {
    id: "su",
    name: "苏禾",
    role: "隐私计算学者",
    color: "#76d49b",
    accent: "#c9f5d7",
    personality: "耐心、乐于协作",
    goal: "实现保护隐私的科研数据共享",
    skills: ["零知识证明", "联邦学习"],
    action: "工作",
    thought: "这份医学数据可以用联邦学习联合建模。",
    reason: "数据不可出域，选择隐私保护实验",
    memory: ["林岚的基线模型通过了隐私预算测试"],
    energy: 68,
    social: 89,
    pos: [-4, 0, 5],
    target: [-7, 0, 5],
    relations: { lin: 74, nova: 66, mio: 70 },
  },
  {
    id: "yan",
    name: "言川",
    role: "机器人系统工程师",
    color: "#6aa8ff",
    accent: "#c8ddff",
    personality: "理性、专注、略显固执",
    goal: "让具身智能安全参与实验室协作",
    skills: ["机器人", "强化学习"],
    action: "建造",
    thought: "策略网络在真实机械臂上仍有 sim-to-real 偏差。",
    reason: "拥有最高机器人能力且与凯洛信任度高",
    memory: ["上次并行实验因算力不足而中断"],
    energy: 63,
    social: 48,
    pos: [3, 0, -5],
    target: [1, 0, -2],
    speech: "凯洛，合约验证结果出来了。",
    relations: { kai: 81, nova: 39, lin: 58 },
  },
  {
    id: "mio",
    name: "米欧",
    role: "去中心化治理研究员",
    color: "#bf8cff",
    accent: "#e7d0ff",
    personality: "外向、机敏、爱讲故事",
    goal: "设计开放且抗操纵的科研 DAO",
    skills: ["治理", "机制设计"],
    action: "交流",
    thought: "诺瓦还没看到治理实验的投票偏差。",
    reason: "检测到研究小组之间的信息差",
    memory: ["凯洛偏好可验证、简短的提案"],
    energy: 91,
    social: 95,
    pos: [0, 0, 6],
    target: [-1, 0, 1],
    speech: "新的 DAO 提案已进入同行评审！",
    relations: { kai: 55, su: 70, nova: 78 },
  },
  {
    id: "nova",
    name: "诺瓦",
    role: "分布式系统研究员",
    color: "#ff6d91",
    accent: "#ffc6d3",
    personality: "大胆、独立、追求突破",
    goal: "构建可扩展的去中心化 AI 网络",
    skills: ["共识协议", "分布式训练"],
    action: "研究",
    thought: "异步节点间出现了可复现的共识分叉。",
    reason: "新信息与长期目标高度相关",
    memory: ["苏禾的零知识电路降低了验证成本"],
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
    text: "米欧发起「AI 科研 DAO」治理机制研讨",
  },
  {
    id: 2,
    time: "08:09",
    kind: "work",
    text: "言川加入「具身智能实验室」联合实验",
  },
  {
    id: 3,
    time: "07:58",
    kind: "memory",
    text: "林岚记录了苏禾关于零知识数据证明的建议",
  },
  {
    id: 4,
    time: "07:42",
    kind: "world",
    text: "晨间算力窗口开启，训练资源开始回升",
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
    name: "多智能体研究中心",
    pos: [2.8, 0, -2] as [number, number, number],
    color: "#678c75",
  },
  {
    name: "具身智能实验室",
    pos: [-2.5, 0, -6] as [number, number, number],
    color: "#a66f4c",
  },
  {
    name: "隐私计算实验室",
    pos: [-8, 0, 0] as [number, number, number],
    color: "#72a88c",
  },
  {
    name: "去中心化算力塔",
    pos: [8, 0, 0] as [number, number, number],
    color: "#d1a34f",
  },
  {
    name: "链上知识图谱馆",
    pos: [2, 0, 7] as [number, number, number],
    color: "#7289a9",
  },
  {
    name: "AI 安全评测中心",
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
        <meshStandardMaterial color="#1d3524" roughness={1} />
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
      <Classroom
        position={[-7.4, 0, 4.2]}
        label="AI 安全与对齐教室"
        color="#f1c875"
      />
      <Classroom
        position={[7.2, 0, 4.5]}
        label="智能合约研讨教室"
        color="#8fd7ff"
      />
      <House position={[0, 0, 7.8]} color="#49675c" research />
      <ModernLab position={[7.4, 0, -4.5]} glow="#8de7df" />
      <ResearchDome
        position={[-7.6, 0, -4.5]}
        label="Web3 协议实验室"
        color="#b59aff"
      />
      <ResearchDome
        position={[-9.5, 0, 1]}
        label="隐私计算实验室"
        color="#7ee0ad"
      />
      <ResearchDome
        position={[9.5, 0, 0.8]}
        label="具身智能实验室"
        color="#ff9b71"
      />
      {Array.from({ length: completed }, (_, index) => (
        <GrowthBuilding
          key={`growth-${index}`}
          project={PROJECTS[index % PROJECTS.length]}
          index={index}
        />
      ))}
      <WorldLabel position={[0, 7.2, -7]}>悉尼大学主楼 · Quadrangle</WorldLabel>
      <WorldLabel position={[7.4, 3.8, -4.5]} color="#9fdced">
        生成式 AI 实验室
      </WorldLabel>
      <WorldLabel position={[0, 2.1, 0]} color="#ffe0a3">
        校园草坪 · 公共交流区
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
              探索: "去另一间实验室看看是否有可复用的数据集。",
              采集: "先申请团队最紧缺的算力与实验样本。",
              研究: "模型行为与链上激励之间可能存在因果关系。",
              建造: "再完成一组设施就能启动跨学科实验。",
              休息: "暂停训练，整理实验假设与失败记录。",
              交流: "这组结果应该交给伙伴做交叉验证。",
              工作: "今天的基准评测与复现实验需要完成。",
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
                action === "交流"
                  ? "我有一组 AI × Web3 结果，谁来做同行评审？"
                  : undefined,
              xp: ((cur.xp || 0) + 4 * speed) % 100,
              level:
                (cur.level || 1) + ((cur.xp || 0) + 4 * speed >= 100 ? 1 : 0),
            };
            return copy;
          });
        }
        if (Math.random() < 0.18) {
          const texts = [
            "凯洛与言川完成智能合约安全性与机器人权限的联合测试",
            "米欧在草坪研讨会同步了科研 DAO 的投票实验",
            "林岚提出用可解释性方法分析多智能体协作涌现",
            "苏禾演示了零知识证明如何验证私有训练数据",
            "诺瓦发现去中心化训练节点出现共识分叉，正在组织复现实验",
            "团队就 AI 模型署名与链上知识产权产生分歧，信任关系正在调整",
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
                `${built.name}完工，新课程与跨实验室科研项目现已开放`,
                "world",
                next,
              );
              return count + 1;
            });
            setAgents((old) =>
              old.map((person) => ({
                ...person,
                xp: Math.min(99, (person.xp || 0) + 12),
                memory: ["团队共同完成了新的科研设施", ...person.memory].slice(
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
            <small>悉尼大学 AI 校园实验室</small>
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
          ["研究成员", agents.length, "6 位 AI × Web3 学者"],
          ["共享算力", 82, "训练额度持续恢复"],
          ["科研知识", Math.round(knowledge), "实验结论持续积累"],
          ["复现可信度", 68, "证据与同行评审综合"],
          ["团队信任度", 57, "合作关系动态演化"],
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
            观察 AI × Web3 学术社区，跟踪实验、课程、争论与跨学科协作。
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
                算力 <b>{Math.round(wood)}</b>
              </span>
              <span>
                知识 <b>{Math.round(knowledge)}</b>
              </span>
              <span>
                数据 <b>82</b>
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
            <span>悉尼大学 · Camperdown</span>
            <small>
              <Eye size={13} /> AI 校园实时视图
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

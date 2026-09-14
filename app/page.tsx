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
    id: "karina",
    name: "Karina",
    role: "系统化交易研究员",
    color: "#ff8d5c",
    accent: "#ffd3bd",
    personality: "直接、技术导向、重视高质量数据与执行效率",
    goal: "建立由优质数据驱动的 AI 研究与交易系统",
    skills: ["量化研究", "数据策略"],
    action: "研究",
    thought: "模型优势必须来自数据、执行与真实市场约束。",
    reason: "发现研究假设缺乏高质量数据支持",
    memory: ["B 建议用完整节点验证链上价量数据"],
    energy: 88,
    social: 78,
    pos: [-7, 0, -3],
    target: [7, 0, -5],
    speech: "先把数据质量和交易成本算清楚。",
    relations: { b: 82, lecky: 72, fan: 64, alu: 48 },
  },
  {
    id: "b",
    name: "B",
    role: "Web3 基础设施工程师",
    color: "#f8c44f",
    accent: "#fff0ae",
    personality: "务实、工程化、愿意为完整数据投入基础设施",
    goal: "运行可信全节点并建设可验证的数据管线",
    skills: ["全节点", "链上数据"],
    action: "建造",
    thought: "没有完整价量数据，任何策略结论都不够扎实。",
    reason: "研究团队需要可验证的一手链上数据",
    memory: ["Karina 强调优质数据是系统优势的起点"],
    energy: 76,
    social: 68,
    pos: [5, 0, 5],
    target: [8, 0, 1],
    speech: "我先把节点和数据索引跑起来。",
    relations: { karina: 82, lecky: 66, rc: 71, vincent: 63 },
  },
  {
    id: "fan",
    name: "饭叔 Fan",
    role: "AI Agency 与社会研究者",
    color: "#76d49b",
    accent: "#c9f5d7",
    personality: "思辨、重视真实关系、关注技术的社会后果",
    goal: "研究 AI 代理如何建立长期信任与公共价值",
    skills: ["AI Agency", "社会分析"],
    action: "交流",
    thought: "数字关系可以模拟情绪，但物理互动仍提供独特价值。",
    reason: "团队争论正在从技术问题延伸到社会影响",
    memory: ["Nick 提出让 AI 判断成员何时需要帮助"],
    energy: 73,
    social: 91,
    pos: [-4, 0, 5],
    target: [0, 0, 0],
    speech: "技术之外，我们还要讨论信任如何形成。",
    relations: { nick: 84, meisha: 76, karina: 64, tianbao: 62 },
  },
  {
    id: "lecky",
    name: "Lecky · FluxLayer",
    role: "市场信号研究员",
    color: "#6aa8ff",
    accent: "#c8ddff",
    personality: "敏锐、实验派、同时警惕把相关性误认为因果",
    goal: "融合市场、社区和影响力数据寻找稳健信号",
    skills: ["数据分析", "市场情绪"],
    action: "研究",
    thought: "数据只能辅助判断，策略不能完全依赖单一信号。",
    reason: "不同市场状态下同一因子的表现出现分化",
    memory: ["阿鲁提醒反身性会快速改变加密市场结构"],
    energy: 79,
    social: 74,
    pos: [3, 0, -5],
    target: [-1, 0, 7],
    speech: "先分辨信号、市场状态和运气。",
    relations: { karina: 72, alu: 79, b: 66, tianbao: 58 },
  },
  {
    id: "alu",
    name: "阿鲁",
    role: "加密市场实验员",
    color: "#bf8cff",
    accent: "#e7d0ff",
    personality: "幽默、反应快、善于捕捉反身性和社区热点",
    goal: "理解 Meme、流动性与群体行为之间的反馈循环",
    skills: ["加密市场", "反身性"],
    action: "探索",
    thought: "市场叙事正在反过来塑造参与者的行为。",
    reason: "社区情绪出现异常聚集，需要快速观察",
    memory: ["Lecky 建议同时观察长期数据和当前市场状态"],
    energy: 91,
    social: 88,
    pos: [0, 0, 6],
    target: [-1, 0, 1],
    speech: "叙事起来了，但先别把运气当能力。",
    relations: { lecky: 79, karina: 48, tianbao: 75, b: 57 },
  },
  {
    id: "tianbao",
    name: "天宝",
    role: "行为与风险研究员",
    color: "#ff6d91",
    accent: "#ffc6d3",
    personality: "坦率、善于观察群体心理、对投机风险高度敏感",
    goal: "建立识别群体狂热与风险扩散的行为模型",
    skills: ["行为金融", "风险识别"],
    action: "研究",
    thought: "快速致富预期正在压缩人们的风险判断时间。",
    reason: "群体行为指标偏离长期均值",
    memory: ["阿鲁观察到 Meme 市场情绪再次快速升温"],
    energy: 67,
    social: 70,
    pos: [7, 0, -6],
    target: [6, 0, -4],
    speech: "先检查这是机会，还是群体冲动。",
    relations: { alu: 75, lecky: 58, fan: 62, karina: 52 },
  },
  {
    id: "rc",
    name: "rc",
    role: "LLM 全栈工程师",
    color: "#e36a5d",
    accent: "#ffc1b8",
    personality: "冷静、实用、关注技术路线与职业持续性",
    goal: "构建 AI 原生的全栈科研工具链",
    skills: ["LLM 开发", "FDE"],
    action: "工作",
    thought: "最有价值的工程师会把模型能力连接到真实业务。",
    reason: "团队需要把研究原型转化为可靠系统",
    memory: ["B 建议强化数学基础与端到端交付能力"],
    energy: 82,
    social: 60,
    pos: [10, 0, 4],
    target: [8, 0, 3],
    speech: "我来把论文原型变成能用的系统。",
    relations: { b: 71, vincent: 86, nick: 68, meisha: 55 },
  },
  {
    id: "vincent",
    name: "Vincent Lin",
    role: "AI 原生研发架构师",
    color: "#49b9a4",
    accent: "#baf4e8",
    personality: "前瞻、系统化、相信超级个体与流程重构",
    goal: "建立由 AI 代理协同驱动的软件研发流程",
    skills: ["AI SDLC", "智能代理"],
    action: "建造",
    thought: "AI 原生研发不是旧流程提速，而是重新设计协作方式。",
    reason: "现有研发环节仍存在重复交接和信息损耗",
    memory: ["rc 可以负责把多代理流程接入完整产品栈"],
    energy: 85,
    social: 73,
    pos: [-10, 0, 4],
    target: [-8, 0, 3],
    speech: "让代理负责流程，让人专注判断。",
    relations: { rc: 86, b: 63, nick: 77, karina: 59 },
  },
  {
    id: "meisha",
    name: "梅莎 M",
    role: "教育与公共系统设计者",
    color: "#d49a58",
    accent: "#ffe1ad",
    personality: "独立、批判性强、关注制度激励与真实体验",
    goal: "探索 AI 时代更公平有效的教育与学徒制度",
    skills: ["教育设计", "公共政策"],
    action: "交流",
    thought: "教育制度必须让导师和学习者共享长期成果。",
    reason: "当前培养机制的激励与学生未来并不一致",
    memory: ["Fan 认为长期物理互动仍有不可替代的价值"],
    energy: 74,
    social: 83,
    pos: [-9, 0, 7],
    target: [-4, 0, 5],
    speech: "先重新设计导师与学生的激励关系。",
    relations: { fan: 76, nick: 73, rc: 55, vincent: 65 },
  },
  {
    id: "nick",
    name: "Nick Qi",
    role: "AI 社区与产品设计者",
    color: "#718de8",
    accent: "#cad5ff",
    personality: "连接型、产品导向、关注技术如何帮助真实的人",
    goal: "建设能主动识别需求并组织互助的 AI 社区",
    skills: ["产品设计", "社区协作"],
    action: "探索",
    thought: "AI 不只回答问题，也应该帮助人们发现彼此能提供的价值。",
    reason: "成员能力丰富，但协作机会尚未被充分连接",
    memory: ["Fan 提醒数字互动最终要回到真实信任"],
    energy: 86,
    social: 94,
    pos: [9, 0, 8],
    target: [0, 0, 0],
    speech: "我来连接最适合一起解决问题的人。",
    relations: { fan: 84, vincent: 77, meisha: 73, rc: 68 },
  },
];
const START_EVENTS: EventItem[] = [
  {
    id: 1,
    time: "08:14",
    kind: "talk",
    text: "Karina 与 B 开始验证高质量链上数据的可用性",
  },
  {
    id: 2,
    time: "08:09",
    kind: "work",
    text: "Vincent Lin 邀请 rc 搭建 AI 原生研发代理流程",
  },
  {
    id: 3,
    time: "07:58",
    kind: "memory",
    text: "饭叔 Fan 与 Nick Qi 讨论 AI 社区中的长期信任",
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

const RESEARCH_TOPICS = [
  "多智能体协作是否能用链上信誉降低幻觉传播",
  "零知识证明如何验证模型训练过程而不泄露数据",
  "科研 DAO 的二次方投票能否避免少数节点垄断",
  "具身智能实验数据应该如何确权与开放复现",
  "去中心化推理网络怎样权衡延迟、成本与可信度",
  "智能合约代理在自主执行前需要哪些安全边界",
  "链上知识图谱能否追踪论文结论的证据来源",
  "联邦学习与可验证计算如何组合成可信实验管线",
  "高质量链上价量数据能否提高系统化策略的稳健性",
  "市场情绪、KOL 传播与流动性之间是否存在反馈回路",
  "AI 原生研发流程如何让超级个体完成端到端交付",
  "AI 社区怎样识别成员需求并组织可信互助",
  "学徒制和长期收益共享能否改善教育激励",
  "数字代理的情绪模拟如何转化为真实世界信任",
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
      {(selected || agent.action === "交流") && (
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
      ? "深夜"
      : minute < 420
        ? "日出"
        : minute < 1020
          ? "白昼"
          : minute < 1140
            ? "黄昏"
            : "夜晚";
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
              ? `${a.name}质疑${b.name}的实验假设，双方决定增加对照组`
              : `${a.name}与${b.name}形成新共识，并约定共享复现实验结果`;
            const memory = `${formatTime(next)} 与${b.name}讨论：${topic}`;
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
                action: "交流",
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
                    ? `从${person.skills[0]}出发，我想验证：${topic}`
                    : conflict
                      ? `从${person.skills[0]}角度我不同意，先补一组可复现实验。`
                      : `同意，我用${person.skills[0]}来设计验证指标。`,
                thought: `${partner.role}的视角正在改变我的研究判断。`,
                reason: `近期记忆、共同目标与对${partner.name}的信任共同触发了讨论`,
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
          <span className="weather">
            {minute >= 420 && minute < 1080 ? "☀" : "☾"} {dayPhase} · 18°C
          </span>
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
          ["研究成员", agents.length, `${agents.length} 位跨学科成员`],
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
        <aside
          className={`left-rail town-drawer roster-drawer ${showRoster ? "open" : ""}`}
        >
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
                <Bot size={15} /> 共同建设
              </span>
              <small>{completed} 座完成</small>
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
          <div className="town-ui-tools" aria-label="小镇界面面板">
            <button
              className={showRoster ? "active" : ""}
              onClick={() => {
                setShowRoster((value) => !value);
                setShowInspector(false);
              }}
              aria-pressed={showRoster}
            >
              <Users size={15} /> 人物
            </button>
            <button
              className={showInspector ? "active" : ""}
              onClick={() => {
                setShowInspector((value) => !value);
                setShowRoster(false);
              }}
              aria-pressed={showInspector}
            >
              <BrainCircuit size={15} /> 详情
            </button>
            <button
              className={showEvents ? "active" : ""}
              onClick={() => setShowEvents((value) => !value)}
              aria-pressed={showEvents}
            >
              <MessageCircle size={15} /> 事件
            </button>
          </div>
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
        <aside
          className={`inspector town-drawer inspector-drawer ${showInspector ? "open" : ""}`}
        >
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
      <section
        className={`bottom-dock town-events ${showEvents ? "open" : ""}`}
      >
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
        <span>科研循环：观察 → 假设 → 讨论 → 实验 → 记忆迭代</span>
        <span>
          <FastForward size={13} /> {speed}× 模拟速度
        </span>
      </footer>
    </main>
  );
}

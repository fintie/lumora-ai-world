/**
 * LLM integration boundary.
 * The UI currently uses the deterministic rule loop in app/page.tsx. A server
 * route can implement this interface with OpenAI Responses API or a local
 * OpenAI-compatible endpoint without changing the world renderer.
 */
export type AgentObservation = {
  agentId: string;
  needs: { energy: number; social: number };
  goal: string;
  nearbyAgents: string[];
  availableResources: Record<string, number>;
  shortTermMemory: string[];
  relationships: Record<string, number>;
};

export type AgentDecision = {
  action: '探索' | '采集' | '研究' | '建造' | '休息' | '交流' | '工作';
  target?: [number, number, number];
  thought: string;
  reason: string;
  message?: string;
};

export interface DecisionProvider {
  decide(observation: AgentObservation): Promise<AgentDecision>;
}

export class OpenAICompatibleProvider implements DecisionProvider {
  constructor(
    private endpoint: string,
    private apiKey?: string,
  ) {}

  async decide(observation: AgentObservation): Promise<AgentDecision> {
    const response = await fetch(this.endpoint, {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        ...(this.apiKey ? { authorization: `Bearer ${this.apiKey}` } : {}),
      },
      body: JSON.stringify({ observation }),
    });
    if (!response.ok) throw new Error(`Decision provider failed: ${response.status}`);
    return response.json() as Promise<AgentDecision>;
  }
}

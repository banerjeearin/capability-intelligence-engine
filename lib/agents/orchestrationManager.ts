import { Agent, AgentInput, AgentOutput, SharedMemory } from '@/lib/agents/types';

export class OrchestrationManager {
  private agents: Agent[];

  constructor(agents: Agent[]) {
    this.agents = agents;
  }

  async execute(input: AgentInput): Promise<{ outputs: AgentOutput[]; memory: SharedMemory }> {
    const memory: SharedMemory = { context: {}, messages: [] };
    const outputs: AgentOutput[] = [];

    for (const agent of this.agents) {
      const output = await agent.run(input, memory);
      outputs.push(output);
      memory.context[agent.name] = output.data;
      memory.messages.push({
        from: agent.name,
        to: 'orchestrator',
        type: 'agent_output',
        payload: output.data,
        timestamp: new Date().toISOString()
      });
    }

    return { outputs, memory };
  }
}

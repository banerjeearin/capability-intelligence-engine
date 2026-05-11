export interface AgentMessage {
  from: string;
  to: string;
  type: string;
  payload: Record<string, unknown>;
  timestamp: string;
}

export interface SharedMemory {
  context: Record<string, unknown>;
  messages: AgentMessage[];
}

export interface AgentInput {
  userId: string;
  assessmentId?: string;
  answers: Array<{ questionId: string; answer: string; dimension: string; prompt: string }>;
}

export interface AgentOutput {
  name: string;
  data: Record<string, unknown>;
}

export interface Agent {
  name: string;
  run: (input: AgentInput, memory: SharedMemory) => Promise<AgentOutput>;
}

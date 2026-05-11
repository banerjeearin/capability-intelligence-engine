export type AssessmentDimension =
  | 'strategic_thinking'
  | 'enterprise_architecture'
  | 'ai_capability'
  | 'execution_maturity'
  | 'leadership'
  | 'systems_thinking';

export interface AssessmentQuestion {
  id: string;
  dimension: AssessmentDimension;
  prompt: string;
}

export const assessmentQuestions: AssessmentQuestion[] = [
  {
    id: 'q1',
    dimension: 'strategic_thinking',
    prompt: 'Describe a time you aligned AI initiatives to measurable business outcomes.'
  },
  {
    id: 'q2',
    dimension: 'enterprise_architecture',
    prompt: 'How would you modernize an ERP-centered landscape while minimizing integration risk?'
  },
  {
    id: 'q3',
    dimension: 'ai_capability',
    prompt: 'What is your approach to designing trustworthy AI/agent systems in production?'
  },
  {
    id: 'q4',
    dimension: 'execution_maturity',
    prompt: 'How do you plan and govern multi-quarter transformation delivery across teams?'
  },
  {
    id: 'q5',
    dimension: 'leadership',
    prompt: 'Give an example of influencing executives and delivery teams through transformation change.'
  },
  {
    id: 'q6',
    dimension: 'systems_thinking',
    prompt: 'How do you evaluate second-order effects when implementing enterprise AI capabilities?'
  }
];

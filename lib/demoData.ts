import { DocumentRecord } from '@/types/document';

export const demoUserId = '11111111-1111-4111-8111-111111111111';
export const demoOrgId = '22222222-2222-4222-8222-222222222222';
export const demoAssessmentId = '33333333-3333-4333-8333-333333333333';

export const demoDocuments: DocumentRecord[] = [
  {
    id: 'doc-001',
    file_name: 'AI Transformation Strategy Brief.pdf',
    file_path: 'demo/ai-transformation-strategy.pdf',
    mime_type: 'application/pdf',
    file_size_bytes: 2845120,
    status: 'processed',
    created_at: '2026-05-08T09:30:00.000Z'
  },
  {
    id: 'doc-002',
    file_name: 'Enterprise Architecture Capability Map.docx',
    file_path: 'demo/enterprise-architecture-map.docx',
    mime_type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    file_size_bytes: 1198420,
    status: 'processed',
    created_at: '2026-05-08T10:15:00.000Z'
  },
  {
    id: 'doc-003',
    file_name: 'Procurement Modernization Case Study.md',
    file_path: 'demo/procurement-modernization.md',
    mime_type: 'text/markdown',
    file_size_bytes: 64280,
    status: 'uploaded',
    created_at: '2026-05-09T13:45:00.000Z'
  },
  {
    id: 'doc-004',
    file_name: 'ERP Delivery Risk Register.xlsx.txt',
    file_path: 'demo/erp-risk-register.txt',
    mime_type: 'text/plain',
    file_size_bytes: 185300,
    status: 'processing',
    created_at: '2026-05-10T16:05:00.000Z'
  }
];

export const demoReports = [
  {
    id: 'report-001',
    title: 'Executive Transformation Fit Report',
    assessment_id: demoAssessmentId,
    created_at: '2026-05-10T18:20:00.000Z',
    report_json: {
      executive_summary:
        'The candidate demonstrates strong strategic transformation judgment, mature enterprise architecture instincts, and credible AI adoption leadership. Execution risk is moderate and should be managed with explicit operating governance.',
      capability_scores: [
        { dimension: 'strategic_thinking', score: 9.1, rationale: 'Connects market context, operating model, and sequencing decisions.' },
        { dimension: 'enterprise_architecture', score: 8.6, rationale: 'Shows depth across platform modernization and integration tradeoffs.' },
        { dimension: 'ai_capability', score: 8.2, rationale: 'Understands AI value cases, governance, and adoption constraints.' },
        { dimension: 'execution_maturity', score: 7.4, rationale: 'Strong delivery framing with some dependency on PMO rigor.' }
      ],
      strengths: [
        'Frames transformation as business capability change, not only technology delivery.',
        'Uses evidence and architecture patterns to evaluate strategic fit.',
        'Understands executive communication and board-level risk framing.'
      ],
      risk_areas: [
        'Needs clear ownership model for cross-functional delivery.',
        'AI governance approach should be tested under regulated-data scenarios.',
        'Benefits realization cadence should be made more explicit.'
      ],
      recommended_role_fit: 'Enterprise AI Transformation Lead',
      final_recommendation: 'Proceed to executive interview with focus on operating governance and measurable value realization.'
    }
  },
  {
    id: 'report-002',
    title: 'Board Readiness Snapshot',
    assessment_id: '44444444-4444-4444-8444-444444444444',
    created_at: '2026-05-09T11:10:00.000Z',
    report_json: {
      executive_summary:
        'The leadership profile is credible for advisory or transformation design roles. Direct accountability for scaled execution should be validated before appointment.',
      capability_scores: [
        { dimension: 'leadership', score: 8.0, rationale: 'Strong communication and stakeholder alignment.' },
        { dimension: 'systems_thinking', score: 8.4, rationale: 'Good cross-domain reasoning across process, data, and platforms.' }
      ],
      strengths: ['Strong executive narrative', 'Clear systems thinking', 'Practical transformation pattern recognition'],
      risk_areas: ['Limited direct evidence of global rollout ownership', 'Commercial value tracking needs stronger proof'],
      recommended_role_fit: 'Strategic Transformation Advisor',
      final_recommendation: 'Advance with evidence request for prior implementation outcomes.'
    }
  }
];

export function buildDemoAnswers(questionIds: string[]): Record<string, string> {
  return Object.fromEntries(
    questionIds.map((id, index) => [
      id,
      [
        'I would begin by clarifying enterprise outcomes, executive sponsorship, measurable value pools, and constraints before selecting technology interventions.',
        'I use capability maps, domain boundaries, integration risk, data ownership, and operating model dependencies to sequence architecture decisions.',
        'I prioritize AI use cases where workflow redesign, data readiness, governance, and adoption capacity are strong enough to produce measurable value.',
        'I manage transformation through clear decision rights, value milestones, risk registers, release governance, and benefit tracking.',
        'I align senior stakeholders through transparent tradeoffs, concise escalation paths, and a shared definition of success.',
        'I evaluate second-order effects across process, people, platforms, data, controls, and incentives before recommending change.'
      ][index] ?? 'Synthetic executive assessment answer for testing the scoring workflow.'
    ])
  );
}

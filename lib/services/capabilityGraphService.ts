interface GraphNode {
  id: string;
  node_type: string;
  name: string;
}

interface GraphEdge {
  from_node_id: string;
  to_node_id: string;
  relation_type: string;
  weight: number;
}

function getConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY.');
  return { url, key };
}

export async function loadCapabilityGraph(userId: string): Promise<{ nodes: GraphNode[]; edges: GraphEdge[] }> {
  const { url, key } = getConfig();
  const nodeQ = new URLSearchParams({ user_id: `eq.${userId}`, select: 'id,node_type,name' });
  const edgeQ = new URLSearchParams({ user_id: `eq.${userId}`, select: 'from_node_id,to_node_id,relation_type,weight' });

  const [nodesRes, edgesRes] = await Promise.all([
    fetch(`${url}/rest/v1/capability_nodes?${nodeQ.toString()}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } }),
    fetch(`${url}/rest/v1/capability_edges?${edgeQ.toString()}`, { headers: { apikey: key, Authorization: `Bearer ${key}` } })
  ]);

  if (!nodesRes.ok || !edgesRes.ok) {
    throw new Error(`Graph load failed: ${!nodesRes.ok ? await nodesRes.text() : await edgesRes.text()}`);
  }

  return { nodes: await nodesRes.json(), edges: await edgesRes.json() };
}

export function traverseCapabilities(startNodeIds: string[], edges: GraphEdge[], maxDepth = 2): Set<string> {
  const visited = new Set<string>(startNodeIds);
  let frontier = new Set<string>(startNodeIds);

  for (let depth = 0; depth < maxDepth; depth++) {
    const next = new Set<string>();
    for (const edge of edges) {
      if (frontier.has(edge.from_node_id) && !visited.has(edge.to_node_id)) {
        visited.add(edge.to_node_id);
        next.add(edge.to_node_id);
      }
    }
    frontier = next;
    if (!frontier.size) break;
  }
  return visited;
}

export function scoreCapabilityAdjacency(seedNodeIds: string[], traversedNodeIds: Set<string>, edges: GraphEdge[]): number {
  if (!seedNodeIds.length) return 0;
  let score = 0;
  for (const edge of edges) {
    if (seedNodeIds.includes(edge.from_node_id) && traversedNodeIds.has(edge.to_node_id)) {
      score += Number(edge.weight) || 0;
    }
  }
  return score / seedNodeIds.length;
}

export function inferStrategicFit(nodeIds: Set<string>, nodes: GraphNode[]): string[] {
  const matched = nodes.filter((n) => nodeIds.has(n.id));
  const traits = new Set<string>();
  for (const node of matched) {
    if (node.node_type === 'leadership_trait') traits.add(`Leadership: ${node.name}`);
    if (node.node_type === 'architecture_pattern') traits.add(`Architecture: ${node.name}`);
    if (node.node_type === 'outcome') traits.add(`Outcome: ${node.name}`);
  }
  return [...traits];
}

export function mapAnswersToSeedNodes(answerText: string, nodes: GraphNode[]): string[] {
  const lower = answerText.toLowerCase();
  return nodes.filter((n) => lower.includes(n.name.toLowerCase())).map((n) => n.id);
}

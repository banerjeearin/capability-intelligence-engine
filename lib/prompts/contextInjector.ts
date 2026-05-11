export function injectContext(basePrompt: string, contextBlocks: Array<{ title: string; content: string }>): string {
  const context = contextBlocks
    .filter((b) => b.content && b.content.trim().length > 0)
    .map((b) => `${b.title}:\n${b.content}`)
    .join('\n\n');

  return context ? `${basePrompt}\n\n${context}` : basePrompt;
}

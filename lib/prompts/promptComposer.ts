export function composePrompt(template: string, variables: Record<string, string | number>): string {
  return Object.entries(variables).reduce((acc, [key, value]) => {
    const pattern = new RegExp(`{{\\s*${key}\\s*}}`, 'g');
    return acc.replace(pattern, String(value));
  }, template);
}

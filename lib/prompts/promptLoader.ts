import fs from 'fs';
import path from 'path';

const PROMPTS_ROOT = path.resolve(process.cwd(), 'prompts');

export function loadPrompt(category: string, template: string, version = 'v1'): string {
  const filename = `${template}.${version}.txt`;
  const filePath = path.join(PROMPTS_ROOT, category, filename);

  if (!fs.existsSync(filePath)) {
    throw new Error(`Prompt not found: ${category}/${filename}`);
  }

  return fs.readFileSync(filePath, 'utf-8');
}

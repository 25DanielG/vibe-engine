import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load prompts from files (assumes prompts are in project root)
export function getPrompts(name: string): {markdown: String, json: String} {
  const fileNameMd = `prompt-${name}.md`;
  const fileNameJSON = `prompt-${name}.json`;

  const promptsdir = join(__dirname, '..', "prompts");
  
  const pathMd = join(promptsdir, fileNameMd);
  const pathJSON = join(promptsdir, fileNameJSON);

  const mdContents = readFileSync(pathMd, 'utf-8');
  const jsonContents = readFileSync(pathJSON, 'utf-8');

  return {
    markdown: mdContents,
    json: JSON.parse(jsonContents)
  }

}
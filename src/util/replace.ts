import { promises } from 'fs';
import { NO_MODIFY } from './blocks';

const { readFile, writeFile } = promises;

export default async function replace(path: string, flag: string, str: string) {
	const content = await readFile(path, 'utf-8');
	const eol = '\n';
	await writeFile(path, content.replace(new RegExp(`(/// MM ${flag} BEGIN)[\\s\\S]*\\n(\\s*/// MM ${flag} END)`), `$1${eol}/// ${NO_MODIFY}${eol}${str}${eol}$2`));
}

import { Uri, workspace } from 'vscode';

const fs = workspace.fs;

export function writeFileSync(path: string, data: string) {
	return workspace.fs.writeFile(Uri.file(path), Buffer.from(data, 'utf-8'));
}

export async function existsSync(path: string) {
	try {
		await workspace.fs.stat(Uri.file(path));
		return true;
	} catch (error) {
		return false;
	}
}

export async function readdirSync(path: string) {
	const files = await fs.readDirectory(Uri.file(path));
	return files.map(([p]) => {
		return p;
	});
}

export async function readFileSync(path: string) {
	const data = await fs.readFile(Uri.file(path));
	return Buffer.from(data).toString('utf8');
}

export function mkdirSync(dir: string) {
	return fs.createDirectory(Uri.file(dir));
}

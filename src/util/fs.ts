import { promises } from 'fs';
import { dirname } from 'path';

const { readFile, writeFile, stat, readdir, mkdir } = promises;

export async function writefileasync(path: string, data: string) {
	await mkdirasync(dirname(path));
	await writeFile(path, data, 'utf-8');
}

export async function existsasync(path: string) {
	try {
		await stat(path);
		return true;
	} catch (error) {
		return false;
	}
}

export function readdirasync(path: string) {
	return readdir(path);
}

export function readfileasync(path: string) {
	return readFile(path, 'utf-8');
}

export function mkdirasync(dir: string) {
	try {
		return mkdir(dir, { recursive: true });
	} catch{
		return Promise.resolve();	// already exits
	}
}

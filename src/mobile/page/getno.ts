import { join } from 'path';
import { FileType, Uri, workspace } from 'vscode';
import root from '../../util/root';

export default async function getno(prefix: string) {
	const dir = join(await root(), 'src');
	const no = await getmaxno(prefix, dir, 0);
	const num = no + 1;
	const len = 3;
	return prefix + (Array<string>(len).join('0') + num.toString()).slice(-len);
}

async function getmaxno(prefix: string, dir: string, max: number) {
	const files = await workspace.fs.readDirectory(Uri.file(dir));
	const l = prefix.length;
	for (let i = 0; i < files.length; i++) {
		const [f, t] = files[i];
		if (t === FileType.Directory) {
			if (f.startsWith(prefix)) {
				const no = parseInt(f.substr(l), 10);
				if (no > max) {
					max = no;
				}
			}
			if (/^c\d{3}/.test(f)) {
				const no = await getmaxno(prefix, join(dir, f), max);
				if (no > max) {
					max = no;
				}
			}
		}
	}
	return max;
}

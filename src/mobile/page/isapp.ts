import { join } from 'path';
import { Uri, workspace } from 'vscode';

export async function isapp(src: string) {
	try {
		const path = join(src, 'app', 'app.ts');
		await workspace.fs.stat(Uri.file(path));
		return true;
	} catch (error) {
		return false;
	}
}

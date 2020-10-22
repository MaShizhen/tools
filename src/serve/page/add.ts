import { join } from 'path';
import { Uri, window, workspace } from 'vscode';
import { existsasync, mkdirasync } from '../../util/fs';
import generate from '../../util/generate';
import { create_s } from '../../mm/addservice';

export default async function addpageserve(rootPath: string) {
	const src = join(rootPath, 'src');
	if (!await existsasync(src)) {
		await mkdirasync(src);
	}
	const folder = src;
	const p_path = await generate(folder, 'pg', '', 3);
	if (!await existsasync(folder)) {
		await mkdirasync(folder);
	}
	await mkdirasync(p_path);
	const s_path = join(p_path, 's001');
	await create_s(s_path, s_path.replace(/.*src[/|\\]/, ''));

	await workspace.saveAll();
	window.showTextDocument(Uri.file(join(p_path, 's001.ts')));
}

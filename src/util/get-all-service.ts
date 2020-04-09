import { join, sep } from 'path';
import { FileType, TextEditor, Uri, window, workspace } from 'vscode';
import pickoption from './pickoption';
import root from './root';

export default async function get_all_service(editor?: TextEditor) {
	const root_dir = await root(editor);
	const src = join(root_dir, 'src');
	const ss = await get_all_s(src, src);
	return window.showQuickPick(ss, {
		...pickoption,
		placeHolder: '请选择服务'
	});
}

async function get_all_s(cwd: string, root: string): Promise<string[]> {
	const files = await workspace.fs.readDirectory(Uri.file(cwd));
	const ss = await Promise.all(files.map(async ([path, type]) => {
		const fullpath = join(cwd, path);
		if (type === FileType.Directory) {
			return get_all_s(fullpath, root);
		} else if (type === FileType.File) {
			if (/^s\d{3}\.ts/.test(path)) {
				return [fullpath.replace(`${root}${sep}`, '').replace(/\\/g, '/').replace(/\.ts/, '')];
			}
		}
		return [];
	}));
	return ss.reduce((pre, cur) => {
		return pre.concat(cur);
	}, []);
}

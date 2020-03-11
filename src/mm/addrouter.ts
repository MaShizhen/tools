import { join, sep } from 'path';
import { commands, FileType, Range, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import prefix from '../util/prefix';
import root_path from '../util/root';

export default function add() {
	return commands.registerCommand('mm.service.router', async () => {
		const rootPath = await root_path();
		const file = Uri.file(join(rootPath, 'mm.json'));
		const doc = await workspace.openTextDocument(file);
		const raw = doc.getText();
		const conf = JSON.parse(raw);
		const routers = (conf.routers || []) as Array<{
			method: 'get' | 'post' | 'all' | string;
			service: string;
			url: string;
		}>;
		const service = await get_all_service(rootPath);
		if (!service) {
			return;
		}
		const method = await window.showQuickPick(['get', 'post', 'all']);
		if (!method) {
			return;
		}
		const rs = routers.map((r) => {
			return parseInt(r.url.replace(/[^\d]/g, ''), 10);
		}).filter((v) => {
			return v > 0;
		});
		if (rs.length === 0) {
			rs.push(0);
		}
		const url = prefix('/r', Math.max(...rs) + 1, 3);
		routers.push({
			method,
			service,
			url
		});
		conf.routers = routers;
		const we = new WorkspaceEdit();
		we.replace(file, new Range(0, 0, doc.lineCount, Infinity), JSON.stringify(conf, null, '\t'));
		await workspace.applyEdit(we);
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}

async function get_all_service(root: string) {
	const src = join(root, 'src');
	const ss = await get_all_s(src, src);
	return window.showQuickPick(ss, {
		placeHolder: '请选择服务',
		matchOnDescription: true,
		matchOnDetail: true
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

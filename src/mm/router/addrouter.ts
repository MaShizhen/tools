import { join, sep } from 'path';
import { FileType, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import prefix from '../../util/prefix';
import root_path from '../../util/root';
import { createfile } from '../../util/fs';

export default async function addrouter(name: 'routers' | 'filters') {
	const rootPath = await root_path();
	const config_path = join(rootPath, 'mm.json');
	const file = Uri.file(config_path);
	const doc = await workspace.openTextDocument(file);
	const raw = doc.getText();
	const conf = JSON.parse(raw);
	const routers = (conf[name] || []) as Array<{
		method: 'get' | 'post' | 'all' | string;
		service: string;
		url: string;
		data: {}
	}>;
	const service = await get_all_service(rootPath);
	if (!service) {
		return;
	}
	const method = await window.showQuickPick(['get', 'post', 'put', 'delete', 'all']);
	if (!method) {
		return;
	}
	const url = (() => {
		if (name === 'routers') {
			const rs = routers.map((r) => {
				return parseInt(r.url.replace(/[^\d]/g, ''), 10);
			}).filter((v) => {
				return v > 0;
			});
			if (rs.length === 0) {
				rs.push(0);
			}
			return prefix('/r', Math.max(...rs) + 1, 3);
		}
		return '/*';
	})();
	routers.push({
		data: {},
		method,
		service,
		url
	});
	conf[name] = routers;
	const we = new WorkspaceEdit();
	createfile(we, config_path, JSON.stringify(conf, null, '\t'));
	await workspace.applyEdit(we);
	await workspace.saveAll();
	await window.showTextDocument(file);
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

import { join } from 'path';
import { Uri, window, workspace } from 'vscode';
import prefix from '../../util/prefix';
import root_path from '../../util/root';
import { writefileasync } from '../../util/fs';
import get_all_service from '../../util/get-all-service';

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
	const service = await get_all_service();
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
	await writefileasync(config_path, JSON.stringify(conf, null, '\t'));
	await window.showTextDocument(file);
}

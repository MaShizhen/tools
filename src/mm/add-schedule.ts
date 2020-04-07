import { join, sep } from 'path';
import { commands, FileType, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import root from '../util/root';
import { createfile } from '../util/fs';
import pickoption from '../util/pickoption';

export default function addschedule() {
	return commands.registerCommand('mm.service.schedule', async () => {
		const rootPath = await root();
		const config_path = join(rootPath, 'mm.json');
		const file = Uri.file(config_path);
		const doc = await workspace.openTextDocument(file);
		const raw = doc.getText();
		const conf = JSON.parse(raw);
		const jobs = (conf.jobs || []) as Array<{
			description: string;
			rule: string;
			start: string;
			end: string;
			service: string;
			data: {}
		}>;
		const service = await get_all_service(rootPath);
		if (!service) {
			return;
		}
		const description = await window.showInputBox({
			ignoreFocusOut: true,
			prompt: '定时任务描述'
		});
		if (!description) {
			return;
		}
		jobs.push({
			data: {},
			service,
			description,
			rule: '* * * * * *',
			start: '',
			end: '',
		});
		conf.jobs = jobs;
		const we = new WorkspaceEdit();
		createfile(we, config_path, JSON.stringify(conf, null, '\t'));
		await workspace.applyEdit(we);
		await workspace.saveAll();
		await window.showTextDocument(file);
	});
}

async function get_all_service(root: string) {
	const src = join(root, 'src');
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

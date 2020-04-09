import { join } from 'path';
import { commands, Uri, window, workspace } from 'vscode';
import root from '../util/root';
import { writefileasync } from '../util/fs';
import get_all_service from '../util/get-all-service';

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
		const service = await get_all_service();
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
		await writefileasync(config_path, JSON.stringify(conf, null, '\t'));
		await window.showTextDocument(file);
	});
}

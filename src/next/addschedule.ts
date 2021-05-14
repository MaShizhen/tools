import { dirname, join } from 'path';
import { ViewColumn, window } from 'vscode';
import Actor from '../actor';

export default class AddScheduleNext extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		const config_path = join(rootPath, 'mm.json');
		const conf = await (async () => {
			try {
				const doc = await this.readfile(config_path);
				const conf = JSON.parse(doc) as {
					jobs: Array<{
						description: string;
						rule: string;
						start: string;
						end: string;
						service: string;
						data: unknown;
					}>;
				};
				if (!conf.jobs) {
					conf.jobs = [];
				}
				return conf;
			} catch {
				return { jobs: [] };
			}
		})();

		const description = await window.showInputBox({
			prompt: '定时任务描述'
		});
		if (!description) {
			return;
		}

		const src = this.getsourcedir();
		await this.mkdir(src);
		const name = await this.generate(src, 's', 3);
		// create service file
		const path = join(src, `${name}.ts`);
		const service = this.getrelativepath(join('src', 'schedule'), path.replace(/\.ts$/, ''));
		const tpl = `import anylogger from 'anylogger';

const logger = anylogger('schedule/${service}');

/**
 * ${description}
 * @param data 配置文件mm.json中的固定参数
 */
export default function ${name}(data: Record<string, unknown>) {
	logger.debug(data);
}
`;
		await this.writefile(path, tpl);
		await this.save();
		this.set_status_bar_message('成功添加服务文件');
		await this.show_doc(path);
		conf.jobs.push({
			data: {},
			service,
			description,
			rule: '* * * * * *',
			start: '',
			end: '',
		});
		await this.writefile(config_path, JSON.stringify(conf, null, '\t'));
		await this.show_doc(config_path);
		const panel = window.createWebviewPanel('mmstudio', '定时任务', { viewColumn: ViewColumn.Active });
		panel.webview.html = `<ol>
<li><h2>服务文件: ${this.getrelativepath(rootPath, path)}</h2></li>
<li><h2>配置文件: ${this.getrelativepath(rootPath, config_path)}</h2></li>
<li><a href="https://www.npmjs.com/package/@mmstudio/schedule"><h2>点击链接查看说明文档</h2></a></li>
</ol>`;
	}

	private getsourcedir() {
		const rootPath = this.root();
		const editor = window.activeTextEditor;
		const schedule = join(rootPath, 'src', 'schedule');
		if (!editor) {
			// 当前未打开任何文件
			return schedule;
		}
		const curdir = dirname(editor.document.fileName);
		if (curdir.includes(schedule)) {
			// 当前打开文件在src/schedule中
			return curdir;
		}
		return schedule;
	}
}

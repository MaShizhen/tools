import { dirname, join, sep } from 'path';
import { commands, Disposable, FileType, Uri, window, workspace } from 'vscode';
import Tools from './tools';
import Desktop from './desktop';
import Next from './next';
import UniApp from './uniapp';
import Taro from './taro';

enum PrjType {
	next = 'next',
	taro = 'taro',
	uniapp = 'uniapp',
	desktop = 'desktop',
}

export default class MM extends Tools {
	public addwidgetlocal() {
		return commands.registerCommand('mm.widget.addlocal', async () => {
			const tool = this.getinstance();
			return tool.addwidgetlocal();
		});
	}
	public addatomlocal() {
		return commands.registerCommand('mm.atom.addlocal', async () => {
			const tool = this.getinstance();
			return tool.addatomlocal();
		});
	}
	public addwidget() {
		return commands.registerCommand('mm.widget.add', async () => {
			const type = await this.selectplatform();
			if (!type) {
				return;
			}
			const instance = this.getinstancebytype(type);
			await instance.addwidget();
		});
	}
	public addatom() {
		return commands.registerCommand('mm.atom.add', async () => {
			const type = await this.selectplatform();
			if (!type) {
				return;
			}
			const tool = this.getinstancebytype(type);
			await tool.addatom();
		});
	}
	public addschedule() {
		return commands.registerCommand('mm.service.schedule', async () => {
			const rootPath = this.root();
			const config_path = join(rootPath, 'mm.json');
			const doc = await workspace.openTextDocument(Uri.file(config_path));
			const raw = doc.getText();
			const conf = JSON.parse(raw) as {
				jobs?: Array<{
					description: string;
					rule: string;
					start: string;
					end: string;
					service: string;
					data: unknown
				}>;
			};
			const jobs = conf.jobs || [];
			const src = join(rootPath, 'src');
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

			const ss = await get_all_s(src, src);
			const picked = await this.pick(ss.map((it) => {
				return {
					label: it
				};
			}), '请选择服务');
			if (!picked) {
				return;
			}
			const service = picked.label;
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
			await this.writefile(config_path, JSON.stringify(conf, null, '\t'));
			await this.show_doc(config_path);
		});
	}
	public addtplwidget() {
		return commands.registerTextEditorCommand('mm.tpl.widget', (textEditor) => {
			const tool = this.getinstance();
			return tool.addtplwidget(textEditor);
		});
	}
	public addtplatom() {
		return commands.registerTextEditorCommand('mm.tpl.atom', (textEditor) => {
			const tool = this.getinstance();
			return tool.addtplatom(textEditor);
		});
	}
	public shellcreate() {
		return commands.registerCommand('mm.shell.create', async () => {
			void window.showInformationMessage('进行此操作之前,请确保git已安装并配置好权限,且有一个可用的没有任何提交的git仓库');
			const type = await this.selectplatform();
			if (!type) {
				return;
			}
			const desc = await window.showInputBox({
				placeHolder: '请用简单语言描述一下这个项目',
				ignoreFocusOut: true,
				validateInput(val) {
					if (!val) {
						return '不能为空';
					}
					return null;
				}
			});
			if (!desc) {
				return;
			}
			const num = await window.showInputBox({
				placeHolder: '请输入项目编号',
				ignoreFocusOut: true,
				validateInput(val) {
					if (!/^\d{1,6}$/.test(val)) {
						return '项目编号必须为一个小于六位数的数字';
					}
					return null;
				}
			});
			if (!num) {
				return;
			}
			const def = dirname(this.workpath());
			const no = this.prefix('p', parseInt(num, 10), 6);
			const uri = await window.showSaveDialog({
				defaultUri: Uri.file(join(def, no))
			});
			if (!uri) {
				return;
			}
			if (await this.exists(uri.fsPath)) {
				this.showerror('路径非空');
				return;
			}
			const remote = await window.showInputBox({
				value: `git@github.com:mm-works/${no}.git`,
				placeHolder: `git@github.com:mm-works/${no}.git`,
				ignoreFocusOut: true,
				validateInput(val) {
					if (!val) {
						return '请输入Git远程仓库地址';
					}
					return null;
				}
			});
			await workspace.fs.createDirectory(uri);
			const tool = this.getinstancebytype(type);
			const cwd = uri.fsPath;
			await tool.shellcreate(cwd, no, desc);
			await this.shellexec('git init', cwd);
			await this.shellexec('git add .', cwd);
			await this.shellexec('git commit -m "init project"', cwd);
			await this.shellexec('git branch -M main', cwd);
			if (remote) {
				await this.shellexec(`git remote add origin ${remote}`, cwd);
				await this.shellexec('git push -u origin main', cwd);
			}
			void window.showInformationMessage('项目初始化已完成，即将安装必要依赖，请耐心等待，安装成功后即将自动重启vscode');
			await this.shellexec('yarn', cwd);
			await commands.executeCommand('vscode.openFolder', uri);
		});
	}
	public shelldebug() {
		return commands.registerCommand('mm.shell.debug', () => {
			const tool = this.getinstance();
			return tool.shelldebug();
		});
	}
	public shellbuild() {
		return commands.registerCommand('mm.shell.build', () => {
			const tool = this.getinstance();
			return tool.shellbuild();
		});
	}
	public completion() {
		const type = this.prj_type();
		if (!type) {
			return Disposable.from();
		}

		const tool = this.getinstance();
		return tool.completion();
	}
	public addservice() {
		return commands.registerCommand('mm.service.add', async () => {
			const tool = this.getinstance();
			await tool.addservice();
			return this.refreshexplorer();
		});
	}
	public addpage() {
		return commands.registerCommand('mm.page.add', async () => {
			const tool = this.getinstance();
			await tool.addpage();
			return this.refreshexplorer();
		});
	}
	public addaction() {
		return commands.registerTextEditorCommand('mm.action.add', async (editor) => {
			const tool = this.getinstance();
			await tool.addaction(editor);
			return this.refreshexplorer();
		});
	}
	public addcomponent() {
		return commands.registerTextEditorCommand('mm.component.add', async (editor) => {
			const tool = this.getinstance();
			await tool.addcomponent(editor);
			return this.refreshexplorer();
		});
	}

	private desktop = new Desktop();
	private next = new Next();
	private uniapp = new UniApp();
	private taro = new Taro();
	private getinstance() {
		const type = this.prj_type();
		if (!type) {
			throw new Error('unknown project type');
		}
		// 如果当前目录不在某个页面中，则不允许操作
		return this.getinstancebytype(type);
	}
	private getinstancebytype(type: PrjType) {
		// 如果当前目录不在某个页面中，则不允许操作
		switch (type) {
			case PrjType.desktop:
				return this.desktop;
			case PrjType.uniapp:
				return this.uniapp;
			case PrjType.next:
				return this.next;
			case PrjType.taro:
				return this.taro;
			default:
				throw new Error('unknown project type');
		}
	}

	private prj_type() {
		const type = workspace.getConfiguration().get<PrjType>('mm.proj.type');
		if (type) {
			return type;
		}
		const root_path = this.root();
		const src = join(root_path, 'src');
		const pagesjson = join(src, 'pages.json');
		if (this.existssync(pagesjson) && this.existssync(pagesjson)) {
			return PrjType.uniapp;
		}
		const pages = join(root_path, 'pages');
		if (this.existssync(join(pages, '_app.tsx'))) {
			return PrjType.next;
		}
		const srcpages = join(root_path, 'src', 'pages');
		if (this.existssync(join(srcpages, '_app.tsx'))) {
			return PrjType.next;
		}
		if (this.existssync(join(src, 'app.config.ts'))) {
			return PrjType.taro;
		}
		return null;
	}

	private async selectplatform() {
		const picked = await this.pick([
			{
				description: '1.next.js',
				label: 'web',
				type: PrjType.next
			},
			{
				description: '2.taro',
				label: 'app',
				type: PrjType.taro
			},
			{
				description: '3.uniapp',
				label: 'app',
				type: PrjType.uniapp
			},
			{
				description: '7.electron',
				label: 'desktop',
				type: PrjType.desktop
			}
		], '请选择项目端点类型');
		return picked && picked.type;
	}
}

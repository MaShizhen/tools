import { dirname, join, sep } from 'path';
import { commands, FileType, Uri, window, workspace } from 'vscode';
import Web from './web';
import Tools from './tools';
import Mobile from './mobile';
import WeiXin from './wx';
import Desktop from './desktop';
import Next from './next';
import UniApp from './uniapp';
import Serve from './serve';

enum PrjType {
	web = 'web/h5',
	wxapp = 'wxapp',
	desktop = 'desktop',
	mobile = 'mobile',
	serve = 'serve',
	uniapp = 'uniapp',
	next = 'next'
}

export default class MM extends Tools {
	public addwidget() {
		return commands.registerCommand('mm.widget.add', async () => {
			const items = [
				{
					detail: '1.web/h5控件',
					label: 'web/h5',
					type: PrjType.web
				},
				{
					detail: '2.移动端app控件',
					label: 'mobile',
					type: PrjType.mobile
				},
				{
					detail: '3.微信小程序控件',
					label: 'wxapp',
					type: PrjType.wxapp
				}
			];
			const pickoption = this.getdefaultpickoption();
			const picked = await window.showQuickPick(items, {
				...pickoption,
				placeHolder: '请选择项目端点类型'
			});
			if (!picked) {
				return;
			}
			const type = picked.type;
			const instance = this.getinstancebytype(type);
			instance.addwidget();
		});
	}
	public addatom() {
		return commands.registerCommand('mm.atom.add', async () => {
			const pickitems = [
				{
					detail: '1.Next原子操作',
					label: 'next',
					type: PrjType.next
				},
				{
					detail: '2.服务端原子操作',
					label: 'serve',
					type: PrjType.serve
				},
				{
					detail: '3.uniapp原子操作',
					label: 'uniapp',
					type: PrjType.uniapp
				},
				{
					detail: '4.服务端原子操作',
					label: 'nodejs',
					type: PrjType.serve
				},
				{
					detail: '5.web/h5原子操作',
					label: 'web/h5',
					type: PrjType.web
				},
				{
					detail: '6.移动端app原子操作',
					label: 'mobile',
					type: PrjType.mobile
				},
				{
					detail: '7.微信小程序原子操作',
					label: 'wxapp',
					type: PrjType.wxapp
				}
			];
			const pickoption = this.getdefaultpickoption();
			const p1 = await window.showQuickPick(pickitems, {
				...pickoption,
				placeHolder: '请选择项目端点类型'
			});
			if (!p1) {
				return;
			}
			const tool = this.getinstancebytype(p1.type);
			await tool.addatom();
		});
	}
	public addschedule() {
		return commands.registerCommand('mm.service.schedule', async () => {
			const rootPath = this.root();
			const config_path = join(rootPath, 'mm.json');
			const doc = await workspace.openTextDocument(Uri.file(config_path));
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
			const pickoption = this.getdefaultpickoption();
			const service = await window.showQuickPick(ss, {
				...pickoption,
				placeHolder: '请选择服务'
			});
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
			await this.writefileasync(config_path, JSON.stringify(conf, null, '\t'));
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
	public refreshsitemap() {
		return commands.registerCommand('mm.refreshmap', async () => {
			const tool = this.getinstance();
			tool.refreshsitemap();
			await commands.executeCommand('mm.showmap');
		});
	}
	public showsitemap() {
		return commands.registerCommand('mm.showmap', async () => {
			try {
				const file = join(this.root(), '.mm.md');
				await window.showTextDocument(Uri.file(file));
				// await commands.executeCommand('markdown.showPreview');
			} catch {
				await commands.executeCommand('mm.refreshmap');
			}
		});
	}
	public shellcreate() {
		return commands.registerCommand('mm.shell.create', async () => {
			window.showInformationMessage('进行此操作之前,请确保git已安装并配置好权限,且有一个可用的没有任何提交的git仓库');
			const pickoption = this.getdefaultpickoption();
			const picked = await window.showQuickPick([
				{
					description: '1.next.js',
					label: 'next.js',
					type: PrjType.next
				},
				{
					description: '2.uniapp',
					label: 'app',
					type: PrjType.uniapp
				},
				{
					description: '3.web/h5网站应用',
					label: 'web/h5',
					type: PrjType.web
				},
				{
					description: '4.移动端app',
					label: 'mobile',
					type: PrjType.mobile
				},
				{
					description: '5.微信小程序',
					label: 'wxapp',
					type: PrjType.wxapp
				},
				{
					description: '6.桌面应用程序',
					label: 'desktop',
					type: PrjType.desktop
				}
			], {
				...pickoption,
				placeHolder: '请选择项目端点类型'
			});
			if (!picked) {
				return;
			}
			const type = picked.type;
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
			if (await this.existsasync(uri.fsPath)) {
				window.showErrorMessage('路径非空');
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
			window.showInformationMessage('项目初始化已完成，即将安装必要依赖，请耐心等待，安装成功后即将自动重启vscode');
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
		const tool = this.getinstance();
		return tool.completion();
	}
	public addwebfilter() {
		return commands.registerCommand('mm.service.filter', async () => {
			const tool = this.getinstance();
			await tool.addwebfilter();
			return this.refreshexplorer();
		});
	}
	public addwebrouter() {
		return commands.registerCommand('mm.service.router', async () => {
			const tool = this.getinstance();
			await tool.addwebrouter();
			return this.refreshexplorer();
		});
	}
	public addpresentation() {
		return commands.registerTextEditorCommand('mm.presentation.add', async (editor) => {
			const tool = this.getinstance();
			await tool.addpresentation(editor);
			return this.refreshexplorer();
		});
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
			this.refreshexplorer();
		});
	}

	private web = new Web();
	private mobile = new Mobile();
	private wx = new WeiXin();
	private desktop = new Desktop();
	private next = new Next();
	private uniapp = new UniApp();
	private serve = new Serve();
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
			case PrjType.web:
				return this.web;
			case PrjType.mobile:
				return this.mobile;
			case PrjType.wxapp:
				return this.wx;
			case PrjType.desktop:
				return this.desktop;
			case PrjType.uniapp:
				return this.uniapp;
			case PrjType.next:
				return this.next;
			case PrjType.serve:
				return this.serve;
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
		if (this.exists(pagesjson) && this.exists(pagesjson)) {
			return PrjType.uniapp;
		}
		const pages = join(root_path, 'pages');
		if (this.exists(join(pages, '_app.tsx'))) {
			return PrjType.next;
		}
		const srcpages = join(root_path, 'src', 'pages');
		if (this.exists(join(srcpages, '_app.tsx'))) {
			return PrjType.next;
		}
		return null;
	}
}

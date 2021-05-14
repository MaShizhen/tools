import { dirname, join } from 'path';
import { commands, Disposable, Uri, window, workspace } from 'vscode';
import Tools from './tools';
import Desktop from './desktop';
import Next from './next';
import UniApp from './uniapp';
import Taro from './taro';
import html2jsx from './util/html2jsx';
import linebreak from './mm/linebreak';

enum PrjType {
	next = 'next',
	taro = 'taro',
	uniapp = 'uniapp',
	desktop = 'desktop',
}

export default class MM extends Tools {
	public linebreak() {
		return commands.registerTextEditorCommand('mm.linebreak', (editor) => {
			return linebreak(editor);
		});
	}

	public transfiles() {
		return commands.registerCommand('mm.transfiles', () => {
			const tool = this.getinstance();
			return tool.transfiles();
		});
	}
	public generatetable() {
		return commands.registerCommand('mm.generatetable', () => {
			const tool = this.getinstance();
			return tool.generatetable();
		});
	}
	public prototype() {
		return commands.registerCommand('mm.prototype', () => {
			const tool = this.getinstance();
			return tool.prototype();
		});
	}
	public html2jsx() {
		return commands.registerTextEditorCommand('mm.html2jsx', async (editor) => {
			const sel = editor.selection;
			const doc = editor.document;
			const html = doc.getText(sel);
			if (!html) {
				return Promise.resolve(true);
			}
			const jsx = html2jsx(html);
			if (jsx === html) {
				return Promise.resolve(true);
			}
			return editor.edit((eb) => {
				eb.replace(sel, jsx);
			});
		});
	}
	public addwidgetlocal() {
		return commands.registerCommand('mm.widget.addlocal', async () => {
			const tool = this.getinstance();
			return tool.addwidgetlocal();
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
			const tool = this.getinstance();
			return tool.addschedule();
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
		return commands.registerCommand('mm.shell.dev', () => {
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
		return commands.registerCommand('mm.service.add', async (uri?: Uri) => {
			const tool = this.getinstance();
			await tool.addservice(uri && uri.fsPath);
			return this.refreshexplorer();
		});
	}
	public addpage() {
		return commands.registerCommand('mm.page.add', async (uri?: Uri) => {
			const tool = this.getinstance();
			await tool.addpage(uri && uri.fsPath);
			return this.refreshexplorer();
		});
	}
	public addatomlocal() {
		return commands.registerTextEditorCommand('mm.atom.addlocal', async () => {
			const tool = this.getinstance();
			await tool.addatomlocal();
			return this.refreshexplorer();
		});
	}
	public addatomlocal2() {
		return commands.registerCommand('mm.atom.addlocal2', async (uri?: Uri) => {
			const tool = this.getinstance();
			await tool.addatomlocal(uri && uri.fsPath);
			return this.refreshexplorer();
		});
	}
	public finddoc() {
		return commands.registerCommand('mm.doc.find', async () => {
			const tool = this.getinstance();
			await tool.finddoc();
		});
	}
	public addcomponent() {
		return commands.registerTextEditorCommand('mm.component.add', async (editor) => {
			const tool = this.getinstance();
			await tool.addcomponent(editor);
			return this.refreshexplorer();
		});
	}
	public addcomponent2() {
		return commands.registerCommand('mm.component.add2', async (uri?: Uri) => {
			const tool = this.getinstance();
			await tool.addcomponent2(uri && uri.fsPath);
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
		if (!root_path) {
			return null;
		}
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

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
	public regenerateresourses() {
		return commands.registerCommand('mm.regenerateresourses', () => {
			const tool = this.getinstance();
			return tool.regenerateresourses();
		});
	}

	public regeneratepages() {
		return commands.registerCommand('mm.regeneratepages', () => {
			const tool = this.getinstance();
			return tool.regeneratepages();
		});
	}

	public regenerateapis() {
		return commands.registerCommand('mm.regenerateapis', () => {
			const tool = this.getinstance();
			return tool.regenerateapis();
		});
	}

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
			void window.showInformationMessage('?????????????????????,?????????git???????????????????????????,??????????????????????????????????????????git??????');
			const type = await this.selectplatform();
			if (!type) {
				return;
			}
			const desc = await window.showInputBox({
				placeHolder: '??????????????????????????????????????????',
				ignoreFocusOut: true,
				validateInput(val) {
					if (!val) {
						return '????????????';
					}
					return null;
				}
			});
			if (!desc) {
				return;
			}
			const def = dirname(this.workpath());
			const uri = await window.showSaveDialog({
				defaultUri: Uri.file(def)
			});
			if (!uri) {
				return;
			}
			if (await this.exists(uri.fsPath)) {
				this.showerror('????????????');
				return;
			}
			const cwd = uri.fsPath;
			const index = cwd.lastIndexOf('/');
			const no = cwd.substring(index + 1, cwd.length);
			const remote = await window.showInputBox({
				value: `git@gitee.com:dfactory01/${no}.git`,
				placeHolder: `git@github.com:mm-works/${no}.git`,
				ignoreFocusOut: true,
				validateInput(val) {
					if (!val) {
						return '?????????Git??????????????????';
					}
					return null;
				}
			});
			if (!remote) {
				return;
			}
			await workspace.fs.createDirectory(uri);
			const tool = this.getinstancebytype(type);
			await tool.shellcreate(cwd, no, desc);
			await this.shellexec('git init', cwd);
			await this.shellexec('git add .', cwd);
			await this.shellexec('git commit -m "init project"', cwd);
			await this.shellexec('git branch -M main', cwd);
			if (remote) {
				await this.shellexec(`git remote add origin ${remote}`, cwd);
				await this.shellexec('git push -u origin main', cwd);
			}
			void window.showInformationMessage('?????????????????????????????????????????????????????????????????????????????????????????????????????????vscode');
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
			try {
			const tool = this.getinstance();
			await tool.addservice(uri && uri.fsPath);
			await this.refreshexplorer();
			} catch (error) {
				console.error(error);
				window.showErrorMessage((error as Error).message);
			}
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
		// ????????????????????????????????????????????????????????????
		return this.getinstancebytype(type);
	}
	private getinstancebytype(type: PrjType) {
		// ????????????????????????????????????????????????????????????
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
		if (this.existssync(join(pages, '_app.page.tsx'))) {
			return PrjType.next;
		}
		const srcpages = join(root_path, 'src', 'pages');
		if (this.existssync(join(srcpages, '_app.page.tsx'))) {
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
		], '???????????????????????????');
		return picked && picked.type;
	}
}

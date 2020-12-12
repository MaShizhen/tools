import { join } from 'path';
import { commands, workspace } from 'vscode';
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
	public shelldebug() {
		return commands.registerCommand('mm.shell.debug', () => {
			const tool = this.get_instance();
			return tool.shelldebug();
		});
	}
	public shellbuild() {
		return commands.registerCommand('mm.shell.build', () => {
			const tool = this.get_instance();
			return tool.shellbuild();
		});
	}
	public completion() {
		const tool = this.get_instance();
		return tool.completion();
	}
	public addwebfilter() {
		return commands.registerCommand('mm.service.filter', async () => {
			const tool = this.get_instance();
			await tool.addwebfilter();
			return this.refreshexplorer();
		});
	}
	public addwebrouter() {
		return commands.registerCommand('mm.service.router', async () => {
			const tool = this.get_instance();
			await tool.addwebrouter();
			return this.refreshexplorer();
		});
	}
	public addpresentation() {
		return commands.registerTextEditorCommand('mm.presentation.add', async (editor) => {
			const tool = this.get_instance();
			await tool.addpresentation(editor);
			return this.refreshexplorer();
		});
	}
	public addservice() {
		return commands.registerCommand('mm.service.add', async () => {
			const tool = this.get_instance();
			await tool.addservice();
			return this.refreshexplorer();
		});
	}
	public addpage() {
		return commands.registerCommand('mm.page.add', async () => {
			const tool = this.get_instance();
			await tool.addpage();
			return this.refreshexplorer();
		});
	}
	public addaction() {
		return commands.registerTextEditorCommand('mm.action.add', async (editor) => {
			const tool = this.get_instance();
			await tool.addaction(editor);
			return this.refreshexplorer();
		});
	}
	public addcomponent() {
		return commands.registerTextEditorCommand('mm.component.add', async (editor) => {
			const tool = this.get_instance();
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
	private get_instance() {
		const type = this.prj_type();
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

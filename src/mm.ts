import { join } from 'path';
import { commands, workspace } from 'vscode';
import Web from './web';
import Tools from './tools';
import Mobile from './mobile';
import WeiXin from './wx';
import Desktop from './desktop';
import Next from './next';
import UniApp from './uniapp';

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
	private web = new Web();
	private mobile = new Mobile();
	private wx = new WeiXin();
	private desktop = new Desktop();
	private next = new Next();
	private uniapp = new UniApp();
	public addaction() {
		return commands.registerTextEditorCommand('mm.action.add', async (editor) => {
			const tool = await this.get_instance();
			await tool.addaction(editor);
			return this.refreshexplorer();
		});
	}

	private async get_instance() {
		const type = await this.prj_type();
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
			default:
				throw new Error('unknown project type');
		}
	}

	private async prj_type() {
		const type = workspace.getConfiguration().get<PrjType>('mm.proj.type');
		if (type) {
			return type;
		}
		const root_path = await this.root();
		const src = join(root_path, 'src');
		const pagesjson = join(src, 'pages.json');
		if (await this.existsasync(pagesjson) && await this.existsasync(pagesjson)) {
			return PrjType.uniapp;
		}
		const pages = join(root_path, 'pages');
		if (await this.existsasync(join(pages, '_app.tsx'))) {
			return PrjType.next;
		}
		const srcpages = join(root_path, 'src', 'pages');
		if (await this.existsasync(join(srcpages, '_app.tsx'))) {
			return PrjType.next;
		}
		return null;
	}
}

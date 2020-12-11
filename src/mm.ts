import { commands } from 'vscode';
import prj_type, { PrjType } from './util/prj-type';
import Web from './web';
import Tools from './tools';

export default class MM extends Tools {
	private web = new Web();
	public addaction() {
		return commands.registerTextEditorCommand('mm.action.add', async (editor) => {
			const tool = this.get_instance();
			await tool.addaction(editor);
			return this.refreshexplorer();
		});
	}

	private get_instance() {
		const type = prj_type();
		// 如果当前目录不在某个页面中，则不允许操作
		switch (type) {
			case PrjType.web:
				return this.web;
			case PrjType.wxapp:
			case PrjType.desktop:
			case PrjType.mobile:
			default:
				throw new Error('unknown project type');
		}
	}
}

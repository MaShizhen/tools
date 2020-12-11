import { parse } from 'path';
import { TextEditor } from 'vscode';
import Base from './base';
import reg_in_comment from './util/reg-in-component';
import Component from './web/addaction/component';
import ComponentN from './web/addaction/componentn';
import Page from './web/addaction/page';
import PageN from './web/addaction/pagen';

export default class Web extends Base {
	private pagena = new PageN();
	private page = new Page();
	private component = new Component();
	private componentn = new ComponentN();
	public async addaction(editor: TextEditor): Promise<void> {
		const path = editor.document.fileName;
		const fileName = parse(path).base;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = reg_in_comment(path);
		if (r) {
			if (fileName === 'n.ts') {
				await this.componentn.addaction(editor);
			} else {
				await this.component.addaction(editor);
			}
		} else if (fileName === 'n.ts') {
			await this.pagena.addaction(editor);
		} else {
			await this.page.addaction(editor);
		}
	}
}

import { parse } from 'path';
import { TextEditor } from 'vscode';
import Base from './base';
import AddActionWebComponent from './web/addaction/component';
import AddActionWebComponentN from './web/addaction/componentn';
import AddActionWebPage from './web/addaction/page';
import AddActionWebPageN from './web/addaction/pagen';
import AddComponentWeb from './web/addcomponent';
import AddPageWeb from './web/addpage';
import AddPresentationWeb from './web/addpresentation';

export default class Web extends Base {
	public addwebfilter(): Promise<void> {
		return this.baseaddwebrouter('filters');
	}
	public addwebrouter(): Promise<void> {
		return this.baseaddwebrouter('routers');
	}
	public addpresentation(editor: TextEditor): Promise<void> {
		return new AddPresentationWeb().addpresentation(editor);
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddPageWeb().addpage();
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentWeb().addcomponent(editor);
	}
	public async addaction(editor: TextEditor): Promise<void> {
		const path = editor.document.fileName;
		const fileName = parse(path).base;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(path);
		if (r) {
			if (fileName === 'n.ts') {
				const componentn = new AddActionWebComponentN();
				await componentn.addaction(editor);
			} else {
				const component = new AddActionWebComponent();
				await component.addaction(editor);
			}
		} else if (fileName === 'n.ts') {
			const pagena = new AddActionWebPageN();
			await pagena.addaction(editor);
		} else {
			const page = new AddActionWebPage();
			await page.addaction(editor);
		}
	}
}

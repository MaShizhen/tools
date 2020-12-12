import { basename, dirname } from 'path';
import { TextEditor, Uri, window } from 'vscode';
import Tools from '../tools';

export default class AddPresentationWeb extends Tools {
	public async addpresentation(editor: TextEditor) {
		const uri = editor.document.uri;
		const folder = dirname(uri.fsPath);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(folder);
		if (r === null) {
			window.showErrorMessage('请在组件中进行该操作!');
		} else {
			const doc = editor.document;
			const p_path = await this.generate(folder, 'p', '\\.tpl', 2);
			const no = basename(p_path);
			const content = doc.getText(editor.selection);

			const tpl = Uri.file(`${p_path}.tpl`);
			await this.writefileasync(`${p_path}.tpl`, content);
			await editor.edit((eb) => {
				eb.replace(editor.selection, `<div data-mm-tpl="${no}"></div>`);
			});
			await window.showTextDocument(tpl);
		}
	}
}

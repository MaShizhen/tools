import { Position, TextEditor, window } from 'vscode';
import Actor from '../actor';

export default class AddComponentNext extends Actor {
	public async do(editor: TextEditor): Promise<void> {
		const doc = editor.document;
		if (!/\/pages\/.+\.tsx/.test(doc.fileName)) {
			await window.showErrorMessage('不能在当前页面插入组件');
			return;
		}
		const body = doc.getText();
		let no = 1;
		while (new RegExp(`C0*${no}`).test(body)) { ++no; }
		const sel = editor.selection;
		const jsx = (() => {
			if (sel.isEmpty) {
				return `<>
	组件${no}
</>`;
			}
			return `<>
	${doc.getText(sel)}
</>`;
		})();
		const cname = this.prefix('C', no, 3);
		const tpl = `
function ${cname}() {
	return ${jsx};
}
`;
		await editor.edit((eb) => {
			eb.insert(new Position(doc.lineCount - 1, 0), tpl);
			eb.replace(sel, `<${cname} />`);
		});
		this.set_status_bar_message('成功添加组件');
		// await this.show_doc(path);
	}
}

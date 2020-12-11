import { TextEditor, window } from 'vscode';
import Base from './base';
import reg_in_comment from './util/reg-in-component';
import mobile from './mobile/addaction';

export default class Mobile extends Base {
	public async addaction(editor: TextEditor): Promise<void> {
		const path = editor.document.fileName;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = reg_in_comment(path);
		if (r) {
			window.showErrorMessage('不能在mobile项目中进行该操作!');
			return;
		}
		await mobile(editor);
	}
}

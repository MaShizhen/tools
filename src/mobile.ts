import { TextEditor } from 'vscode';
import Base from './base';
import AddActionMobile from './mobile/addaction/component';

export default class Mobile extends Base {
	public async addaction(editor: TextEditor): Promise<void> {
		const addactionmobile = new AddActionMobile();
		return addactionmobile.addaction(editor);
	}
}

import { TextEditor } from 'vscode';
import Base from './base';
import AddActionMobile from './mobile/addaction/component';
import AddComponentMobile from './mobile/addcomponent';

export default class Mobile extends Base {
	public addpage(): Promise<void> {
		return new AddComponentMobile().addpage();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public async addaction(editor: TextEditor): Promise<void> {
		const addactionmobile = new AddActionMobile();
		return addactionmobile.addaction(editor);
	}
}

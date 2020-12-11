import { TextEditor } from 'vscode';
import Base from './base';
import AddActionUniappPage from './uniapp/addpage';

export default class UniApp extends Base {
	public addaction(_editor: TextEditor): Promise<void> {
		return new AddActionUniappPage().addaction();
	}
}

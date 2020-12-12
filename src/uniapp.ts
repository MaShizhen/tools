import { TextEditor } from 'vscode';
import Base from './base';
import AddPageUniapp from './uniapp/addpage';

export default class UniApp extends Base {
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddPageUniapp().addaction();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
}

import { TextEditor } from 'vscode';
import Base from './base';
import AddPageServe from './serve/addpage';

export default class Serve extends Base {
	public addpage(): Promise<void> {
		return new AddPageServe().addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
}

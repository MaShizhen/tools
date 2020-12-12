import { TextEditor } from 'vscode';
import Base from './base';
import AddPageNext from './next/addpage';

export default class Next extends Base {
	public addpage(): Promise<void> {
		return new AddPageNext().addpage();
	}
	public addcomponent(_editor: TextEditor): Promise<void> {
		return this.addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
}

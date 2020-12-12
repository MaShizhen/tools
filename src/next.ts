import { TextEditor } from 'vscode';
import Base from './base';
import AddPageNext from './next/addpage';
import AddServiceNext from './next/addservice';

export default class Next extends Base {
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		return new AddServiceNext().addservice();
	}
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

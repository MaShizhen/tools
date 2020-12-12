import { TextEditor } from 'vscode';
import Base from './base';
import AddComponentDesktop from './desktop/addcomponent';
import AddPageDesktop from './desktop/addpage';

export default class Desktop extends Base {
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddPageDesktop().addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentDesktop().addcomponnet(editor);
	}
}

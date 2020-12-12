import { TextEditor } from 'vscode';
import Base from './base';
import AddPageServe from './serve/addpage';

export default class Serve extends Base {
	public addwebfilter(): Promise<void> {
		return this.baseaddwebrouter('filters');
	}
	public addwebrouter(): Promise<void> {
		return this.baseaddwebrouter('routers');
	}
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
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

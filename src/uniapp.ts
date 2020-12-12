import { Disposable, languages, TextEditor } from 'vscode';
import Base from './base';
import AddPageUniapp from './uniapp/addpage';

export default class UniApp extends Base {
	public completion(): Disposable {
		return languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems() {
					return undefined;
				}
			}
		);
	}
	public addwebfilter(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwebrouter(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addpresentation(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
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

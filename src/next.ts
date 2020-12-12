import { Disposable, languages, TextEditor } from 'vscode';
import Base from './base';
import AddPageNext from './next/addpage';
import AddServiceNext from './next/addservice';

export default class Next extends Base {
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

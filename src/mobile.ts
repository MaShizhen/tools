import { dirname } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, TextDocument, TextEditor } from 'vscode';
import Base from './base';
import AddActionMobile from './mobile/addaction/component';
import AddComponentMobile from './mobile/addcomponent';

export default class Mobile extends Base {
	public completion(): Disposable {
		const events = ['mm-events-status-change', 'mm-events-init', 'mm-events-nav-blur', 'mm-events-nav-focus', 'mm-events-nav-state', 'mm-events-nav-stack-trans-start', 'mm-events-nav-stack-trans-end', 'mm-events-nav-tab-press', 'mm-events-nav-tab-long-press', 'mm-events-keyboard-will-show', 'mm-events-keyboard-did-show', 'mm-events-keyboard-will-hide', 'mm-events-keyboard-did-hide', 'mm-events-keyboard-will-changeframe', 'mm-events-keyboard-did-changeframe', 'mm-events-accessibility-change', 'mm-events-accessibility-annoucement-finished', 'mm-events-net-change'];
		return languages.registerCompletionItemProvider(
			'typescript',
			{
				provideCompletionItems: async (document: TextDocument, position: Position) => {
					if (!/[\\|/]n?s\.ts$/.test(document.fileName) || events.length === 0) {
						return undefined;
					}
					const linePrefix = document.lineAt(position).text.substr(0, position.character);
					if (linePrefix.includes(':')) {
						const dir = dirname(document.fileName);
						const files = await this.readdirasync(dir);
						const reg = /[\\|/]ns\.ts$/.test(document.fileName) ? /^na\d+.ts$/ : /^a\d+.ts$/;
						return files.filter((it) => {
							return reg.test(it);
						}).map((it) => {
							return new CompletionItem(it.replace('.ts', ''), CompletionItemKind.File);
						});
					}
					return events.map((event) => {
						return new CompletionItem(event, CompletionItemKind.Enum);
					});
				}
			},
			'\'',
			'"'
		);
	}
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

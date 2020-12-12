import { dirname } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, TextDocument, TextEditor } from 'vscode';
import Base from './base';
import AddComponentDesktop from './desktop/addcomponent';
import AddPageDesktop from './desktop/addpage';

export default class Desktop extends Base {
	public shelldebug(): void {
		const command = 'npm t';
		return this.shellrun(command, 'debug');
	}
	public shellbuild(): void {
		const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build && npm publish && npm run build:linux";
		this.shellrun(command, 'build');
	}
	public completion(): Disposable {
		const events = ['mm-events-init'];
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
		return new AddPageDesktop().addpage();
	}
	public addaction(editor: TextEditor): Promise<void> {
		return this.baseaddaction(editor);
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentDesktop().addcomponnet(editor);
	}
}

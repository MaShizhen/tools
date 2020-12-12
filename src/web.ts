import { dirname, join, parse } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, TextDocument, TextEditor } from 'vscode';
import Base from './base';
import AddActionWebComponent from './web/addaction/component';
import AddActionWebComponentN from './web/addaction/componentn';
import AddActionWebPage from './web/addaction/page';
import AddActionWebPageN from './web/addaction/pagen';
import AddComponentWeb from './web/addcomponent';
import AddPageWeb from './web/addpage';
import AddPresentationWeb from './web/addpresentation';

export default class Web extends Base {
	public async shellcreate(cwd: string, no: string, desc: string): Promise<void> {
		await this.downloadandextractrepo(cwd, { name: 'web', branch: 'master' });
		await this.replacefile(join(cwd, 'package.json'), [/prjno/, /\$desc/], [no, desc]);
	}
	public shelldebug(): void {
		const command = 'npm t';
		this.shellrun(command, 'debug');
	}
	public shellbuild(): void {
		const command = "npm version '1.0.'$(date +%Y%m%d%H%M) && npm run build:n && npm run build && git commit -am 'build' && npm publish";
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
	public addpresentation(editor: TextEditor): Promise<void> {
		return new AddPresentationWeb().addpresentation(editor);
	}
	public addservice(): Promise<void> {
		return this.baseaddservice();
	}
	public addpage(): Promise<void> {
		return new AddPageWeb().addpage();
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentWeb().addcomponent(editor);
	}
	public async addaction(editor: TextEditor): Promise<void> {
		const path = editor.document.fileName;
		const fileName = parse(path).base;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(path);
		if (r) {
			if (fileName === 'n.ts') {
				const componentn = new AddActionWebComponentN();
				await componentn.addaction(editor);
			} else {
				const component = new AddActionWebComponent();
				await component.addaction(editor);
			}
		} else if (fileName === 'n.ts') {
			const pagena = new AddActionWebPageN();
			await pagena.addaction(editor);
		} else {
			const page = new AddActionWebPage();
			await page.addaction(editor);
		}
	}
}

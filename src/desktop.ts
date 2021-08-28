import { dirname, join } from 'path';
import { CompletionItem, CompletionItemKind, Disposable, languages, Position, QuickPickItem, SnippetString, TextDocument, TextEditor } from 'vscode';
import Base from './base';
import AddComponentDesktop from './desktop/addcomponent';
import AddPageDesktop from './desktop/addpage';
import { IAtom, IAtomCatagory } from './interfaces';

export default class Desktop extends Base {
	public addcomponent2(_path?: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public transfiles(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	protected getpagename(_path: string): string | null {
		throw new Error('Method not implemented.');
	}
	public addschedule(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidgetlocal(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addwidget(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addatom(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	private remotewidgets = [] as IAtomCatagory[];
	public async addtplwidget(editor: TextEditor): Promise<void> {
		if (!this.remotewidgets) {
			this.remotewidgets = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/widgets-desktop/index.json');
		}
		const atoms = this.remotewidgets;
		const all = new Map<string, IAtom>();
		const catagories = new Map<string, IAtom[]>();
		atoms.forEach((it) => {
			catagories.set(it.catagory, it.atoms);
			it.atoms.forEach((atom) => {
				all.set(atom.no, atom);
			});
		});
		await this.insert_widget_snippet(editor, all, catagories);
	}
	private async insert_widget_snippet(textEditor: TextEditor, all: Map<string, IAtom>, catagories: Map<string, IAtom[]>) {
		const selects = Array.from(catagories.keys()).map((catagory) => {
			const item: QuickPickItem = {
				label: catagory
			};
			return item;
		}).concat(Array.from(all.values()).map((atom) => {
			const item: QuickPickItem = {
				detail: atom.name,
				label: atom.no
			};
			return item;
		}));

		const picked = await this.pick(selects, '选择一个分类或直接输入控件编号并回车');
		if (!picked) {
			return;
		}
		const pick = all.get(picked.label);
		if (pick) {
			await this.add_snippet(pick, textEditor);
			return;
		}
		const atoms = catagories.get(picked.label)!;
		const selected_atom = await this.pick(atoms.map((it) => {
			const item: QuickPickItem = {
				detail: it.name,
				label: it.no
			};
			return item;
		}), '选择一个控件编号并回车');
		if (!selected_atom) {
			return;
		}
		await this.add_snippet(all.get(selected_atom.label)!, textEditor);
	}

	private async add_snippet(atom: IAtom, textEditor: TextEditor) {
		await this.shellinstall(textEditor, atom.no);

		const imp = `import '${atom.no}';`;
		const dir = join(this.root(textEditor), 'node_modules', atom.no);
		const snippet_use = join(dir, 'use.snippet');

		if (!await this.exists(snippet_use)) {
			this.showerror('无法自动添加脚本，请联系供应商');
			return;
		}
		const use = await this.readfile(snippet_use);

		const context = textEditor.document.getText();
		if (!context.includes(imp)) {
			await textEditor.insertSnippet(new SnippetString(imp), textEditor.document.positionAt(0), {
				undoStopAfter: false,
				undoStopBefore: true
			});
			await textEditor.insertSnippet(new SnippetString(use), textEditor.selection.active.translate(1), {
				undoStopAfter: true,
				undoStopBefore: false
			});
		} else {
			await textEditor.insertSnippet(new SnippetString(use), textEditor.selection.active, {
				undoStopAfter: true,
				undoStopBefore: true
			});
		}
	}
	private remoteatoms = [] as IAtomCatagory[];
	protected async getremoteatoms(): Promise<IAtomCatagory[]> {
		if (this.remoteatoms.length === 0) {
			this.remoteatoms = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/atom-desktop/index.json');
		}
		return this.remoteatoms;
	}
	public shellcreate(_cwd: string, _no: string, _desc: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
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
						const files = await this.readdir(dir);
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
	public addservice(_p?: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public addpage(): Promise<void> {
		return new AddPageDesktop().do();
	}
	public addcomponent(editor: TextEditor): Promise<void> {
		return new AddComponentDesktop(editor).do();
	}
}

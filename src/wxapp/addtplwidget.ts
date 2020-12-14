import { basename, dirname, join, relative } from 'path';
import { FileType, QuickPickItem, SnippetString, TextEditor, Uri, workspace } from 'vscode';
import Actor from '../actor';
import { IAtom, IAtomCatagory } from '../interfaces';

export default class AddTplWidgetWx extends Actor {
	private editor: TextEditor;
	public set_editor(editor: TextEditor) {
		this.editor = editor;
		return this;
	}
	public async do(): Promise<void> {
		if (!this.remotewidgets) {
			this.remotewidgets = await this.get<IAtomCatagory[]>('https://mmstudio.gitee.io/widgets-wxapp/index.json');
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
		await this.insert_widget_snippet(this.editor, all, catagories);
	}
	private async insert_widget_snippet(editor: TextEditor, all_remote: Map<string, IAtom>, catagories_remote: Map<string, IAtom[]>) {
		const root_path = this.root(editor);
		const local_atoms = await this.load_local(root_path);
		const catagories = new Map<string, IAtom[]>();
		catagories.set('本地', local_atoms);
		catagories_remote.forEach((v, k) => {
			catagories.set(k, v);
		});
		const all = new Map<string, IAtom>();
		local_atoms.forEach((atom) => {
			all.set(atom.no, atom);
		});
		all_remote.forEach((v, k) => {
			all.set(k, v);
		});
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
			await this.add_snippet(pick, editor);
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
		await this.add_snippet(all.get(selected_atom.label)!, editor);
	}

	private async load_local(root: string) {
		try {
			const atom_dir = join(root, 'src', 'widgets');
			const atoms_dirs = await workspace.fs.readDirectory(Uri.file(atom_dir));
			return atoms_dirs.filter(([ad, type]) => {
				if (type !== FileType.Directory) {
					return false;
				}
				return ad.startsWith('pw');
			}).map(([p]) => {
				return {
					name: `项目级控件:${p}`,
					no: p,
					local: true
				} as IAtom;
			});
		} catch {
			return [];
		}
	}

	private async add_snippet(atom: IAtom, editor: TextEditor) {
		if (atom.local) {
			await this.add_local(atom, editor);
			return;
		}
		await this.shellinstall(editor, atom.no, atom.version, true);
		const root_dir = this.root(editor);
		const dir = join(root_dir, 'node_modules', atom.no);
		// update components config
		const pkg = JSON.parse(await this.readfile(join(dir, 'package.json'))) as { main?: string; miniprogram?: string; };
		const file_path = this.get_config_file_path(editor);
		const conf = await this.get_config(file_path);
		const uc = conf.usingComponents || {};
		const main = pkg.main ? pkg.main.replace('.js', '') : '';
		const path = join(atom.no, main ? main : (pkg.miniprogram ? join(pkg.miniprogram, 'index') : ''));
		// const main = join(atom.no, pkg.miniprogram ? pkg.miniprogram : '', 'index');	
		uc[atom.no.replace(/(.+\/)?/, '')] = path;
		conf.usingComponents = uc;
		await this.writefile(file_path, JSON.stringify(conf, null, '\t'));

		// insert template
		const snippet_use = join(dir, 'use.snippet');
		const use = await this.readfile(snippet_use);

		await editor.insertSnippet(new SnippetString(use), editor.selection.active, {
			undoStopAfter: true,
			undoStopBefore: true
		});
		await workspace.saveAll();
	}

	private async get_config(file_path: string) {
		return JSON.parse(await this.readfile(file_path)) as { usingComponents: { [key: string]: string; }; };
	}

	private get_config_file_path(editor: TextEditor) {
		const path = dirname(editor.document.uri.fsPath);
		if (path.includes('widgets')) {
			return join(path, 'index.json');
		}
		const name = basename(path);
		return join(path, `${name}.json`);
	}

	private async add_local(atom: IAtom, editor: TextEditor) {
		const doc = editor.document;
		const dir = join(this.root(editor), 'src', 'widgets', atom.no);
		const cur = dirname(doc.uri.fsPath);
		const widget_path = join(relative(cur, dir), 'index');

		// update components config
		const file_path = this.get_config_file_path(editor);
		const conf = await this.get_config(file_path);
		const uc = conf.usingComponents || {};
		uc[atom.no] = widget_path;
		conf.usingComponents = uc;
		await this.writefile(file_path, JSON.stringify(conf, null, '\t'));
		// insert template
		const snippet_use = join(dir, 'use.snippet');
		const use = await this.readfile(snippet_use);
		await editor.insertSnippet(new SnippetString(use), editor.selection.active, {
			undoStopAfter: true,
			undoStopBefore: true
		});
		await workspace.saveAll();
	}

	private remotewidgets = [] as IAtomCatagory[];
}

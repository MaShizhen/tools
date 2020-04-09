import { dirname, join, relative } from 'path';
import { FileType, Position, QuickPickItem, SnippetString, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { IAtom } from '../../interfaces';
import install from '../../util/install';
import root from '../../util/root';
import pickoption from '../../util/pickoption';

export default async function insert_widget_snippet(textEditor: TextEditor, all_remote: Map<string, IAtom>, catagories_remote: Map<string, IAtom[]>) {
	const root_path = await root(textEditor);
	const local_atoms = await load_local(root_path);
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

	const picked = await window.showQuickPick(selects, {
		...pickoption,
		placeHolder: '选择一个分类或直接输入控件编号并回车'
	});
	if (!picked) {
		return;
	}
	const pick = all.get(picked.label);

	if (pick) {
		await add_snippet(pick, textEditor);
		return;
	}
	const atoms = catagories.get(picked.label)!;
	const selected_atom = await window.showQuickPick(atoms.map((it) => {
		const item: QuickPickItem = {
			detail: it.name,
			label: it.no
		};
		return item;
	}), {
		...pickoption,
		placeHolder: '选择一个控件编号并回车'
	});
	if (!selected_atom) {
		return;
	}
	await add_snippet(all.get(selected_atom.label)!, textEditor);
}

async function load_local(root: string) {
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

async function add_snippet(atom: IAtom, editor: TextEditor) {
	if (atom.local) {
		await add_local(atom, editor);
		return;
	}
	await install(editor, atom.no, atom.version, true);
	const dir = join(await root(editor), 'node_modules', atom.no);
	const imp = `import '${atom.no}';`;
	const snippet_use = Uri.file(join(dir, 'use.snippet'));

	try {
		await workspace.fs.stat(snippet_use);
	} catch (error) {
		window.showErrorMessage('无法自动添加脚本，请联系供应商');
		return;
	}
	const folder = dirname(editor.document.fileName);
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	await update_import(folder, imp, editor);
	await editor.insertSnippet(new SnippetString(use), editor.selection.active, {
		undoStopAfter: true,
		undoStopBefore: true
	});
}

async function update_import(path: string, imp: string, editor: TextEditor) {
	if (/src[/|\\]widgets[/|\\]pw\d/.test(path)) {
		// import widget in index.ts
		const doc = editor.document;
		const max = doc.lineCount;
		let hasimport = false;
		let pos = -1;
		for (let i = 0; i < max; i++) {
			const line = doc.lineAt(i);
			const text = line.text;
			if (/^import\s+.+/.test(text)) {
				if (text === imp) {
					hasimport = true;
					break;
				}
				pos = i;
			}
		}
		if (!hasimport) {
			const we = new WorkspaceEdit();
			const uri = doc.uri;
			const imppos = new Position(pos + 1, 0);
			we.insert(uri, imppos, `${imp}\n`);
			await workspace.applyEdit(we);
		}
	} else {
		await update_b(path, imp);
	}
}

async function update_b(path: string, imp: string) {
	const file_name = join(path, 'b.ts');
	const uri = Uri.file(file_name);
	const doc = await workspace.openTextDocument(uri);
	const max = doc.lineCount;
	let hasimport = false;
	let pos = -1;
	for (let i = 0; i < max; i++) {
		const line = doc.lineAt(i);
		const text = line.text;
		if (text.includes('/// MM IMPWIDGETS BEGIN')) {
			pos = i;
		}
		if (/^import\s+.+/.test(text)) {
			if (text === imp) {
				hasimport = true;
				break;
			}
		}
	}
	if (!hasimport) {
		const we = new WorkspaceEdit();
		const uri = doc.uri;
		const imppos = new Position(pos + 1, 0);
		we.insert(uri, imppos, `${imp}\n`);
		await workspace.applyEdit(we);
	}
}

async function add_local(atom: IAtom, editor: TextEditor) {
	const doc = editor.document;
	const dir = join(await root(editor), 'src', 'widgets', atom.no);
	const cur = dirname(doc.uri.fsPath);
	const imp_path = relative(cur, dir);
	const imp = `import '${imp_path}/index';`;
	const snippet_use = Uri.file(join(dir, 'use.snippet'));
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	await update_import(cur, imp, editor);
	await editor.insertSnippet(new SnippetString(use), editor.selection.active, {
		undoStopAfter: true,
		undoStopBefore: true
	});
}

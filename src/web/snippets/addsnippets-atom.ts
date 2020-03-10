import { dirname, join, relative } from 'path';
import { FileType, QuickPickItem, TextEditor, Uri, window, workspace } from 'vscode';
import { IAtom } from '../../interfaces';
import atom_insert_snippet from '../../util/atom-insert-snippet';
import install from '../../util/install';
import root_path from '../../util/root';

export default async function insert_atom_snippets(textEditor: TextEditor, all_remote: Map<string, IAtom>, catagories_remote: Map<string, IAtom[]>, client: boolean) {
	const root = workspace.getWorkspaceFolder(textEditor.document.uri)!.uri.fsPath;
	const local_atoms = await load_local_atoms(root, client);
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
		canPickMany: false,
		placeHolder: '选择一个分类或直接输入原子操作编号并回车',
		matchOnDescription: true,
		matchOnDetail: true
	});
	if (!picked) {
		return;
	}
	const pick = all.get(picked.label);
	if (pick) {
		await add_snippet(pick, textEditor, client);
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
		canPickMany: false,
		placeHolder: '选择一个原子操作编号并回车',
		matchOnDescription: true,
		matchOnDetail: true
	});
	if (!selected_atom) {
		return;
	}
	await add_snippet(all.get(selected_atom.label)!, textEditor, client);
}

async function add_snippet(atom: IAtom, textEditor: TextEditor, client: boolean) {
	if (atom.local) {
		await insert_local_atom(atom, textEditor, client);
		return;
	}
	const dir = join(root_path(), 'node_modules', '@mmstudio', atom.no);
	try {
		await workspace.fs.stat(Uri.file(dir));
	} catch (error) {
		await install(`${atom.no}@${atom.version}`, client);
	}

	const name = atom.no.replace(/([a-z]+)0+(\d+)/, '$1$2');
	const imp = `import ${name} from '@mmstudio/${atom.no}';`;
	const snippet_use = Uri.file(join(dir, 'use.snippet'));

	try {
		await workspace.fs.stat(snippet_use);
	} catch (error) {
		window.showErrorMessage('无法自动添加脚本，请联系供应商');
		return;
	}
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	await atom_insert_snippet(textEditor, use, imp);
}

async function load_local_atoms(root: string, client: boolean) {
	try {
		const atom_dir = join(root, 'src', 'atom', client ? 'ac' : 'acn');
		const atoms_dirs = await workspace.fs.readDirectory(Uri.file(atom_dir));
		return atoms_dirs.filter(([ad, type]) => {
			if (type !== FileType.Directory) {
				return false;
			}
			if (client) {
				return ad.startsWith('ac');
			}
			return ad.startsWith('acn');

		}).map(([p]) => {
			return {
				name: p,
				no: p,
				local: true
			} as IAtom;
		});
	} catch {
		return [];
	}
}

async function insert_local_atom(atom: IAtom, textEditor: TextEditor, client: boolean) {
	const p = client ? 'ac' : 'acn';
	const dir = join(root_path(), 'src', 'atom', p, atom.no);
	const cur = dirname(textEditor.document.uri.fsPath);
	const imp_path = relative(cur, dir);
	const name = atom.no.replace(/([a-z]+)0+(\d+)/, '$1$2');
	const imp = `import ${name} from '${imp_path}';`;
	const snippet_use = Uri.file(join(dir, 'use.snippet'));

	try {
		await workspace.fs.stat(snippet_use);
	} catch (error) {
		window.showErrorMessage(`请先编辑'src/atom/${p}/${atom.no}/use.snippet'`);
		return;
	}
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	await atom_insert_snippet(textEditor, use, imp);
}

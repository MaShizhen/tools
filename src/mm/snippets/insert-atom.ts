import { dirname, join, relative } from 'path';
import { commands, FileType, QuickPickItem, TextEditor, Uri, window, workspace } from 'vscode';
import { IAtom, IAtomCatagory } from '../../interfaces';
import get from '../../util/get';
import prj_type, { PrjType } from '../../util/prj-type';
import install from '../../util/install';
import atom_insert_snippet from '../../util/atom-insert-snippet';
import root from '../../util/root';
import pickoption from '../../util/pickoption';

const snippets = new Map<PrjType | 'nodejs-s' | 'nodejs-na', { remote: string; snippets?: { all: Map<string, IAtom>; catagories: Map<string, IAtom[]> } }>();

snippets.set('nodejs-s', { remote: 'https://mmstudio.gitee.io/atom-nodejs/index.json' });
snippets.set('nodejs-na', { remote: 'https://mmstudio.gitee.io/atom-nodejs/index-a.json' });

snippets.set(PrjType.web, { remote: 'https://mmstudio.gitee.io/atom-web/index.json' });
snippets.set(PrjType.wxapp, { remote: 'https://mmstudio.gitee.io/atom-wxapp/index.json' });
snippets.set(PrjType.desktop, { remote: 'https://mmstudio.gitee.io/atom-desktop/index.json' });
snippets.set(PrjType.mobile, { remote: 'https://mmstudio.gitee.io/atom-mobile/index.json' });
snippets.set(PrjType.serve, snippets.get('nodejs-s')!);

export default function add() {
	return commands.registerTextEditorCommand('mm.tpl.atom', async (textEditor) => {
		const type = (() => {
			const doc = textEditor.document;
			const uri = doc.uri;
			const path = uri.path;
			// s001 na001 atom/anp001/index.ts
			if (/s\d+\.ts$/.test(path) || /atoms[/|\\]anp\d+[/|\\]index\.ts/.test(path)) {
				return 'nodejs-s';
			} else if (/na\d+\.ts$/.test(path)) {
				return 'nodejs-na';
			}
			return prj_type();
		})();
		const proj = snippets.get(type);
		if (!proj) {
			window.showErrorMessage('错误的项目类型');
			return;
		}
		if (!proj.snippets) {
			const c = new Map<string, IAtom[]>();
			const a = new Map<string, IAtom>();
			const remote_atoms = await get<IAtomCatagory[]>(proj.remote);
			remote_atoms.forEach((it) => {
				c.set(it.catagory, it.atoms);
				it.atoms.forEach((atom) => {
					a.set(atom.no, atom);
				});
			});
			proj.snippets = { all: a, catagories: c };
		}
		const { all, catagories } = proj.snippets;

		insert_atom_snippets(textEditor, all, catagories, !type.includes('nodejs'));
	});
}

async function insert_atom_snippets(textEditor: TextEditor, all_remote: Map<string, IAtom>, catagories_remote: Map<string, IAtom[]>, client: boolean) {
	const root_path = await root(textEditor);
	const local_atoms = await load_local_atoms(root_path, client);
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
		placeHolder: '选择一个分类或直接输入原子操作编号并回车'
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
		...pickoption,
		placeHolder: '选择一个原子操作编号并回车'
	});
	if (!selected_atom) {
		return;
	}
	await add_snippet(all.get(selected_atom.label)!, textEditor, client);
}

async function add_snippet(atom: IAtom, textEditor: TextEditor, client: boolean) {
	if (atom.local) {
		await insert_local_atom(atom, textEditor);
		return;
	}
	await install(textEditor, atom.no, atom.version, client);

	const name = atom.no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3');
	const imp = `import ${name} from '${atom.no}';`;
	const dir = join(await root(textEditor), 'node_modules', atom.no);
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
		const atom_dir = join(root, 'src', 'atoms');
		const atoms_dirs = await workspace.fs.readDirectory(Uri.file(atom_dir));
		return atoms_dirs.filter(([ad, type]) => {
			if (type !== FileType.Directory) {
				return false;
			}
			return ad.startsWith(client ? 'ap' : 'anp');
		}).map(([p]) => {
			return {
				name: `项目级原子操作:${p}`,
				no: p,
				local: true
			} as IAtom;
		});
	} catch {
		return [];
	}
}

async function insert_local_atom(atom: IAtom, editor: TextEditor) {
	const dir = join(await root(editor), 'src', 'atoms', atom.no);
	const cur = dirname(editor.document.uri.fsPath);
	const imp_path = relative(cur, dir);
	const name = atom.no.replace(/(@.+\/)?([a-z]+)0+(\d+)/, '$2$3');
	const imp = `import ${name} from '${imp_path}/index';`;
	const snippet_use = Uri.file(join(dir, 'use.snippet'));

	try {
		await workspace.fs.stat(snippet_use);
	} catch (error) {
		window.showErrorMessage(`请先编辑'src/atom/${atom.no}/use.snippet'`);
		return;
	}
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	await atom_insert_snippet(editor, use, imp);
}

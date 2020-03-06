import { join } from 'path';
import { QuickPickItem, TextEditor, Uri, window, workspace } from 'vscode';
import { IAtom } from '../../interfaces';
import atom_insert_snippet from '../../util/atom-insert-snippet';
import install from '../../util/install';
import root_path from '../../util/root';

export default async function add(textEditor: TextEditor, all: Map<string, IAtom>, catagories: Map<string, IAtom[]>, dev: boolean) {
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
		placeHolder: '选择一个分类或直接输入原子操作编号并回车'
	});
	if (!picked) {
		return;
	}
	const pick = all.get(picked.label);
	if (pick) {
		await add_snippet(pick, textEditor, dev);
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
		placeHolder: '选择一个原子操作编号并回车'
	});
	if (!selected_atom) {
		return;
	}
	await add_snippet(all.get(selected_atom.label)!, textEditor, dev);
}

async function add_snippet(atom: IAtom, textEditor: TextEditor, dev: boolean) {
	const dir = join(root_path(), 'node_modules', '@mmstudio', atom.no);
	try {
		await workspace.fs.stat(Uri.file(dir));
	} catch (error) {
		await install(`${atom.no}@${atom.version}`, dev);
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

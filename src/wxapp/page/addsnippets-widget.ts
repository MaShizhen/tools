import { basename, dirname, join } from 'path';
import { QuickPickItem, SnippetString, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { IAtom } from '../../interfaces';
import install from '../../util/install';
import root_path from '../../util/root';
import { createfile } from '../../util/fs';
import pickoption from '../../util/pickoption';

export default async function add(textEditor: TextEditor, all: Map<string, IAtom>, catagories: Map<string, IAtom[]>) {
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

async function add_snippet(atom: IAtom, textEditor: TextEditor) {
	await install(textEditor, atom.no, atom.version, true);
	const dir = join(await root_path(textEditor), 'node_modules', atom.no);
	const folder = dirname(textEditor.document.uri.fsPath);
	await update_app_components(folder, atom.no);
	textEditor = await window.showTextDocument(textEditor.document);
	const snippet_use = Uri.file(join(dir, 'use.snippet'));
	try {
		await workspace.fs.stat(snippet_use);
	} catch (error) {
		window.showErrorMessage('无法自动添加脚本，请联系供应商');
		return;
	}
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	await textEditor.insertSnippet(new SnippetString(use), textEditor.selection.active, {
		undoStopAfter: true,
		undoStopBefore: true
	});
}

async function update_app_components(path: string, atom: string) {
	const name = basename(path);
	const file_name = join(path, `${name}.json`);
	const uri = Uri.file(file_name);
	const we = new WorkspaceEdit();
	if (we.has(uri) === false) {
		createfile(we, file_name, JSON.stringify({}, null, '\t'));
		await workspace.applyEdit(we);
	}
	const editor = await window.showTextDocument(uri);
	const doc = editor.document;
	const conf = JSON.parse(doc.getText());
	const uc = conf.usingComponents || {};
	uc[atom.replace(/(.+\/)?/, '')] = `${atom}/index`;
	conf.usingComponents = uc;
	createfile(we, doc.fileName, JSON.stringify(conf, null, '\t'));
	workspace.applyEdit(we);
	await doc.save();
}

import { join } from 'path';
import { QuickPickItem, SnippetString, TextEditor, Uri, window, workspace } from 'vscode';
import { IAtom } from '../../interfaces';
import install from '../../util/install';
import replace from '../../util/replace';
import root_path from '../../util/root';

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
		canPickMany: false,
		matchOnDescription: true,
		matchOnDetail: true,
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
		canPickMany: false,
		placeHolder: '选择一个控件编号并回车'
	});
	if (!selected_atom) {
		return;
	}
	await add_snippet(all.get(selected_atom.label)!, textEditor);
}

async function add_snippet(atom: IAtom, textEditor: TextEditor) {
	const dir = join(root_path(), 'node_modules', '@mmstudio', atom.no);
	try {
		await workspace.fs.stat(Uri.file(dir));
	} catch (error) {
		await install(`${atom.no}@${atom.version}`, true);
	}
	const imp = `import '@mmstudio/${atom.no}';`;
	const snippet_use = Uri.file(join(dir, 'use.snippet'));

	try {
		await workspace.fs.stat(snippet_use);
	} catch (error) {
		window.showErrorMessage('无法自动添加脚本，请联系供应商');
		return;
	}
	const [, tmp_dir] = /[/\\](src[/\\]\w[\w\d-]*[/\\](zj-\d{3,6}))[/\\]?/.exec(textEditor.document.fileName)!;
	const folder = join(workspace.getWorkspaceFolder(textEditor.document.uri)!.uri.fsPath, tmp_dir);
	const use = Buffer.from(await workspace.fs.readFile(snippet_use)).toString('utf8');

	if (await update_b(folder, imp)) {
		textEditor = await window.showTextDocument(textEditor.document);
	}
	await textEditor.insertSnippet(new SnippetString(use), textEditor.selection.active, {
		undoStopAfter: true,
		undoStopBefore: true
	});
}

async function update_b(path: string, imp: string) {
	const file_name = join(path, 'b.ts');
	const uri = Uri.file(file_name);
	const context = Buffer.from(await workspace.fs.readFile(uri)).toString('utf8');
	if (context.includes(imp)) {
		return false;
	}
	const editor = await window.showTextDocument(uri);
	const doc = editor.document;
	const names = imp.match(/import ['"]@mmstudio\/(w|h|wh)\d{6}['"];/g)!;
	const imps = new Set<string>();
	names.forEach((item) => {
		imps.add(item);
	});
	for (let i = 0; i < doc.lineCount; i++) {
		const text = doc.lineAt(i).text;
		if (/import ['"]@mmstudio\/(w|h|wh)\d{6}['"];/.exec(text)) {
			imps.add(text);
		}
	}
	const imports = Array.from(imps).sort((a, b) => {
		if (a === b) {
			return 0;
		}
		return a > b ? 1 : -1;
	});
	await replace(editor, 'IMPWIDGETS', `${imports.join('\n')}`);
	return true;
}

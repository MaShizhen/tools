import { join, parse } from 'path';
import { commands, Position, QuickPickItem, Range, SnippetString, TextEditor, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import check_file from '../../util/check-file';
import filter from '../../util/filter';
import foreach from '../../util/foreach';
import get from '../../util/get';
import get_text from '../../util/get-text';
import root_path from '../../util/root';
import exec from '../../util/exec';
import prj_type, { PrjType } from '../../util/prj-type';

const snippets = new Map<PrjType | 'nodejs', { remote: string; snippets?: { all: Map<string, IAtom>; catagories: Map<string, IAtom[]> } }>();
snippets.set('nodejs', { remote: 'https://mm-edu.gitee.io/templates/nodejs.json' });

snippets.set(PrjType.web, { remote: 'https://mm-edu.gitee.io/templates/web.json' });
snippets.set(PrjType.wxapp, { remote: 'https://mm-edu.gitee.io/templates/wxapp.json' });
snippets.set(PrjType.desktop, { remote: 'https://mm-edu.gitee.io/templates/desktop.json' });
snippets.set(PrjType.mobile, { remote: 'https://mm-edu.gitee.io/templates/mobile.json' });

interface IAtomBase {
	name: string;
	no: string;
}
interface IAtomSingle extends IAtomBase {
	type?: 'single';
	context: string;
}

interface IAtomMultipleAbsolute extends IAtomBase {
	type: 'multiple-absolute';
	files: string[];
	contexts: { [url: string]: string; };
}

interface IAtomMultipleRelative extends IAtomBase {
	type: 'multiple-relative';
	files: string[];
	contexts: { [url: string]: string; };
}

type IAtomMultiple = IAtomMultipleAbsolute | IAtomMultipleRelative;

type IAtom = IAtomSingle | IAtomMultiple;

interface IAtomCatagory {
	catagory: string;
	atoms: IAtom[];
}

export default function add() {
	return commands.registerTextEditorCommand('mm.tpl.tpl', async (textEditor, _edit) => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = (() => {
			if (/s\d+\.ts/.test(textEditor.document.uri.path)) {
				return 'nodejs';
			}
			return prj_type();
		})();
		const proj = snippets.get(type);
		if (!proj) {
			window.showErrorMessage('错误的项目类型');
			return;
		}
		if (proj.snippets) {
			const atoms = await get<IAtomCatagory[]>(proj.remote);
			const m_all = new Map<string, IAtom>();
			const m_catagories = new Map<string, IAtom[]>();
			atoms.forEach((it) => {
				m_catagories.set(it.catagory, it.atoms);
				it.atoms.forEach((atom) => {
					m_all.set(atom.no, atom);
				});
			});
			proj.snippets = { all: m_all, catagories: m_catagories };
		}
		const { all, catagories } = proj.snippets!;

		const selects = Array.from(catagories.keys()).map((catagory) => {
			const item: QuickPickItem = {
				label: catagory
			};
			return item;
		}).concat(Array.from(all.values()).map((atom) => {
			all.set(atom.no, atom);
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
			placeHolder: '选择模板'
		});
		if (!picked) {
			return;
		}
		const pick = picked.label;
		if (/\d{6}/.test(pick)) {
			await add_snippet(type, all.get(pick)!, textEditor);
		}
		const catagory = catagories.get(pick)!;
		const selected_atom = await window.showQuickPick(catagory.map((it) => {
			const item: QuickPickItem = {
				detail: it.name,
				label: it.no
			};
			return item;
		}), {
			canPickMany: false,
			matchOnDescription: true,
			matchOnDetail: true
		});
		if (!selected_atom) {
			return;
		}
		await add_snippet(type, all.get(selected_atom.label)!, textEditor);
	});
}

async function add_snippet(type: string, atom: IAtomSingle | IAtomMultiple, textEditor: TextEditor) {
	if (!atom) {
		console.error('Could not get atom.');
		return;
	}
	if (atom.type === 'multiple-absolute') {
		await add_snippet_multiple(type, atom, false);
	} else if (atom.type === 'multiple-relative') {
		await add_snippet_multiple(type, atom, true);
	} else {
		await add_snippet_single(type, atom, textEditor);
	}
}

async function add_snippet_multiple(type: string, atom: IAtomMultiple, isrelative: boolean) {
	const base_url = `https://mm-edu.gitee.io/templates/${type}/${atom.no}`;
	const contexts = atom.contexts || {};
	const dir = isrelative ? parse(window.activeTextEditor!.document.uri.fsPath).dir : workspace.workspaceFolders![0].uri.fsPath;
	await foreach(atom.files, async (file) => {
		const url = join(base_url, file);
		let context = contexts.url;
		if (context === undefined || context === null) {
			context = contexts.url = await get_text(url);
		}
		const workspace_edit = new WorkspaceEdit();
		const uri = Uri.file(join(dir, file));
		// await workspace.applyEdit(workspace_edit);
		// 目前vscode版本1.39.1多次操作会有异常 see https://github.com/microsoft/vscode/issues/56986
		// workspace_edit.deleteFile(uri, {
		// 	ignoreIfNotExists: true,
		// 	recursive: true
		// });
		workspace_edit.createFile(uri, {
			ignoreIfExists: true	// vscode1.39.1使用overwrite第二次操作时会有异常
		});
		workspace_edit.replace(uri, new Range(new Position(0, 0), new Position(99999999999, 99999999999)), context);
		await workspace.applyEdit(workspace_edit);
		// await workspace.openTextDocument(uri);
		// await commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
	await workspace.saveAll(false);
	atom.contexts = contexts;
}

async function add_snippet_single(type: string, atom: IAtomSingle, textEditor: TextEditor) {
	const url = `https://mm-edu.gitee.io/templates/${type}/${atom.no}.snippet`;
	let snippet = atom.context;
	if (snippet === undefined || snippet === null) {
		snippet = atom.context = await get_text(url);
	}
	const context = textEditor.document.getText();
	const codes = snippet.split('\n');
	const imps = codes.filter((it) => {
		return /^\s*import.+from\s+.*;\s*$/.test(it) && !context.includes(it);
	});
	const use = codes.filter((it) => {
		return !/^\s*import.+from\s+.*;\s*$/.test(it);
	}).join('\n');

	const tmp_imps = codes.filter((it) => {
		return /^\s*import.+from\s+.*;\s*$/.test(it);
	});

	const tmp_atoms = await filter(tmp_imps, async (item) => {
		const match_str = /['"][\w\d]+['"]/.exec(item)![0].replace(/['"']/g, '');
		const dir_atom = join(root_path(), 'node_modules', match_str);
		try {
			await workspace.fs.stat(Uri.file(dir_atom));
			return false;
		} catch (error) {
			window.showErrorMessage('原子操作依赖未安装，即将自动安装依赖');
			return true;
		}
	});

	if (tmp_atoms.toString()) {
		install(tmp_atoms);
	}

	await textEditor.insertSnippet(new SnippetString(use), textEditor.selection.active, {
		undoStopAfter: false,
		undoStopBefore: true
	});
	await Promise.all(imps.map((imp) => {
		return textEditor.insertSnippet(new SnippetString(`${imp}\n`), textEditor.document.positionAt(0), {
			undoStopAfter: true,
			undoStopBefore: false
		});
	}));
}

async function install(atoms: string[]) {
	if (!atoms || atoms.length === 0) {
		return;
	}
	const command = `yarn add --dev ${atoms.join(' ')}`;
	const p = exec(command, root_path());
	window.setStatusBarMessage('正在安装依赖', p);
	await p;
	window.setStatusBarMessage('成功安装依赖');
}

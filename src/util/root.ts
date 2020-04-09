import { join } from 'path';
import { TextEditor, window, workspace } from 'vscode';
import { existsasync } from './fs';

export default async function root(editor?: TextEditor) {
	editor = editor || window.activeTextEditor;
	const wf = (() => {
		if (!editor) {
			const wfs = workspace.workspaceFolders;
			if (!wfs || wfs.length === 0) {
				return null;
			}
			return wfs[0];
		}
		return workspace.getWorkspaceFolder(editor.document.uri);
	})();
	if (!wf) {
		window.showErrorMessage('请打开工程进行操作');
		throw new Error('请打开工程进行操作');
	}
	const dir = wf.uri.fsPath;
	if (!await existsasync(join(dir, 'package.json'))) {
		window.showErrorMessage('错误的目录');
		throw new Error('错误的目录');
	}
	return dir;
}

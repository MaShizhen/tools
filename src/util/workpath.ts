import { homedir } from 'os';
import { window, workspace } from 'vscode';

export default function workpath() {
	const editor = window.activeTextEditor;
	const wf = (() => {
		if (editor) {
			const w = workspace.getWorkspaceFolder(editor.document.uri);
			if (w) {
				return w;
			}
		}

		const wfs = workspace.workspaceFolders;
		if (!wfs || wfs.length === 0) {
			return null;
		}
		return wfs[0];
	})();
	if (!wf) {
		return homedir();
	}
	const dir = wf.uri.fsPath;
	return dir;
}

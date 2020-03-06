import { dirname } from 'path';
import { homedir } from 'os';
import { workspace } from 'vscode';

export default function workpath() {
	return (() => {
		const projs = workspace.workspaceFolders;
		if (projs && projs.length > 0) {
			return dirname(projs[0].uri.fsPath);
		}
		return homedir();
	})();
}

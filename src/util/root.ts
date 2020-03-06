import { workspace } from 'vscode';

export default function root() {
	return workspace.workspaceFolders![0].uri.fsPath;
}

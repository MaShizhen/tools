import { commands, window, workspace } from 'vscode';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/component/addp';

export default function add() {
	const type = workspace.getConfiguration().get('mmproj.type');
	return commands.registerTextEditorCommand('mmpresentation.add', async (editor) => {
		if (type === 'web/h5') {
			const rootPath = root_path();
			if (!await check_file(rootPath)) {
				return;
			}
			await web(editor);
			commands.executeCommand('workbench.files.action.refreshFilesExplorer');
		} else {
			window.showErrorMessage('该操作只支持web项目');
		}
	});
}


import { commands, window } from 'vscode';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/component/add-tpl';
import prj_type, { PrjType } from '../util/prj-type';

export default function add() {
	const type = prj_type();
	return commands.registerTextEditorCommand('mm.presentation.add', async (editor) => {
		if (type === PrjType.web) {
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


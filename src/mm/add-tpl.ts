import { commands, window } from 'vscode';
import web from '../web/component/add-tpl';
import prj_type, { PrjType } from '../util/prj-type';

export default function add() {
	const type = prj_type();
	return commands.registerTextEditorCommand('mm.presentation.add', async (editor) => {
		if (type === PrjType.web) {
			await web(editor);
			commands.executeCommand('workbench.files.action.refreshFilesExplorer');
		} else {
			window.showErrorMessage('该操作只支持web项目');
		}
	});
}

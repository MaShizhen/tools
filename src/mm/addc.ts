import { commands, window, workspace } from 'vscode';
import desktop from '../desktop/component/addc';
import mobile from '../mobile/page/addpage';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/component/addc';

export default function add() {
	return commands.registerTextEditorCommand('mmcomponent.add', async (editor) => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = workspace.getConfiguration().get('mmproj.type');
		switch (type) {
			case 'web/h5':
				await web(editor);
				break;
			case 'wxapp':
				window.showErrorMessage('不能在wxapp项目中进行该操作!');
				break;
			case 'desktop':
				await desktop(editor);
				break;
			case 'mobile':
				await mobile(rootPath);
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}


import { commands, workspace } from 'vscode';
import desktop from '../desktop/page/addpage';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/page/addpage';
import wxapp from '../wxapp/page/addpage';

export default function add() {
	return commands.registerCommand('mmpage.add', async () => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = workspace.getConfiguration().get('mmproj.type');
		switch (type) {
			case 'web/h5':
				await web(rootPath);
				break;
			case 'wxapp':
				await wxapp(rootPath);
				break;
			case 'desktop':
				await desktop(rootPath);
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}

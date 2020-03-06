import { commands, workspace } from 'vscode';
import desktop from '../../desktop/shell/build';
import mobile from '../../mobile/shell/build';
import check_file from '../../util/check-file';
import web from '../../web/shell/build';
import wxapp from '../../wxapp/shell/build';

export default function add() {
	return commands.registerCommand('mmshell.build', async () => {
		const rootPath = workspace.workspaceFolders![0].uri.fsPath;
		if (!await check_file(rootPath)) {
			return;
		}
		const type = workspace.getConfiguration().get('mmproj.type');
		switch (type) {
			case 'web/h5':
				web();
				break;
			case 'wxapp':
				wxapp();
				break;
			case 'desktop':
				desktop();
				break;
			case 'mobile':
				mobile();
				break;
		}
	});
}

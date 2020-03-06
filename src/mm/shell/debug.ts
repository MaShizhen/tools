import { commands, workspace } from 'vscode';
import desktop from '../../desktop/shell/debug';
import mobile from '../../mobile/shell/debug';
import check_file from '../../util/check-file';
import root_path from '../../util/root';
import web from '../../web/shell/debug';
import wxapp from '../../wxapp/shell/debug';

export default function add() {
	return commands.registerCommand('mmshell.debug', async () => {
		const rootPath = root_path();
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

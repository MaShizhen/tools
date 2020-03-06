import { commands, workspace } from 'vscode';
import desktop from '../../desktop/shell/build';
import mobile from '../../mobile/shell/build';
import check_file from '../../util/check-file';
import web from '../../web/shell/build';
import wxapp from '../../wxapp/shell/build';
import prj_type, { PrjType } from '../../util/prj-type';

export default function add() {
	return commands.registerCommand('mm.shell.build', async () => {
		const rootPath = workspace.workspaceFolders![0].uri.fsPath;
		if (!await check_file(rootPath)) {
			return;
		}
		const type = prj_type();
		switch (type) {
			case PrjType.web:
				web();
				break;
			case PrjType.wxapp:
				wxapp();
				break;
			case PrjType.desktop:
				desktop();
				break;
			case PrjType.mobile:
				mobile();
				break;
		}
	});
}

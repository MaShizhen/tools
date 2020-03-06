import { commands } from 'vscode';
import desktop from '../../desktop/shell/debug';
import mobile from '../../mobile/shell/debug';
import check_file from '../../util/check-file';
import root_path from '../../util/root';
import web from '../../web/shell/debug';
import wxapp from '../../wxapp/shell/debug';
import prj_type, { PrjType } from '../../util/prj-type';

export default function add() {
	return commands.registerCommand('mm.shell.debug', async () => {
		const rootPath = root_path();
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

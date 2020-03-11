import { commands } from 'vscode';
import desktop from '../../desktop/shell/build';
import mobile from '../../mobile/shell/build';
import web from '../../web/shell/build';
import wxapp from '../../wxapp/shell/build';
import prj_type, { PrjType } from '../../util/prj-type';

export default function add() {
	return commands.registerCommand('mm.shell.build', async () => {
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

import { commands } from 'vscode';
import desktop from '../desktop/page/addpage';
import root_path from '../util/root';
import web from '../web/page/addpage';
import wxapp from '../wxapp/page/addpage';
import mobile from '../mobile/page/addpage';
import prj_type, { PrjType } from '../util/prj-type';

export default function add() {
	return commands.registerCommand('mm.page.add', async () => {
		const rootPath = await root_path();
		const type = prj_type();
		switch (type) {
			case PrjType.web:
				await web(rootPath);
				break;
			case PrjType.wxapp:
				await wxapp(rootPath);
				break;
			case PrjType.desktop:
				await desktop(rootPath);
				break;
			case PrjType.mobile:
				await mobile(rootPath);
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}

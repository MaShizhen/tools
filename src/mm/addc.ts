import { commands } from 'vscode';
import desktop from '../desktop/component/addc';
import mobile from '../mobile/page/addpage';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/component/addc';
import prj_type, { PrjType } from '../util/prj-type';
import wxapp from '../wxapp/page/addpage';

export default function add() {
	return commands.registerTextEditorCommand('mm.component.add', async (editor) => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = prj_type();
		switch (type) {
			case PrjType.web:
				await web(editor);
				break;
			case PrjType.wxapp:
				await wxapp(rootPath);
				break;
			case PrjType.desktop:
				await desktop(editor);
				break;
			case PrjType.mobile:
				await mobile(rootPath);
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}


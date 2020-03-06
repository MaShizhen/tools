import { commands, window } from 'vscode';
import desktop from '../desktop/component/addc';
import mobile from '../mobile/page/addpage';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/component/addc';
import prj_type, { PrjType } from '../util/prj-type';

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
				window.showErrorMessage('不能在wxapp项目中进行该操作!');
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


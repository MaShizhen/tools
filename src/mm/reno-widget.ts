import { commands } from 'vscode';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web from '../web/widget/add';
import prj_type, { PrjType } from '../util/prj-type';

export default function add() {
	return commands.registerTextEditorCommand('mm.widget.reno', async () => {
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
				break;
			case PrjType.desktop:
				break;
			case PrjType.mobile:
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}


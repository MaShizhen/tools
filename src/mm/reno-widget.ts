import { commands } from 'vscode';
import web from '../web/widget/add';
import prj_type, { PrjType } from '../util/prj-type';

export default function add() {
	return commands.registerTextEditorCommand('mm.widget.reno', async () => {
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


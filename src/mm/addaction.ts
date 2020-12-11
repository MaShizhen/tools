import { parse } from 'path';
import { commands, window } from 'vscode';
import desktop_c from '../desktop/component/addaction';
import desktop_p from '../desktop/page/addaction';
import wxapp from '../wxapp/page/addaction';
import prj_type, { PrjType } from '../util/prj-type';
import reg_in_comment from '../util/reg-in-component';

export default function addaction() {
	return commands.registerTextEditorCommand('mm.action.add', async (editor) => {
		const type = prj_type();
		const path = editor.document.fileName;
		const fileName = parse(path).base;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = reg_in_comment(path);
		switch (type) {
			case PrjType.web:
				break;
			case PrjType.wxapp:
				if (r) {
					window.showErrorMessage('不能在wxapp项目中进行该操作!');
				} else {
					await wxapp(editor);
				}
				break;
			case PrjType.desktop:
				if (r) {
					if (fileName === 'n.ts') {
						window.showErrorMessage('不能在desktop项目中添加服务端响应!');
					} else {
						await desktop_c(editor);
					}
				} else {
					await desktop_p(editor);
				}
				break;
			case PrjType.mobile:
				break;
			default:
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}


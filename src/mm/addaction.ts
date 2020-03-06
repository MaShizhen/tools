import { parse } from 'path';
import { commands, window, workspace } from 'vscode';
import desktop_c from '../desktop/component/addaction';
import desktop_p from '../desktop/page/addaction';
import mobile from '../mobile/page/addaction';
import check_file from '../util/check-file';
import root_path from '../util/root';
import web_c_a from '../web/component/addaction';
import web_c_na from '../web/component/addna';
import web_p_a from '../web/page/addaction';
import web_p_na from '../web/page/addna';
import wxapp from '../wxapp/page/addaction';

export default function add() {
	return commands.registerTextEditorCommand('mmaction.add', async (editor) => {
		const rootPath = root_path();
		if (!await check_file(rootPath)) {
			return;
		}
		const type = workspace.getConfiguration().get('mmproj.type');
		const path = editor.document.fileName;
		const fileName = parse(path).base;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = /[/\\](src[/\\]\w[\w\d-]*[/\\](zj-\d{3,6}))[/\\]?/.exec(path);
		switch (type) {
			case 'web/h5':
				if (r) {
					if (fileName === 'n.ts') {
						await web_c_na(editor);
					} else {
						await web_c_a(editor);
					}
				} else if (fileName === 'n.ts') {
					await web_p_na(editor);
				} else {
					await web_p_a(editor);
				}
				break;
			case 'wxapp':
				if (r) {
					window.showErrorMessage('不能在wxapp项目中进行该操作!');
				} else {
					await wxapp(editor);
				}
				break;
			case 'desktop':
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
			case 'mobile':
				if (r) {
					window.showErrorMessage('不能在mobile项目中进行该操作!');
				} else {
					await mobile(editor);
				}
				break;
		}
		commands.executeCommand('workbench.files.action.refreshFilesExplorer');
	});
}


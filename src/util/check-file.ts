import { join } from 'path';
import { window } from 'vscode';
import { existsSync } from './fs';

export default async function check_file(root: string) {
	if (!await existsSync(join(root, 'package.json'))) {
		window.showErrorMessage('不能打开多个项目进行该操作');
		return false;
	}
	return true;

}

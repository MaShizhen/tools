import { TextEditor, window } from 'vscode';
import exec from './exec';
import root_path from './root';

export default async function install(editor: TextEditor, atom: string, isdev: boolean) {
	if (!atom) {
		return;
	}
	const yarn = isdev ? 'yarn add --dev' : 'yarn add';
	const msg_install = `正在安装依赖: ${atom}`;
	const command = `${yarn} @mmstudio/${atom}`;
	const p = exec(command, await root_path(editor));
	window.setStatusBarMessage(msg_install, p);
	await p;
	const msg_installed = `成功安装: ${atom}`;
	window.setStatusBarMessage(msg_installed);
}

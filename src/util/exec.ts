import { exec as node_exec } from 'child_process';
import { platform } from 'os';
import { window, workspace } from 'vscode';

function get_shell() {
	const shell = workspace.getConfiguration('terminal.integrated.shell');
	switch (platform()) {
		case 'darwin':
			return shell.get<string>('osx');
		case 'win32':
			return shell.get<string>('windows');
		case 'linux':
		default:
			return shell.get<string>('linux');
	}
}

export default function exec(cmd: string, cwd?: string) {
	return new Promise<string>((resolve, reject) => {
		// Fix "stdout maxBuffer exceeded" error
		// See https://github.com/DefinitelyTyped/DefinitelyTyped/pull/26545#issuecomment-402274021
		const maxBuffer = 1024 * 1024 * 1024; // Max = 1 MiB, default is 200 KiB

		const handler = window.setStatusBarMessage(`running ${cmd}`);

		node_exec(cmd, {
			cwd,
			encoding: 'utf8',
			maxBuffer,
			shell: get_shell()
		}, (error, stdout, stderr) => {
			handler.dispose();
			if (error === null) {
				resolve(stdout.trim());
			} else {
				reject(new Error(stderr.trim()));
			}
		});
	});
}

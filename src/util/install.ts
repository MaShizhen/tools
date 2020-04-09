import { join } from 'path';
import { TextEditor, Uri, window, workspace } from 'vscode';
import exec from './exec';
import root from './root';
import { existsasync } from './fs';

export default async function install(editor: TextEditor, atom: string, version: string, isdev: boolean) {
	if (!atom) {
		return;
	}
	if (!version || version === '*') {
		version = 'latest';
	}
	const cwd = await root(editor);
	const dir = join(cwd, 'node_modules', atom);
	if (await existsasync(dir)) {
		return;
	}
	const yarn = isdev ? 'yarn add --dev' : 'yarn add';
	const package_name = `${atom}@${version}`;
	const msg_install = `正在安装依赖: ${package_name}`;
	const command = `${yarn} ${package_name}`;
	const p = exec(command, cwd);
	window.setStatusBarMessage(msg_install, p);
	await p;
	const msg_installed = `成功安装: ${package_name}`;
	window.setStatusBarMessage(msg_installed);

	const filename = Uri.file(join(dir, 'package.json'));
	const pkg = JSON.parse(Buffer.from(await workspace.fs.readFile(filename)).toString('utf8')) as { peerDependencies: { [name: string]: string; } };
	const dep = pkg.peerDependencies;
	if (dep) {
		await Promise.all(Object.keys(dep).map(async (name) => {
			const ver = dep[name];
			await install(editor, name, ver, isdev);
		}));
	}
}

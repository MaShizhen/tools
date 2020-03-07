import { commands, window } from 'vscode';
import nodejs from '../nodejs/atom/reno';
import web from '../web/atom/reno';
import atom_type, { AtomType } from '../util/atom-type';

export default function add() {
	return commands.registerCommand('mm.atom.reno', async () => {
		const type = atom_type();
		switch (type) {
			case AtomType.node:
				await nodejs();
				break;
			case AtomType.web:
				await web();
				break;
			default:
				window.showErrorMessage('不支持的原子操作类型');
				break;
		}
	});
}

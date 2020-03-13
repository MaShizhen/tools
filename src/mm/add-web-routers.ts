import { commands } from 'vscode';
import addrouter from './router/addrouter';

export default function addwebrouters() {
	return commands.registerCommand('mm.service.router', () => {
		addrouter('routers');
	});
}

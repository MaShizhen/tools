import { commands } from 'vscode';
import addrouter from './router/addrouter';

export default function addwebfilter() {
	return commands.registerCommand('mm.service.filter', () => {
		addrouter('filters');
	});
}

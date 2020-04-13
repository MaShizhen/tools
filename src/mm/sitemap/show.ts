import { join } from 'path';
import { commands, Uri, window } from 'vscode';
import root from '../../util/root';

export default function showsitemap() {
	return commands.registerCommand('mm.showmap', async () => {
		try {
			const file = join(await root(), '.mm.md');
			await window.showTextDocument(Uri.file(file));
			await commands.executeCommand('markdown.showPreview');
		} catch {
			await commands.executeCommand('mm.refreshmap');
		}
	});
}

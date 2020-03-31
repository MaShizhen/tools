import { window } from 'vscode';

export default function run(command: string, name: string) {
	const named_ternimal = window.terminals.find((t) => {
		return t.name === name;
	});
	if (named_ternimal) {
		named_ternimal.dispose();
	}
	const terminal = window.createTerminal(name);
	terminal.show();
	terminal.sendText(command);
}

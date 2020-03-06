import { window } from 'vscode';

export default function run(command: string, name: string) {
	const terminal = (() => {
		const named_ternimal = window.terminals.find((t) => {
			return t.name === name;
		});
		if (named_ternimal) {
			return named_ternimal;
		} 
			return window.createTerminal(name);
		
	})();
	terminal.show();
	terminal.sendText(command);
}

import { promises } from 'fs';
import { join, parse } from 'path';
import { CompletionItem, CompletionItemKind, languages, Position, TextDocument } from 'vscode';
// import { languages } from 'vscode';
// import * as vscode from 'vscode';

const { readdir } = promises;

export default function list_services() {
	return languages.registerCompletionItemProvider(
		'typescript',
		{
			async provideCompletionItems(document: TextDocument, position: Position) {
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (!/aw17<.*>\(['|"]$/.test(linePrefix) && !/const service_name = ['|"]$/.test(linePrefix)) {
					return undefined;
				}
				const dir = parse(document.fileName).dir;

				const files = await readdir(dir);
				return files.filter((it) => {
					return /s\d+.ts$/.test(it);
				}).map((it) => {
					const full = join(dir, it);
					return new CompletionItem(full.replace(/\\/g, '/').replace(/.*src\/(.*)\.ts/, '$1'), CompletionItemKind.File);
				});
			}
		},
		'\'',
		'"'
	);
}

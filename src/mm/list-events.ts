import { promises } from 'fs';
import { parse } from 'path';
import { CompletionItem, CompletionItemKind, languages, Position, TextDocument } from 'vscode';
import desktop from '../desktop/list-events';
import mobile from '../mobile/list-events';
import web from '../web/list-events';
import wxapp from '../wxapp/list-events';
import prj_type, { PrjType } from '../util/prj-type';

const { readdir } = promises;

export default function add() {
	const events = (() => {
		const type = prj_type();
		switch (type) {
			case PrjType.web:
				return web;
			case PrjType.wxapp:
				return wxapp;
			case PrjType.desktop:
				return desktop;
			case PrjType.mobile:
				return mobile;
			default:
				return [];
		}
	})();
	return languages.registerCompletionItemProvider(
		'typescript',
		{
			async provideCompletionItems(document: TextDocument, position: Position) {
				if (!/[\\|/]n?s\.ts$/.test(document.fileName)) {
					return undefined;
				}
				const linePrefix = document.lineAt(position).text.substr(0, position.character);
				if (linePrefix.includes(':')) {
					const dir = parse(document.fileName).dir;
					const files = await readdir(dir);
					const reg = /[\\|/]ns\.ts$/.test(document.fileName) ? /^na\d+.ts$/ : /^a\d+.ts$/;
					return files.filter((it) => {
						return reg.test(it);
					}).map((it) => {
						return new CompletionItem(it.replace('.ts', ''), CompletionItemKind.File);
					});
				}
				return events.map((event) => {
					return new CompletionItem(event, CompletionItemKind.Enum);
				});

			}
		},
		'\'',
		'"'
	);
}

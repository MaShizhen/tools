import { basename, join } from 'path';
import { Position, TextEditor, window } from 'vscode';
import Actor from '../actor';

export default class AddComponentTaro extends Actor {
	public async do(editor: TextEditor): Promise<void> {
		const dir = await this.getcurpath(editor.document.fileName, join(this.root(), 'src', 'components'));
		const doc = editor.document;
		const name = await this.generate(dir, 'c', 3);
		const f = await window.showInputBox({
			prompt: 'type path',
			placeHolder: 'component path',
			value: join(dir, name)
		});
		if (!f) {
			return;
		}
		const filepath = f.toLowerCase();
		const fullpath = `${filepath}.tsx`;
		const filename = basename(filepath);
		await this.createcss(`${filepath}.css`);
		const cname = this.str2name(filename);
		const content = await (async () => {
			if (/\.tsx/.test(doc.fileName)) {
				const sel = editor.selection;
				const content = sel.isEmpty ? '<Text></Text>' : doc.getText(sel);
				const max = doc.lineCount;
				let pos = -1;
				for (let i = 0; i < max; i++) {
					const line = doc.lineAt(i);
					const text = line.text;
					if (/^import\s+.+/.test(text)) {
						pos = i;
					}
				}
				const imppath = this.getrelativepath(dir, fullpath.replace(/\.tsx/, ''));
				const imp = `import ${cname} from './${imppath}';\n`;
				const imppos1 = new Position(pos + 1, 0);
				await editor.edit((eb) => {
					eb.replace(sel, `<${cname} />`);
					eb.insert(imppos1, imp);
				});
				return content;
			}
			return '';
		})();
		const tpl = `import React from 'react';
import { Text, View } from '@tarojs/components';
import './${filename}.css';

export default function ${cname}() {
	return <View>
		${content}
	</View>;
}
`;
		await this.writefile(fullpath, tpl);
		this.set_status_bar_message('成功添加组件');
		await this.show_doc(fullpath);
	}
	private async createcss(file: string) {
		const tpl = `
`;
		await this.writefile(file, tpl);
	}
}

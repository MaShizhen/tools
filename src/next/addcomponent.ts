import { join } from 'path';
import { Position, TextEditor, window } from 'vscode';
import Actor from '../actor';

export default class AddComponentNext extends Actor {
	public async do(editor: TextEditor): Promise<void> {
		const dir = await this.getdirorbypath();
		if (!dir) {
			this.showerror('不能在当前页面插入组件');
			return;
		}
		const doc = editor.document;
		const name = await this.generate(dir, 'c', 3);
		const f = await window.showInputBox({
			prompt: 'type name',
			placeHolder: 'component name',
			value: name
		});
		if (!f) {
			return;
		}
		const file = f.toLowerCase();
		const cname = f.toUpperCase();
		const fullpath = join(dir, `${file}.tsx`);
		const content = await (async () => {
			if (/\.tsx/.test(doc.fileName)) {
				const sel = editor.selection;
				const content = sel.isEmpty ? '' : doc.getText(sel);
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
			return `<${cname} />`;
		})();
		const tpl = `
export default function ${cname}() {
	return <>
		${content}
	</>;
}
`;
		await this.writefile(fullpath, tpl);
		this.set_status_bar_message('成功添加组件');
		await this.show_doc(fullpath);
	}
}

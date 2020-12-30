import { basename, dirname, join } from 'path';
import { TextEditor, window } from 'vscode';
import Actor from '../../actor';

export default class AddActionDesktopPage extends Actor {
	public constructor(private editor: TextEditor) {
		super();
	}
	public async do(): Promise<void> {
		const editor = this.editor;
		const path = editor.document.fileName;
		const dir = dirname(path);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(dir);
		if (r === null) {
			window.showErrorMessage('警示');
		} else {
			const name = await this.generate(dir, 'a', 3);
			const p_path = join(dir, name);
			await this.create_a(p_path);
			await this.update_b(dir);
			this.set_status_bar_message('成功');
			await this.show_doc(`${p_path}.ts`);
		}
	}

	private async update_b(path: string) {
		const file_name = join(path, 'b.ts');
		const eol = '\n';
		const files = await this.readdir(path);
		const as = files.filter((f) => {
			return /^a\d{3}\.ts$/.test(f);
		}).map((f) => {
			return basename(f, '.ts');
		});

		const ims = as.map((a) => {
			return `import ${a} from './${a}';`;
		}).join(eol);

		const imps = `${ims}`;

		await this.replace(file_name, 'IMPACTIONS', imps);

		const actions = `	const actions = { ${as.join(', ')} };`;
		await this.replace(file_name, 'ACTIONS', actions);
	}

	private create_a(path: string) {
		const a = basename(path);
		const tpl = `import { IAiDesktopComponent } from '@mmstudio/desktop/interfaces';

export default function ${a}(mm: IAiDesktopComponent) {
	// todo
}
`;
		return this.writefile(`${path}.ts`, tpl);
	}
}

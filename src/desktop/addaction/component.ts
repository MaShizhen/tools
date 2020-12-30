import { basename, join } from 'path';
import { TextEditor, window, workspace } from 'vscode';
import Actor from '../../actor';

export default class AddActionDesktopcomponent extends Actor {
	public constructor(private editor: TextEditor) {
		super();
	}
	public async do(): Promise<void> {
		const editor = this.editor;
		const path = workspace.asRelativePath(editor.document.uri);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(path);
		if (r === null) {
			window.showErrorMessage('请在组件中进行该操作!');
		} else {
			const folder = basename(path);
			const dir = join(this.root(editor), folder);
			const name = await this.generate(dir, 'a', 3);
			const p_path = join(dir, name);
			await this.create_a(p_path);
			await this.update_b(dir);
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

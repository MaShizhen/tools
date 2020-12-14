import { basename, dirname, join } from 'path';
import { TextEditor, window } from 'vscode';
import AddActionWebBase from './base';

export default class AddActionWebPage extends AddActionWebBase {
	public constructor(private editor: TextEditor) {
		super();
	}
	public async do(): Promise<void> {
		const editor = this.editor;
		const path = editor.document.fileName;
		const folder = dirname(path);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(folder);
		if (r === null) {
			window.showErrorMessage('请在页面b.ts中进行该操作!');
		} else {
			const p_path = await this.generate(folder, 'a', '\\.ts', 3);
			const a = await this.create_a(p_path);
			await this.update_b(folder);
			this.set_status_bar_message('成功');
			this.show_doc(a);
		}
	}
	protected async update_b(path: string): Promise<void> {
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
	protected async create_a(path: string): Promise<string> {
		const a = basename(path);
		const tpl = `import aw1 from '@mmstudio/aw000001';

export default function ${a}(mm: aw1) {
	// todo
}
`;
		const af = `${path}.ts`;
		await this.writefile(af, tpl);
		return af;
	}
}

import { basename, dirname, join } from 'path';
import { TextEditor, window } from 'vscode';
import AddActionWebBase from './base';

export default class AddActionWebComponentN extends AddActionWebBase {
	public constructor(private editor: TextEditor) {
		super();
	}
	public async do(): Promise<void> {
		const editor = this.editor;
		const path = editor.document.fileName;
		const folder = dirname(path);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(folder);
		if (r === null) {
			window.showErrorMessage('请在组件n.ts中进行该操作!');
		} else {
			const a = await this.create_a(folder);
			await this.update_n(folder);
			await this.show_doc(a);
		}
	}
	protected update_b(_path: string): Promise<void> {
		throw new Error('Method not implemented.');
	}
	protected async create_a(p_path: string): Promise<string> {
		const no = await this.generate(p_path, 'na', 3);
		if (no === 'na001') {
			await this.update_ns(p_path);
		}
		const path = join(p_path, `${no}.ts`);
		const tpl = `import an2 from '@mmstudio/an000002';

export default function ${no}(mm: an2) {
	// todo
}
`;
		await this.writefile(path, tpl);
		return path;
	}

	protected async update_n(path: string) {
		const file_name = join(path, 'n.ts');
		const eol = '\n';
		const files = await this.readdir(path);
		const as = files.filter((f) => {
			return /^na\d{3}\.ts$/.test(f);
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
	protected update_ns(path: string) {
		const tpl = `export default {
	'mm-events-init': 'na001'
};
`;
		return this.writefile(join(path, 'ns.ts'), tpl);
	}
}

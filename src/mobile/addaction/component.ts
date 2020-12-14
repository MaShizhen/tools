import { basename, dirname, join } from 'path';
import { TextEditor, window } from 'vscode';
import Actor from '../../actor';

export default class AddActionMobile extends Actor {
	public constructor(private editor: TextEditor) {
		super();
	}
	public async do(): Promise<void> {
		const editor = this.editor;
		const path = editor.document.fileName;
		// 如果当前目录不在某个页面中，则不允许操作
		const r = this.reg_in_comment(path);
		if (r) {
			window.showErrorMessage('不能在mobile项目中进行该操作!');
			return;
		}
		const folder = dirname(path);
		const p_path = await this.create_a(folder);
		await this.update_p(folder);
		this.show_doc(p_path);
	}
	protected async update_p(path: string) {
		let file_name = join(path, 'p.ts');
		if (!await this.exists(file_name)) {
			file_name = join(path, 'app.ts');
		}
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

	protected async create_a(p_path: string) {
		const path = await this.generate(p_path, 'a', '\\.ts', 3);
		const a = basename(path);
		const tpl = `import am1 from '@mmstudio/am000001';

export default function ${a}(mm: am1) {
}
`;
		const af = `${path}.ts`;
		await this.writefile(af, tpl);
		return af;
	}

}

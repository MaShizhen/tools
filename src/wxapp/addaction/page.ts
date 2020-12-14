import { basename, dirname, join } from 'path';
import { TextEditor, window } from 'vscode';
import Actor from '../../actor';

export default class AddActionWeixinPage extends Actor {
	public act(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public async do(editor: TextEditor): Promise<void> {
		const path = editor.document.fileName;
		const dir = dirname(path);
		// 如果当前目录不在某个页面中，则不允许操作
		const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(dir);
		if (r === null) {
			window.showErrorMessage('警示');
		} else {
			const p_path = await this.create_a(dir);
			await this.update_p(dir);
			this.show_doc(p_path);
		}
	}
	private async update_p(path: string) {
		const file_name = join(path, 'p.ts');
		const eol = '\n';
		const files = await this.readdirasync(path);
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

	private async update_s(path: string, a: string) {
		const page_s_path = join(path, 's.ts');
		const txt = await this.readfileasync(page_s_path);
		const res = txt.match(/{(.|\n)*}/g);
		const str = (() => {
			if (res) {
				const obj_str = res[0].replace(/'/g, '"');
				const obj = JSON.parse(obj_str);
				return JSON.stringify({ ...obj, [a]: a }, null, '\t');
			}
			return JSON.stringify({ [a]: a }, null, '\t');
		})();
		const tpl = `export default ${str.replace(/"/g, "'")};
`;
		return this.writefileasync(page_s_path, tpl);
	}

	private async create_a(p_path: string) {
		const path = await this.generate(p_path, 'a', '\\.ts', 3);
		const a = basename(path);
		const tpl = `import awx2 from '@mmstudio/awx000002';

export default function ${a}(mm: awx2) {
	// todo
}
`;
		const af = `${path}.ts`;
		await this.writefileasync(af, tpl);
		await this.update_s(p_path, a);
		return af;
	}
}

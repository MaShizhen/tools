import { basename, dirname, join } from 'path';
import { TextEditor, Uri, window } from 'vscode';
import { NO_MODIFY } from '../util/blocks';
import Actor from '../actor';

export default class AddComponentWeb extends Actor {
	public constructor(private editor: TextEditor) {
		super();
	}
	public async do(): Promise<void> {
		const editor = this.editor;
		try {
			const doc = editor.document;
			const uri = doc.uri;
			// 如果当前目录不在某个页面中，则不允许操作
			const folder = dirname(uri.path);
			const content = doc.getText(editor.selection);

			const component_dir = await this.generate(folder, 'zj-', '', 3);
			const no = component_dir.replace(/.*(zj-\d*)/, '$1');

			await this.create_tpl(component_dir, content);
			await this.create_tplts(component_dir, content);
			await this.create_s(component_dir);
			await this.create_ns(component_dir);
			const id = basename(component_dir);
			await this.create_n(id, component_dir);
			await this.create_b(id, component_dir);
			await this.update_html(editor, no);
			// update b.ts, n.ts
			const files = await this.readdir(folder);
			const cs = files.filter((f) => {
				return /zj-\d{3,6}/.test(f);
			});

			await this.update_n(folder, cs);
			await this.update_b(folder, cs);
			window.setStatusBarMessage('创建成功');
			window.showTextDocument(Uri.file(join(component_dir, 'tpl.tpl')));
		} catch (error) {
			console.trace(error);
		}
	}

	private update_html(editor: TextEditor, no: string) {
		const zj = `<${no}></${no}>`;
		return editor.edit((eb) => {
			eb.replace(editor.selection, zj);
		});
	}

	private async update_b(path: string, components: string[]) {
		// const eol = workspace.getConfiguration('files').get<string>('eol');
		const eol = '\n';
		const file_name = join(path, 'b.ts');

		const ims = components.map((c, i) => {
			return `import c${i} from './${c}/b';`;
		}).join(eol);
		await this.replace(file_name, 'IMPCOMPONENTS', ims);

		const cs = components.map((_c, i) => {
			return `c${i}`;
		}).join(', ');
		if (cs.length > 0) {
			await this.replace(file_name, 'COMPONENTS', `		,${cs}`);
		} else {
			await this.replace(file_name, 'COMPONENTS', '');
		}
	}

	private async update_n(path: string, components: string[]) {
		const eol = '\n';
		const file_name = join(path, 'n.ts');

		const ims = components.map((c, i) => {
			return `import c${i} from './${c}/n';`;
		}).join(eol);
		await this.replace(file_name, 'IMPCOMPONENTS', ims);

		const cs = components.map((_c, i) => {
			return `c${i}`;
		}).join(', ');
		if (cs.length > 0) {
			await this.replace(file_name, 'COMPONENTS', `		,${cs}`);
		} else {
			await this.replace(file_name, 'COMPONENTS', '');
		}
	}

	private create_b(id: string, path: string) {
		const tpl = `import { component } from '@mmstudio/web';

import s from './s';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

/// MM IMPWIDGETS BEGIN
/// ${NO_MODIFY}
/// MM IMPWIDGETS END

export default function main(url: string, query: {}) {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MM ACTIONS END
	return component('${id}', s, actions, url, query);
}
`;
		return this.writefile(join(path, 'b.ts'), tpl);
	}

	private create_n(id: string, path: string) {
		const tpl = `import { component } from '@mmstudio/nodejs';
import { HTMLElement } from 'node-html-parser';
import s from './ns';
import tpl from './tpl';

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

export default function main(html: HTMLElement, url: string, msg: unknown, headers: object, query: {}) {

	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MM ACTIONS END


	return component('${id}', tpl, s, actions, html, url, msg, headers, query);
}

`;
		return this.writefile(join(path, 'n.ts'), tpl);
	}

	private create_ns(path: string) {
		const tpl = `export default {
};
`;
		return this.writefile(join(path, 'ns.ts'), tpl);
	}

	private create_s(path: string) {
		const tpl = `export default {
};
`;
		return this.writefile(join(path, 's.ts'), tpl);
	}

	private create_tpl(path: string, content: string) {
		return this.writefile(join(path, 'tpl.tpl'), content);
	}

	private create_tplts(path: string, content: string) {
		const tpl = `export default \`${content}\`;
`;
		return this.writefile(join(path, 'tpl.ts'), tpl);
	}
}

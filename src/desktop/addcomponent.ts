import { basename, dirname, join } from 'path';
import { TextEditor, window } from 'vscode';
import { NO_MODIFY } from '../util/blocks';
import Actor from '../actor';

export default class AddComponentDesktop extends Actor {
	public act(): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public async do(editor: TextEditor): Promise<void> {
		try {
			const path = editor.document.fileName;
			const folder = dirname(path);
			// 如果当前目录不在某个页面中，则不允许操作
			const r = /[/\\](src[/\\]\w[\w\d-]*)[/\\]?/.exec(path);
			if (r === null) {
				window.showErrorMessage('您必须在某个页面文件夹下进行该操作！');
			} else {
				const c = await this.generate(folder, 'zj-', '', 3);
				// create
				await this.create_tpl(c);
				await this.create_s(c);
				const id = basename(c);
				await this.create_n(id, c);
				await this.create_b(id, c);
				// update b.ts, n.ts
				const files = await this.readdirasync(folder);
				const cs = files.filter((f) => {
					return /zj-\d{3,6}/.test(f);
				});
				await this.update_n(folder, cs);
				await this.update_b(folder, cs);
				this.set_status_bar_message('创建成功');
				this.show_doc(join(c, 'b.ts'));
			}
		} catch (error) {
			console.trace(error);
		}
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
		// const eol = workspace.getConfiguration('files').get<string>('eol');
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
		const tpl = `import init from '@mmstudio/desktop/component';

import s from './s';

/// MMSTUDIO IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MMSTUDIO IMPACTIONS END

export default function main(url: string, query: {}) {
	/// MMSTUDIO ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MMSTUDIO ACTIONS END
	return init('${id}', s, actions, url, query);
}
`;
		return this.writefileasync(join(path, 'b.ts'), tpl);
	}

	private create_n(id: string, path: string) {
		const tpl = `
import init from '@mmstudio/desktop/init-component';
import { HTMLElement } from 'node-html-parser';
import tpl from './tpl';


export default function main(html: HTMLElement) {
	return init('${id}', tpl, html);
}

`;
		return this.writefileasync(join(path, 'n.ts'), tpl);
	}

	private create_s(path: string) {
		const tpl = `export default {
};
`;
		return this.writefileasync(join(path, 's.ts'), tpl);
	}

	private create_tpl(path: string) {
		const tpl = `export default \`
\`;
`;
		return this.writefileasync(join(path, 'tpl.ts'), tpl);
	}
}

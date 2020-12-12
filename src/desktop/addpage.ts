import { basename, extname, join } from 'path';
import { FileType, Uri, window, workspace } from 'vscode';
import { NO_MODIFY } from '../util/blocks';
import pickoption from '../util/pickoption';
import Tools from '../tools';

export default class AddPageDesktop extends Tools {
	public async addpage() {
		const rootPath = await this.root();
		if (!await this.existsasync(join(rootPath, 'pages'))) {
			window.showErrorMessage('缺少pages文件夹');
			return;
		}
		const src = join(rootPath, 'src');
		if (!await this.existsasync(src)) {
			await this.mkdirasync(src);
		}
		const folder = join(rootPath, 'src');
		const value = await (async () => {
			const stat = await workspace.fs.stat(Uri.file(rootPath));
			if (stat.type === FileType.File) {
				if (extname(rootPath) === '.html') {
					return basename(rootPath, '.html');
				}
			}
			return null;
		})();
		const ps = await workspace.fs.readDirectory(Uri.file(join(rootPath, 'pages')));
		const pages = ps.map(([_p]) => {
			return _p.substring(0, _p.lastIndexOf('.'));
		});
		const hps = await workspace.fs.readDirectory(Uri.file(join(rootPath, 'src')));
		const has_pages = hps.map(([p]) => {
			return p;
		});
		const selects = pages.filter((_f) => {
			return !has_pages.includes(_f);
		}).sort();
		selects.unshift('➕ 新建...');
		if (value) {
			selects.splice(selects.indexOf(value), 1);
			selects.unshift(value);
		}
		const name = await (async () => {
			const pick = await window.showQuickPick(selects, {
				...pickoption,
				placeHolder: '请输入页面名称:'
			});
			if (pick === '➕ 新建...') {
				await window.showInputBox({
					placeHolder: '请输入页面名称:',
					value: '',
					ignoreFocusOut: true,
					validateInput: async (val) => {
						const p_path = join(folder, val);
						if (await this.existsasync(p_path)) {
							return '页面文件已存在';
						}
						return null;

					}
				});
			}
			return pick;
		})();
		if (name) {
			if (has_pages.includes(name)) {
				window.showErrorMessage('页面文件已存在');
				return;
			}
			if (!await this.existsasync(folder)) {
				await workspace.fs.createDirectory(Uri.file(folder));
			}
			const p_path = join(folder, name);
			await workspace.fs.createDirectory(Uri.file(p_path));
			// create n
			await this.create_html(p_path);
			await this.create_n(p_path, name);
			// create b
			await this.create_s(p_path);
			await this.create_b(p_path);
			await workspace.saveAll();
			this.set_status_bar_message('成功添加页面文件');
			this.show_doc(join(p_path, 'b.ts'));
		}
	}

	private create_b(path: string) {
		const tpl = `import init from '@mmstudio/desktop/page';

import s from './s';

/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}
/// MM IMPCOMPONENTS END


/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

(() => {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MM ACTIONS END

	init(s, actions
		/// MM COMPONENTS BEGIN
		/// ${NO_MODIFY}
		/// MM COMPONENTS END
	);
})();

`;
		return this.writefileasync(join(path, 'b.ts'), tpl);
	}

	private create_s(path: string) {
		const tpl = `export default {
};

`;
		return this.writefileasync(join(path, 's.ts'), tpl);
	}

	private create_html(path: string) {
		const tpl = `import { parse } from 'node-html-parser';

const html = \`
\`;

export default parse(html);

`;
		return this.writefileasync(join(path, 'html.ts'), tpl);
	}

	private create_n(path: string, page: string) {
		const tpl = `
import init from '@mmstudio/desktop/init-page';
import html from './html';


/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}
/// MM IMPCOMPONENTS END


export default async function main() {
	await init(html
		/// MM COMPONENTS BEGIN
		/// ${NO_MODIFY}
		/// MM COMPONENTS END
	);

	const html_str = \`<html lang="en">
		<head>
			<meta charset="UTF-8">
			<meta name="viewport" content="width=device-width, initial-scale=1.0">
			<meta http-equiv="X-UA-Compatible" content="ie=edge">
			<title>${page}</title>
			<script>
				require('../${page}/b.js');
			</script>
			<link inline rel="stylesheet" type="text/css" href="../css/mm.css">
		</head>

		<body>
			$\{html.toString()}
		</body>
	</html>
	\`;
	return html_str;
}
`;
		return this.writefileasync(join(path, 'n.ts'), tpl);
	}
}

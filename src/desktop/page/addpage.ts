import { basename, extname, join } from 'path';
import { FileType, Uri, window, workspace } from 'vscode';
import { existsSync, writeFileSync } from '../../util/fs';
import { NO_MODIFY } from '../../util/blocks';
import pickoption from '../../util/pickoption';

export default async function add(rootPath: string) {
	if (!await existsSync(join(rootPath, 'pages'))) {
		window.showErrorMessage('缺少pages文件夹');
		return;
	}
	if (!await existsSync(join(rootPath, 'src'))) {
		window.showErrorMessage('缺少src文件夹');
		return;
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
				async validateInput(val) {
					const p_path = join(folder, val);
					if (await existsSync(p_path)) {
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
		if (!await existsSync(folder)) {
			await workspace.fs.createDirectory(Uri.file(folder));
		}
		const p_path = join(folder, name);
		await workspace.fs.createDirectory(Uri.file(p_path));
		// create n
		await create_html(p_path);
		await create_n(p_path, name);
		// create b
		await create_s(p_path);
		await create_b(p_path);
		await workspace.saveAll();
		window.setStatusBarMessage('成功添加页面文件');
		window.showTextDocument(Uri.file(join(p_path, 'b.ts')));
	}
}

function create_b(path: string) {
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
	return writeFileSync(join(path, 'b.ts'), tpl);
}

function create_s(path: string) {
	const tpl = `export default {
};

`;
	return writeFileSync(join(path, 's.ts'), tpl);
}

function create_html(path: string) {
	const tpl = `import { parse } from 'node-html-parser';

const html = \`
\`;

export default parse(html);

`;
	return writeFileSync(join(path, 'html.ts'), tpl);
}

function create_n(path: string, page: string) {
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
	return writeFileSync(join(path, 'n.ts'), tpl);
}

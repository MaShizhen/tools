import { basename, extname, join } from 'path';
import { FileType, Uri, window, workspace } from 'vscode';
import { existsasync, mkdirasync, readdirasync, readfileasync, writefileasync } from '../../util/fs';
import generate from '../../util/generate';
import { NO_MODIFY } from '../../util/blocks';
import pickoption from '../../util/pickoption';

export default async function addpageweb(rootPath: string) {
	if (!await existsasync(join(rootPath, 'pages'))) {
		window.showErrorMessage('缺少pages文件夹');
		return;
	}
	const src = join(rootPath, 'src');
	if (!await existsasync(src)) {
		await mkdirasync(src);
	}
	const folder = join(rootPath, 'src');
	const value = await (async () => {
		const stat = await workspace.fs.stat(Uri.file(rootPath));
		if (stat.type === FileType.File && (extname(rootPath) === '.html' || extname(rootPath) === '.htm')) {
			return basename(rootPath, '.html');
		}
		return null;
	})();
	const pages = (await readdirasync(join(rootPath, 'pages'))).map((_p) => {
		return _p.substring(0, _p.lastIndexOf('.'));
	});
	const newpage = '以下都不是';
	pages.unshift(newpage);
	if (value) {
		pages.splice(pages.indexOf(value), 1);
		pages.unshift(value);
	}
	const page = await window.showQuickPick(pages, {
		...pickoption,
		placeHolder: '请输入页面名称'
	});
	if (!page) {
		return;
	}
	const p_path = await generate(folder, 'pg', '', 3);
	if (!await existsasync(folder)) {
		await mkdirasync(folder);
	}
	const name = basename(p_path);
	await mkdirasync(p_path);
	// create n
	await create_ns(p_path);
	const html = await (async () => {
		if (page !== newpage) {
			return readfileasync(join(rootPath, 'pages', `${page}.html`));
		}
		return '';
	})();
	await create_html(p_path, html);
	await create_n(p_path, name, html);
	// create b
	await create_s(p_path);
	await create_b(p_path);
	await workspace.saveAll();
	window.setStatusBarMessage('成功添加页面文件');
	window.showTextDocument(Uri.file(join(p_path, 'html.ts')));
}

function create_b(path: string) {
	const tpl = `import { page } from '@mmstudio/web';

import s from './s';

/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}
/// MM IMPCOMPONENTS END

/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

/// MM IMPWIDGETS BEGIN
/// ${NO_MODIFY}
/// MM IMPWIDGETS END

(() => {
	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = {};
	/// MM ACTIONS END

	page(s, actions
		/// MM COMPONENTS BEGIN
		/// ${NO_MODIFY}
		/// MM COMPONENTS END
	);
})();

`;
	return writefileasync(join(path, 'b.ts'), tpl);
}

function create_s(path: string) {
	const tpl = `export default {
};

`;
	return writefileasync(join(path, 's.ts'), tpl);
}

function create_html(path: string, html: string) {
	const body = html.replace(/[.\s\S]*<\s*body\s*.*>[\s]*([\s\S.]*?)\s*<\/\s*body\s*.*>[.\s\S]*/i, '$1');
	const tpl = `import { parse } from 'node-html-parser';

const html = \`${body}\`;

export default parse(html);

`;
	return writefileasync(join(path, 'html.ts'), tpl);
}

function create_ns(path: string) {
	const tpl = `export default {
};
`;
	return writefileasync(join(path, 'ns.ts'), tpl);
}

function create_n(path: string, page: string, html: string) {
	const title = html.replace(/[.\s\S]*<\s*title\s*.*>[\s]*([\s\S.]*?)\s*<\/\s*title\s*.*>[.\s\S]*/i, '$1');
	const tpl = `import { page } from '@mmstudio/nodejs';
import html from './html';
import s from './ns';

/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}
/// MM IMPCOMPONENTS END


/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
/// MM IMPACTIONS END

export default async function main(url: string, msg: unknown, headers: object) {

	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}
	const actions = { };
	/// MM ACTIONS END


	const res = await page(html, url, msg, headers, s, actions
		/// MM COMPONENTS BEGIN
		/// ${NO_MODIFY}
		/// MM COMPONENTS END
	);

	return \`<!DOCTYPE html>
<html>

	<head>
		<meta charset="UTF-8">
		<meta http-equiv="X-UA-Compatible" content="ie=edge">
		<meta name="viewport" content="width=device-width,minimum-scale=1.0,maximum-scale=1.0,user-scalable=no" />
		<meta name="apple-mobile-web-app-capable" content="yes" />
		<meta name="renderer" content="webkit">
		<title>${title}</title>
		<link inline rel="stylesheet" type="text/css" href="./css/iconfont.css">
		<link rel="shortcut icon" href="favicon.ico" type="image/x-icon" />
		<link inline rel="stylesheet" type="text/css" href="./css/mm.css">
		<script src="//cdn.jsdelivr.net/npm/@webcomponents/webcomponentsjs"></script>
		<script src="//cdn.jsdelivr.net/npm/cross-fetch"></script>
		<script src="./dist/js/mm.js"></script>
		<script type="text/javascript">
			window.addEventListener('WebComponentsReady', function () {
				var t = document.createElement('script');
				t.src = './dist/js/${page}.js';
				document.head.appendChild(t);
			});
		</script>
	</head>
	<body>
	$\{res.toString()}
	</body>
</html>
	\`;
}
`;
	return writefileasync(join(path, 'n.ts'), tpl);
}

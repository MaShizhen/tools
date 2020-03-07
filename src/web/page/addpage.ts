import { basename, extname, join } from 'path';
import { FileType, Uri, window, workspace } from 'vscode';
import { existsSync, mkdirSync, readdirSync, writeFileSync } from '../../util/fs';
import generate from '../../util/generate';
import { NO_MODIFY } from '../../util/blocks';

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
		if (stat.type === FileType.File && (extname(rootPath) === '.html' || extname(rootPath) === '.htm')) {
			return basename(rootPath, '.html');
		}
		return null;
	})();
	const pages = (await readdirSync(join(rootPath, 'pages'))).map((_p) => {
		return _p.substring(0, _p.lastIndexOf('.'));
	});
	const newpage = '以下都不是';
	pages.unshift(newpage);
	if (value) {
		pages.splice(pages.indexOf(value), 1);
		pages.unshift(value);
	}
	const page = await (async () => {
		const pick = await window.showQuickPick(pages, {
			canPickMany: false,
			placeHolder: '请输入页面名称',
			matchOnDescription: true,
			matchOnDetail: true
		});
		if (pick === newpage) {
			return '';
		}
		return pick;
	})();
	const p_path = await generate(folder, 'pg', '', 3);
	if (!await existsSync(folder)) {
		await mkdirSync(folder);
	}
	const name = basename(p_path);
	await mkdirSync(p_path);
	// create n
	await create_ns(p_path);
	const html = await (async () => {
		if (page) {
			return Buffer.from(await workspace.fs.readFile(Uri.file(join(rootPath, 'pages', `${page}.html`)))).toString('utf8');
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
	const tpl = `import { bp } from '@mmstudio/web';

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

	bp(s, actions
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

function create_html(path: string, html: string) {
	const body = html.replace(/[.\s\S]*<\s*body\s*.*>[\s]*([\s\S.]*?)\s*<\/\s*body\s*.*>[.\s\S]*/i, '$1');
	const tpl = `import { HTMLElement, parse } from 'node-html-parser';

const html = \`${body}\`;

export default parse(html) as HTMLElement;

`;
	return writeFileSync(join(path, 'html.ts'), tpl);
}

function create_ns(path: string) {
	const tpl = `export default {
};
`;
	return writeFileSync(join(path, 'ns.ts'), tpl);
}

function create_n(path: string, page: string, html: string) {
	const title = html.replace(/[.\s\S]*<\s*title\s*.*>[\s]*([\s\S.]*?)\s*<\/\s*title\s*.*>[.\s\S]*/i, '$1');
	const tpl = `import { ICommonParams, IHeaders, np } from '@mmstudio/web';
import html from './html';
import s from './ns';

/// MM IMPCOMPONENTS BEGIN
/// ${NO_MODIFY}

/// MM IMPCOMPONENTS END


/// MM IMPACTIONS BEGIN
/// ${NO_MODIFY}
import na001 from './na001';

/// MM IMPACTIONS END

export default async function main(url: string, msg: ICommonParams, headers: IHeaders) {

	/// MM ACTIONS BEGIN
	/// ${NO_MODIFY}

	const actions = { na001 };

	/// MM ACTIONS END


	const res = await np(html, url, msg, headers, s, actions
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
		<script src="./dist/js/mmjs"></script>
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
	return writeFileSync(join(path, 'n.ts'), tpl);
}
import { basename, extname, join } from 'path';
import { FileType, Uri, window, workspace } from 'vscode';
import { NO_MODIFY } from '../util/blocks';
import Actor from '../actor';

export default class AddPageWeb extends Actor {
	public async do(): Promise<void> {
		const rootPath = this.root();
		if (!await this.exists(join(rootPath, 'pages'))) {
			await window.showErrorMessage('缺少pages文件夹');
			return;
		}
		const src = join(rootPath, 'src');
		if (!await this.exists(src)) {
			await this.mkdir(src);
		}
		const folder = join(rootPath, 'src');
		const value = await (async () => {
			const stat = await workspace.fs.stat(Uri.file(rootPath));
			if (stat.type === FileType.File && (extname(rootPath) === '.html' || extname(rootPath) === '.htm')) {
				return basename(rootPath, '.html');
			}
			return null;
		})();
		const pages = (await this.readdir(join(rootPath, 'pages'))).map((_p) => {
			return _p.substring(0, _p.lastIndexOf('.'));
		});
		const newpage = '以下都不是';
		pages.unshift(newpage);
		if (value) {
			pages.splice(pages.indexOf(value), 1);
			pages.unshift(value);
		}
		const picked = await this.pick(pages.map((it) => {
			return { label: it };
		}), '请输入页面名称');
		if (!picked) {
			return;
		}
		const page = picked.label;
		const no = await this.generate(folder, 'pg', 3);
		const p_path = join(folder, no);
		if (!await this.exists(folder)) {
			await this.mkdir(folder);
		}
		const name = basename(p_path);
		await this.mkdir(p_path);
		// create n
		await this.create_ns(p_path);
		const html = await (async () => {
			if (page !== newpage) {
				return this.readfile(join(rootPath, 'pages', `${page}.html`));
			}
			return '';
		})();
		await this.create_html(p_path, html);
		await this.create_n(p_path, name, html);
		// create b
		await this.create_s(p_path);
		await this.create_b(p_path);
		await workspace.saveAll();
		this.set_status_bar_message('成功添加页面文件');
		await this.show_doc(join(p_path, 'html.ts'));
	}

	private create_b(path: string) {
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
		return this.writefile(join(path, 'b.ts'), tpl);
	}

	private create_s(path: string) {
		const tpl = `export default {
};

`;
		return this.writefile(join(path, 's.ts'), tpl);
	}

	private create_html(path: string, html: string) {
		const body = html.replace(/[.\s\S]*<\s*body\s*.*>[\s]*([\s\S.]*?)\s*<\/\s*body\s*.*>[.\s\S]*/i, '$1');
		const tpl = `import { parse } from 'node-html-parser';

const html = \`${body}\`;

export default parse(html);

`;
		return this.writefile(join(path, 'html.ts'), tpl);
	}

	private create_ns(path: string) {
		const tpl = `export default {
};
`;
		return this.writefile(join(path, 'ns.ts'), tpl);
	}

	private create_n(path: string, page: string, html: string) {
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
		return this.writefile(join(path, 'n.ts'), tpl);
	}
}

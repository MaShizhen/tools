import { basename, dirname, extname, join } from 'path';
import { Position, window, workspace, WorkspaceEdit } from 'vscode';
import { get_pages } from './get-pages';
import Actor from '../actor';

export default class AddServiceNext extends Actor {
	public async do(): Promise<void> {
		// get api path
		const { api, page } = await this.getapipath();

		const name = await this.generate(api, 's', 3);
		// create service file
		const servicefile = join(api, `${name}.ts`);
		await this.create_api(servicefile, name);
		if (page) {
			// update page file
			await this.updatepage(name, page, servicefile);
		}
		await this.save();
		this.set_status_bar_message('成功添加服务文件');
		await this.show_doc(servicefile);
	}

	private async updatepage(name: string, pagefile: string, servicefile: string) {
		// api/xxx/yyy/s001
		const pathwithoutext = servicefile.replace(/\..*/, '');
		const no = pathwithoutext.replace(/.*s(\d+)/, '$1');
		const relativepath = this.getrelativepath(join(pagefile, '..'), pathwithoutext);
		const url = this.getrelativepath(join('src', 'pages'), pathwithoutext);
		const imppath = relativepath.startsWith('.') ? relativepath : `./${relativepath}`;
		const imp = `import { r${no} } from '${imppath}';`;
		const doc = await workspace.openTextDocument(pagefile);
		const max = doc.lineCount;
		let hasimport = false;
		let pos = -1;
		for (let i = 0; i < max; i++) {
			const line = doc.lineAt(i);
			const text = line.text;
			if (/^import\s+.+/.test(text)) {
				if (text === imp) {
					hasimport = true;
					break;
				}
				pos = i;
			}
		}
		if (!hasimport) {
			const we = new WorkspaceEdit();
			const uri = doc.uri;
			const imppos1 = new Position(pos + 2, 0);
			we.insert(uri, imppos1, `const ${name} = '/${url}';\n`);
			const imppos = new Position(pos + 1, 0);
			we.insert(uri, imppos, `${imp}\n`);
			await workspace.applyEdit(we);
		}
	}

	private create_api(path: string, name: string) {
		const relativepath = this.getrelativepath('src', path);
		const rname = name.replace('s', 'r');
		const tpl = `import nextConnect from 'next-connect';
import { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import anylogger from 'anylogger';
import '@mmstudio/an000042';

const logger = anylogger('${relativepath.replace('.ts', '')}');

export type ${rname} = {
	ok: true;
} | {
	ok: false;
	message: string;
};

const handler = nextConnect<NextApiRequest, NextApiResponse<${rname}>>();

handler.get((req, res) => {
	res.status(200).json({ ok: true });
});

export const config = {} as PageConfig;

export default handler;
`;
		return this.writefile(path, tpl);
	}

	private async typesubdir() {
		const sub = await window.showInputBox({
			prompt: '请输入服务所在目录(相对src/pages/api)，可以为空',
			value: ''
		});
		return sub || '';
	}

	private async getapipath() {
		const rootPath = this.root();
		const editor = window.activeTextEditor;
		if (!editor) {
			// 当前未打开任何文件
			const pages = await get_pages(rootPath);
			const sub = await this.typesubdir();
			const api = join(pages, 'api', sub);
			return { api, page: null };
		}
		const curdir = dirname(editor.document.fileName);
		if (curdir.includes('api')) {
			// 当前打开文件在api中，这属于新增服务的情况
			return { api: curdir, page: null };
		}
		const pages = await get_pages(rootPath);
		if (!/.+[/\\]pages([/\\].+)?$/.test(curdir)) {
			// 当前打开文件不在pages中，这种情况下也不能在当前文件位置新增服务
			const sub = await this.typesubdir();
			const api = join(pages, 'api', sub);
			return { api, page: null };
		}
		// 当前打开了page页面的情况
		const curfile = editor.document.fileName;
		const curname = basename(curfile);
		const api = join(pages, 'api');
		if (/^\[.+\]\.[tj]sx?$/.test(curname)) {
			// absolutedir/src/pages/xxx/[yyy].tsx
			// absolutedir/src/pages/xxx
			const relativepath = this.getrelativepath(pages, curdir);
			// 当前打开了页面文件,含匹配路由的情况, page名称为上级目录名称,而不是当前文件名
			// api/xxx
			const apipath = join(api, relativepath);
			await this.mkdir(apipath);
			// absolutedir/src/pages/pgxxx/[xxx].tsx
			return { api: apipath, page: curfile };
		}
		// 当前打开了页面文件,不含匹配路由的情况
		// absolutedir/src/pages/xxx/yyy.tsx
		const ext = extname(curfile);
		// absolutedir/src/pages/xxx/yyy
		const pgpath = join(curdir, basename(curfile, ext));
		// xxx/yyy
		const relativepath = this.getrelativepath(pages, pgpath);
		// api/xxx/yyy
		const apipath = join(api, relativepath);
		await this.mkdir(apipath);
		// absolutedir/src/pages/pgxxx/[xxx].tsx
		return { api: apipath, page: curfile };
	}
}

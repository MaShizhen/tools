import { basename, extname, join } from 'path';
import { FileType, Position, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import { get_pages } from './get-pages';
import Actor from '../actor';

export default class AddServiceNext extends Actor {
	public async do(p?: string): Promise<void> {
		// get api path
		const { api, page } = await this.getapipath(p);
		if (!api) {
			return;
		}
		if (!/[/\\]pages[/\\]api[/\\]/.test(api)) {
			this.showerror('当前目录不可以创建服务');
			return;
		}

		const name = await window.showInputBox({
			prompt: 'Please type file uri',
			value: await this.generate(api, 's', 3)
		});
		if (!name) {
			return;
		}
		// create service file
		const servicefile = join(api, `${name}.api.ts`);
		await this.create_api(servicefile);
		await this.updateapi();
		if (page) {
			// update page file
			await this.updatepage(page, servicefile);
		}
		await this.save();
		this.set_status_bar_message('成功添加服务文件');
		await this.show_doc(servicefile);
	}

	/**
	 * update src/atom/api.ts
	 */
	private async updateapi() {
		interface T {
			[k: string]: string | T;
		}
		const api = {} as T;
		const fs = workspace.fs;

		const root = this.root();
		const getrelativepath = this.getrelativepath;
		const pages = join(root, 'src', 'pages');
		async function read(dir: string, api: T) {
			const sub = await fs.readDirectory(Uri.file(dir));
			const ps = sub.map(async ([subdir, type]) => {
				if (FileType.Directory === type) {
					const fullpath = join(dir, subdir);
					const obj = api[subdir] || {};
					await read(fullpath, obj as T);
					if (Object.keys(obj).length > 0) {
						api[subdir] = obj;
					}
				} else if (FileType.File === type) {
					if (subdir.endsWith('.api.ts')) {
						const service = subdir.replace(/\.api\.ts$/, '');
						if (/^(\[.+\]|index)$/.test(service)) {
							const fullpath = dir;
							const url = `/${getrelativepath(pages, fullpath)}`;
							api[service] = url;
						} else {
							const fullpath = join(dir, service);
							const url = `/${getrelativepath(pages, fullpath)}`;
							api[service] = url;
						}
					}
				}
			});
			await Promise.all(ps);
		}
		await read(join(root, 'src', 'pages', 'api'), api);
		const apiuri = Uri.file(join(root, 'src', 'atoms', 'api.ts'));
		const we = new WorkspaceEdit();
		we.createFile(apiuri, {
			overwrite: true,
			ignoreIfExists: false
		});
		await workspace.applyEdit(we);
		we.insert(apiuri, new Position(0, 0), `export default ${JSON.stringify(api, null, '\t')};
`);
		await workspace.applyEdit(we);
	}

	private async updatepage(pagefile: string, servicefile: string) {
		// api/xxx/yyy/s001
		const imp = new RegExp('import\\s+api\\s+from\\s+[\'|"].*[\'|"];?');
		const doc = await workspace.openTextDocument(pagefile);
		const max = doc.lineCount;
		let hasimport = false;
		let pos = -1;
		for (let i = 0; i < max; i++) {
			const line = doc.lineAt(i);
			const text = line.text;
			if (/^import\s+.+/.test(text)) {
				if (imp.test(text)) {
					hasimport = true;
					break;
				}
				pos = i;
			}
		}
		const we = new WorkspaceEdit();
		if (!hasimport) {
			const root = this.root();
			const api = join(root, 'src', 'atoms', 'api');
			const relativepath = this.getrelativepath(join(pagefile, '..'), api);
			const imppath = relativepath.startsWith('.') ? relativepath : `./${relativepath}`;
			const imp = `import api from '${imppath}';`;
			const uri = doc.uri;
			const imppos = new Position(pos + 1, 0);
			we.insert(uri, imppos, `${imp}\n`);
		}
		{
			const ext = '.ts';
			const pathwithoutext = servicefile.replace(ext, '');
			const relativepath = this.getrelativepath(join(pagefile, '..'), pathwithoutext);
			const imppath = relativepath.startsWith('.') ? relativepath : `./${relativepath}`;
			const body = doc.getText();
			const ss = body.match(/[MQR]\d+/g) || ['0'];
			const max = ss.map((s) => {
				return Number(s.replace(/[^\d]/g, ''));
			}).sort((a, b) => {
				return b - a;
			})[0];
			const no = max + 1;
			const imp = `import { Message as M${no}, Query as Q${no}, Result as R${no} } from '${imppath}';`;
			const uri = doc.uri;
			const imppos = new Position(pos + 1, 0);
			we.insert(uri, imppos, `${imp}\n`);
		}
		await workspace.applyEdit(we);
	}

	private create_api(path: string) {
		const relativepath = this.getrelativepath('src', path);
		const rname = 'Result';
		const mname = 'Message';
		const qname = 'Query';
		const vname = relativepath.replace('.ts', '');
		const tpl = `import nextConnect from 'next-connect';
import { NextApiRequest, NextApiResponse, PageConfig } from 'next';
import anylogger from 'anylogger';
import '@mmstudio/an000042';

const logger = anylogger('${vname}');

export type ${rname} = {
	ok: true;
} | {
	ok: false;
	message: string;
};

export type ${mname} = {

}

export type ${qname} = {

}

/**
 * ${vname}
 */
const handler = nextConnect<NextApiRequest, NextApiResponse<${rname}>>();

handler.post((req, res) => {
	logger.debug('msg body:', req.body);
	const { } = req.body as ${mname};
	const { } = req.query as ${qname};
	res.status(200).json({ ok: true });
});

export const config = {} as PageConfig;

export default handler;
`;
		return this.writefile(path, tpl);
	}

	private async getapipath(path?: string) {
		const curdir = await this.getdirorbypath(path);
		if (!curdir) {
			return { api: null, page: null };
		}
		const editor = window.activeTextEditor;
		if (!editor) {
			// 当前未打开任何文件
			return { api: curdir, page: null };
		}
		if (curdir.includes('api')) {
			// 当前打开文件在api中，这属于新增服务的情况
			return { api: curdir, page: null };
		}
		const rootPath = this.root();
		const pages = await get_pages(rootPath);
		if (!/.+[/\\]src([/\\].+)?$/.test(curdir)) {
			// 当前打开文件不在src中，这种情况下也不能在当前文件位置新增服务
			return { api: null, page: null };
		}
		// 当前打开了page页面的情况
		const curfile = editor.document.fileName;
		const curname = basename(curfile);
		const api = join(pages, 'api');
		if (/^(\[.+\]|index)\.page\.[tj]sx?$/.test(curname)) {
			// absolutedir/src/pages/xxx/[yyy].tsx or absolutedir/src/pages/xxx/index.page.tsx
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
		const relativepath = pgpath.replace(/.*[/\\](pages|src)[/\\]/, '');
		// api/xxx/yyy
		const apipath = join(api, relativepath);
		await this.mkdir(apipath);
		// absolutedir/src/pages/pgxxx/[xxx].tsx
		return { api: apipath, page: curfile };
	}
}

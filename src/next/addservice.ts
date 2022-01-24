import { basename, extname, join } from 'path';
import { commands, Position, window, workspace, WorkspaceEdit } from 'vscode';
import Actor from '../actor';
import { get_pages } from './get-pages';

export default class AddServiceNext extends Actor {
	public async do(p?: string): Promise<void> {
		// get api path
		const { api, page } = await this.getapipath(p);
		if (!/[/\\]pages[/\\]api[/\\]?/.test(api)) {
			this.showerror('当前目录不可以创建服务');
			return;
		}

		const no = await this.generate(api, 's', 3);
		const def = join(api, no);

		const sfilepath = await window.showInputBox({
			prompt: 'Please type file uri',
			value: def
		});
		if (!sfilepath) {
			return;
		}

		// create service file
		const servicefile = `${sfilepath}.api.ts`;
		await this.create_api(servicefile);
		await this.create_api_caller(sfilepath);
		await commands.executeCommand('mm.regenerateapis');
		if (page) {
			// update page file
			await this.updatepage(page, sfilepath);
		}
		await this.save();
		this.set_status_bar_message('成功添加服务文件');
		await this.show_doc(page || servicefile);
	}
	
	private async updatepage(pagefile: string, servicefile: string) {
		// api/xxx/yyy/s001
		const doc = await workspace.openTextDocument(pagefile);
		let pos = -1;
		for (let i = 0; i < doc.lineCount; i++) {
			const line = doc.lineAt(i);
			const text = line.text;
			if (/^import\s+.+/.test(text)) {
				pos = i;
			}
		}
		const we = new WorkspaceEdit();
		const pathwithoutext = servicefile;
		const relativepath = this.getrelativepath(join(pagefile, '..'), pathwithoutext);
		const imppath = relativepath.startsWith('.') ? relativepath : `./${relativepath}`;
		const name = this.getimportname( this.str2camelcase(basename(pathwithoutext)), doc.getText());
		
		const imp = `import ${name} from '${imppath}';`;
		const uri = doc.uri;
		const imppos = new Position(pos + 1, 0);
		we.insert(uri, imppos, `${imp}\n`);
		await workspace.applyEdit(we);
	}
	
	private getimportname(name: string, body:string) : string {
		const name1 = `function ${name}`;
		if (body.includes(name1)) {
			return this.getimportname(`${name}_1`, body);
		}
		const name2 = `import ${name}`;
		if (body.includes(name2)) {
			return this.getimportname(`${name}_1`, body);
		}
		return name;
	}

	private create_api_caller(path: string) {
		const filename = basename(path, '.ts');
		const relativepath = this.getrelativepath(join( path, '../'), 'src/atoms/api');
		const api = this.getrelativepath('src/pages',path);
		const tpl = `import smartfetch from '@mmstudio/an000058';
import api from '${relativepath}';
import { Message, Result } from './${filename}.api';

export default async function ${this.str2camelcase(filename)}(msg: Message) {
	const ret = await smartfetch<Result, Message>(api['/${api}'], 'post', msg);
	if(ret.ok === true){
		return ret.data;
	}
	throw new Error(ret.message);
}
`;
		return this.writefile(`${path}.ts`, tpl);
	}

	/**
	 * create service file
	 */
	private create_api(path: string) {
		const relativepath = this.getrelativepath('src', path);
		const rname = 'Result';
		const mname = 'Message';
		const vname = relativepath.replace('.ts', '');
		const tpl = `import { PageConfig } from 'next';
import anylogger from 'anylogger';
import '@mmstudio/an000042';
import an48 from '@mmstudio/an000048';

const logger = anylogger('${vname}');

export type ${rname} = {
	ok: true;
	data:{
	};
} | {
	ok: false;
	message: string;
};

export type ${mname} = {

}

/**
 * ${vname}
 */
const handler = an48<Result>();

handler.post(async(req, res) => {
	try {
		logger.debug('msg body:', req.body);
		const { } = req.body as ${mname};

		res.status(200).json({
			ok: true,
			data:{}
		});
	} catch (error) {
		logger.error(error);
		logger.trace(error);
		res.status(200).json({ ok: false, message: (error as Error).message });
	}
});

export const config = {} as PageConfig;

export default handler;
`;
		return this.writefile(path, tpl);
	}

	private async getapipath(path?: string) {
		const apiroot = join(this.root(), 'src', 'pages', 'api');
		const curdir = await this.getcurpath(path, apiroot);
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
			return { api: apiroot, page: null };
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
		// absolutedir/src/pages/pgxxx/[xxx].tsx
		return { api: apipath, page: curfile };
	}
}

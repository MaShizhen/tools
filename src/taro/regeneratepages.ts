import { join } from 'path';
import { FileType, Position, Uri, workspace, WorkspaceEdit } from 'vscode';
import Actor from '../actor';

export default class RegenerateTaroPages extends Actor {
	public async do(): Promise<void> {
		const pages = await this.getallpages();
		await this.updateatompages(pages);
		await this.updateappconfig(pages);
	}
	private async updateatompages(pages: string[]) {
		const root = this.root();
		const values = pages.reduce((pre, cur) => {
			const url = `/${cur}`;
			return {
				...pre,
				[url]: url
			};
		}, {} as Record<string, string>);
		const apiuri = Uri.file(join(root, 'src', 'atoms', 'pages.ts'));
		const we = new WorkspaceEdit();
		we.createFile(apiuri, {
			overwrite: true,
			ignoreIfExists: false
		});
		await workspace.applyEdit(we);
		we.insert(apiuri, new Position(0, 0), `export default ${JSON.stringify(values, null, '\t').replace(/"/g, '\'')};
`);
		await workspace.applyEdit(we);
	}

	private async updateappconfig(pages: string[]) {
		pages = pages.map((it) => {
			return `'${ it }'`;
		});
		const root = this.root();
		const configfile = join(root, 'src', 'app.config.ts');
		const content = await this.readfile(configfile);
		const regarr = /pages:\s*\[([\s\S]*?)\]/.exec(content);
		if (!regarr) {
			this.showerror('Coult not get pages in src/app.config.ts');
			return;
		}
		const newcontent = content.replace(/(pages:\s*\[)[\s\S]*?(\])/, `$1\r\n\t\t${pages.join(',\r\n\t\t')}\r\n\t$2`);
		await this.writefile(configfile, newcontent);
	}

	private async getallpages() {
		const fs = workspace.fs;
		const root = this.root();
		const getrelativepath = this.getrelativepath;
		const src = join(root, 'src');
		const exists = this.exists;
		async function read(dir: string): Promise<string[]> {
			const sub = await fs.readDirectory(Uri.file(dir));
			const ps = sub.map(async ([subdir, type]) => {
				if (FileType.Directory === type) {
					const fullpath = join(dir, subdir);
					return read(fullpath);
				} else if (FileType.File === type) {
					if (subdir.endsWith('.tsx')) {
						const page = subdir.replace(/\.tsx$/, '');
						const config = join(dir, `${page}.config.ts`);
						if (await exists(config)) {
							const fullpath = join(dir, page);
							const url = getrelativepath(src, fullpath);
							return [url];
						}
					}
				}
				return [];
			});
			const all = await Promise.all(ps);
			return all.flat();
		}
		const pages = await read(join(root, 'src', 'pages'));
		return pages.sort((a, b) => {
			if (a === b) {
				return 0;
			}
			return a > b ? 1: -1;
		});
	}
}

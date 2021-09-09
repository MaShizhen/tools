import { join } from 'path';
import { FileType, Position, Uri, workspace, WorkspaceEdit } from 'vscode';
import Actor from '../actor';

export default class RegenerateNextPages extends Actor {
	public async do(): Promise<void> {
		const values = {} as Record<string,string>;
		const fs = workspace.fs;

		const root = this.root();
		const getrelativepath = this.getrelativepath;
		const pages = join(root, 'src', 'pages');
		async function read(dir: string) {
			const sub = await fs.readDirectory(Uri.file(dir));
			const ps = sub.map(async ([subdir, type]) => {
				if (FileType.Directory === type) {
					if (subdir !== 'api') {
						const fullpath = join(dir, subdir);
						await read(fullpath);
					}
				} else if (FileType.File === type) {
					if (subdir.endsWith('.page.tsx')) {
						const page = subdir.replace(/\.page\.tsx$/, '');
						if (/^index$/.test(page)) {
							const url = `/${getrelativepath(pages, dir)}`;
							values[url] = url;
						} else if (/^\[[^.]+\]$/.test(page)) {
							const key = `/${getrelativepath(pages, join(dir, page))}`;
							const fullpath = dir;
							const url = `/${getrelativepath(pages, fullpath)}`;
							values[key] = url;
						} else if (/^(\[[.]{3}.+\])$/.test(page)) {
							const key = `/${getrelativepath(pages, join(dir, page))}`;
							const url = `/${getrelativepath(pages, dir)}`;
							// const key = service.replace(/[[\]]/g, '');
							// api[service.replace(/[[\]]/g, '')] = url;
							values[key] = url;
						} else {
							const fullpath = join(dir, page);
							const url = `/${getrelativepath(pages, fullpath)}`;
							values[url] = url;
						}
					}
				}
			});
			await Promise.all(ps);
		}
		await read(join(root, 'src', 'pages'));
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
}

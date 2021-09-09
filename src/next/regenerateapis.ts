import { join } from 'path';
import { FileType, Position, Uri, workspace, WorkspaceEdit } from 'vscode';
import Actor from '../actor';

export default class RegenerateAPIs extends Actor {
	public async do(): Promise<void> {
		const api = {} as Record<string,string>;
		const fs = workspace.fs;

		const root = this.root();
		const getrelativepath = this.getrelativepath;
		const pages = join(root, 'src', 'pages');
		async function read(dir: string) {
			const sub = await fs.readDirectory(Uri.file(dir));
			const ps = sub.map(async ([subdir, type]) => {
				if (FileType.Directory === type) {
					const fullpath = join(dir, subdir);
					await read(fullpath);
				} else if (FileType.File === type) {
					if (subdir.endsWith('.api.ts')) {
						const service = subdir.replace(/\.api\.ts$/, '');
						if (/^(\[.+\]|index)$/.test(service)) {
							const fullpath = dir;
							const url = `/${getrelativepath(pages, fullpath)}`;
							// const key = service.replace(/[[\]]/g, '');
							// api[service.replace(/[[\]]/g, '')] = url;
							api[`${url}/${service.replace(/[[\]]/g, '')}`] = url;
						} else {
							const fullpath = join(dir, service);
							const url = `/${getrelativepath(pages, fullpath)}`;
							api[url] = url;
						}
					}
				}
			});
			await Promise.all(ps);
		}
		await read(join(root, 'src', 'pages', 'api'));
		const apiuri = Uri.file(join(root, 'src', 'atoms', 'api.ts'));
		const we = new WorkspaceEdit();
		we.createFile(apiuri, {
			overwrite: true,
			ignoreIfExists: false
		});
		await workspace.applyEdit(we);
		we.insert(apiuri, new Position(0, 0), `export default ${JSON.stringify(api, null, '\t').replace(/"/g, '\'')};
`);
		await workspace.applyEdit(we);
	}
}

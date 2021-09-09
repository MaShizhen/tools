import { join } from 'path';
import { FileType, Position, Uri, workspace, WorkspaceEdit } from 'vscode';
import Actor from '../actor';

export default class RegenerateTaroPages extends Actor {
	public async do(): Promise<void> {
		const values = {} as Record<string,string>;
		const fs = workspace.fs;

		const root = this.root();
		const getrelativepath = this.getrelativepath;
		const src = join(root, 'src');
		const exists = this.exists;
		async function read(dir: string) {
			const sub = await fs.readDirectory(Uri.file(dir));
			const ps = sub.map(async ([subdir, type]) => {
				if (FileType.Directory === type) {
						const fullpath = join(dir, subdir);
						await read(fullpath);
				} else if (FileType.File === type) {
					if (subdir.endsWith('.tsx')) {
						const page = subdir.replace(/\.tsx$/, '');
						const config = join(dir, `${page}.config.ts`);
						if (await exists(config)) {
							const fullpath = join(dir, page);
							const url = `/${getrelativepath(src, fullpath)}`;
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

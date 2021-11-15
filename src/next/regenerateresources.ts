import { join } from 'path';
import { FileType, Position, Uri, workspace, WorkspaceEdit } from 'vscode';
import Actor from '../actor';

export default class RegenerateNextResources extends Actor {
	public async do(): Promise<void> {
		const values = {} as Record<string,string>;
		const fs = workspace.fs;

		const root = this.root();
		const getrelativepath = this.getrelativepath;
		const pblc = join(root, 'public');
		async function read(dir: string) {
			const sub = await fs.readDirectory(Uri.file(dir));
			const ps = sub.map(async ([subdir, type]) => {
						const fullpath = join(dir, subdir);
				if (FileType.Directory === type) {
						await read(fullpath);
				} else if (FileType.File === type) {
							const url = `/${getrelativepath(pblc, fullpath)}`;
							values[url] = url;
				}
			});
			await Promise.all(ps);
		}
		await read(join(root, 'public'));
		const apiuri = Uri.file(join(root, 'src', 'atoms', 'res.ts'));
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

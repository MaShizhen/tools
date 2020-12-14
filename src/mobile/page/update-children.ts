import { join } from 'path';
import Actor from '../../actor';

export default class UpdateChildren extends Actor {
	public constructor(private path: string) {
		super();
	}
	public async do(): Promise<void> {
		const path = this.path;
		const isapppage = await this.isapp(path);
		const file_name = isapppage ? join(path, 'app', 'app.ts') : join(path, 'p.ts');
		const eol = '\n';
		const files = await this.readdir(path);
		const ps = files.filter((f) => {
			return /^(c|pg)\d{3}$/.test(f);
		});

		const imps = ps.map((it) => {
			if (isapppage) {
				return `import ${it} from '../${it}/p';`;
			}
			return `import ${it} from './${it}/p';`;
		}).join(eol);

		const components = ps.map((it) => {
			return `${it}()`;
		}).join(', ');

		await this.replace(file_name, 'IMPCOMPONENTS', imps);
		await this.replace(file_name, 'COMPONENTS', components);
	}
	private isapp(src: string) {
		const path = join(src, 'app', 'app.ts');
		return this.exists(path);
	}
}

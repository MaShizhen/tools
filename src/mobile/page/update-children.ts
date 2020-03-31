import { join } from 'path';
import replace from '../../util/replace';
import { readdirSync } from '../../util/fs';
import { isapp } from './isapp';

export default async function updatechildren(path: string) {
	const isapppage = await isapp(path);
	const file_name = isapppage ? join(path, 'app', 'app.ts') : join(path, 'p.ts');
	const eol = '\n';
	const files = await readdirSync(path);
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

	await replace(file_name, 'IMPCOMPONENTS', imps);
	await replace(file_name, 'COMPONENTS', components);
}

import { join } from 'path';
import { readdirasync } from './fs';

export default async function generate(path: string, prefix: string, postfix: string, len: number) {
	const files = await readdirasync(path);
	const reg = new RegExp(`^${prefix}\\d{${len}}${postfix}$`);
	const l = prefix.length;
	const as = files.filter((f) => {
		return reg.test(f);
	}).map((f) => {
		return parseInt(f.substr(l), 10);
	});
	if (as.length === 0) {
		as.push(0);
	}
	const num = Math.max(...as) + 1;
	const new_file = prefix + (Array<string>(len).join('0') + num.toString()).slice(-len);
	return join(path, new_file);
}

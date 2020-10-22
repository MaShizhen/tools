import { join, relative } from 'path';
import root from '../util/root';
import { readdirasync, readfileasync, writefileasync } from '../util/fs';

interface Link {
	name: string;
	addr: string;
}

interface Section extends Link {
	sub: Link[];
}

export default async function sitemapserve() {
	const rt = await root();
	const mdfile = join(rt, '.mm.md');
	const map = await md2map(mdfile);
	const src = join(rt, 'src');
	const all = await readdirasync(src);
	const pages = [] as Section[];
	const atoms = { name: '项目自定义服务端原子操作', addr: '#项目自定义服务端原子操作', sub: [] } as Section;
	function add(rs: Link[], name: string, l: string) {
		const addr = relative(rt, l);
		const nm = map.get(addr);
		rs.push({
			addr,
			name: nm ? nm : name
		});
		return rs;
	}
	await Promise.all(all.map(async (dir) => {
		const d = join(src, dir);
		if (dir.endsWith('atoms')) {
			const subs = await readdirasync(d);
			subs.forEach((it) => {
				if (it.startsWith('anp')) {
					add(atoms.sub, it, join(d, it, 'index.ts'));
				}
			});
		} else if (/pg\d{3}/.test(dir)) {
			try {
				const d = join(src, dir);
				const services = await readdirasync(d);
				const sub = await Promise.all(services.filter((it) => {
					return /s\d{3}/.test(it);
				}).map((it) => {
					const l = join(d, it);
					const addr = relative(rt, l);
					const nm = map.get(addr);
					return {
						addr,
						name: nm ? nm : it
					};
				}));
				if (services.length > 0) {
					const addr = relative(rt, d);
					const nm = map.get(addr);
					pages.push({
						addr,
						name: nm ? nm : dir,
						sub
					});
				}
			} catch {
				// 空文件夹
			}
		}
	}));
	const md = [...pages, atoms].map((it) => {
		return it.sub.reduce((pre, cur) => {
			pre.push(`- ${l2t(cur)}`);
			return pre;
		}, [`## ${l2t(it)}`, '']).join('\n');
	}).join('\n\n');
	await writefileasync(mdfile, `# 页面地图

页面/原子操作名称可以手动编辑，以获得更好的实用效果。更新操作不会修改名称，如果确实需要自动修改，可先删除需要修改的行，然后重新全部更新即可。

${md}
`);
}

function l2t(link: Link) {
	return `[${link.name}](${link.addr})`;
}

async function md2map(mdfile: string) {
	try {
		const text = await readfileasync(mdfile);
		const reg = /##[^#]/g;
		let lastpos = -1;
		const blocks = [];
		let match;
		while ((match = reg.exec(text))) {
			if (lastpos > -1) {
				const t = text.substring(lastpos, match.index - 1);
				blocks.push(t);
			}
			lastpos = match.index;
		}
		if (lastpos > -1) {
			const t = text.substring(lastpos);
			blocks.push(t);
		}

		return blocks.reduce((m, block) => {
			const [h, ...body] = block.split('\n');
			const [, name, path] = /^## \[(.*)\]\((.*)\)/.exec(h)!;	// [pg001](./src/pg001/html.ts)
			m.set(path, name);

			const zj = /^- \[(.*)\]\((.*)\)/;	// - [zj-001](./src/pg001/zj-001/tpl.tpl)
			body.filter((line) => {
				return zj.test(line);
			}).forEach((line) => {
				const [, name, path] = zj.exec(line)!;
				m.set(path, name);
			});
			return m;
		}, new Map<string, string>());
	} catch {
		return new Map<string, string>();
	}
}

import { basename, join } from 'path';
import { commands, Position, QuickPickItem, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import nodejs from '../nodejs/atom/add-common';
import web from '../web/atom/add-common';
import { PrjType } from '../util/prj-type';
import root from '../util/root';
import generate from '../util/generate';

type AtomType = PrjType | 'nodejs';

const ac = new Map<AtomType, () => Promise<unknown>>();
ac.set('nodejs', nodejs);
ac.set(PrjType.web, web);

// prifix
const ap = new Map<AtomType, string>();
ap.set('nodejs', 'acn');
ap.set(PrjType.web, 'ac');
ap.set(PrjType.wxapp, 'ac');
ap.set(PrjType.mobile, 'ac');
ap.set(PrjType.desktop, 'ac');

export default function add() {
	return commands.registerCommand('mm.atom.add', async () => {
		const p1 = await window.showQuickPick(get_types(), {
			placeHolder: '请选择项目端点类型',
			matchOnDescription: true,
			matchOnDetail: true
		});
		if (!p1) {
			return;
		}
		const p2 = await window.showQuickPick([
			{
				description: '只在该项目可用，多个项目无法共用',
				label: '1.项目级原子操作',
				detail: '具体操作需要参考相关文档<https://mm-edu.gitee.io>',
				prj: true
			},
			{
				description: '所有项目均将可用，编写相对较为复杂',
				label: '2.通用原子操作',
				prj: false
			}], {
			placeHolder: '请选择原子操作类型',
			matchOnDescription: true,
			matchOnDetail: true
		});
		if (!p2) {
			return;
		}
		const isprj = p2.prj;
		if (isprj) {
			const s = await window.showInputBox({
				value: '2',
				prompt: '请设置参数个数，该操作为初始操作，后期仍需要修改use.snippet和index.ts文件',
				validateInput(v) {
					try {
						const n = parseInt(v, 10);
						if (n >= 0) {
							return null;
						}
						return '参数个数不能小于0';
					} catch (error) {
						return '不能为空';
					}
				}
			});
			if (!s) {
				return;
			}
			const d = await window.showInputBox({
				prompt: '原子操作描述',
				validateInput(v) {
					if (!v) {
						return '不能为空';
					}
					return null;
				}
			});
			if (!d) {
				return;
			}
			const n = parseInt(s, 10);
			const rt = root();
			const prefix = ap.get(p1.type)!;
			const dir = join(rt, 'src', 'atom', prefix);
			await workspace.fs.createDirectory(Uri.file(dir));
			const atom_dir = await generate(dir, prefix, '', 3);
			const no = basename(atom_dir);
			const we = new WorkspaceEdit();
			const postfix = p1.type === PrjType.mobile ? 'tsx' : 'ts';
			const ts = Uri.file(join(atom_dir, `index.${postfix}`));
			we.createFile(ts, { overwrite: true });
			we.insert(ts, new Position(0, 0), generate_ts(no, n));
			const snippet = Uri.file(join(atom_dir, 'use.snippet'));
			we.createFile(snippet, { overwrite: true });
			we.insert(snippet, new Position(0, 0), generate_usage(d, no, n));
			await workspace.applyEdit(we);
			window.showInformationMessage('原子操作模板已生成');
			const doc = await workspace.openTextDocument(ts);
			window.showTextDocument(doc);
			await workspace.saveAll();
		} else {
			const fun = ac.get(p1.type);
			if (fun) {
				await fun();
			} else {
				window.showErrorMessage('敬请期待');
			}
		}
	});
}

function generate_ts(no: string, n: number) {
	const arr = new Array<number>(n).fill(0).map((_it, i) => {
		return i + 1;
	});
	const ps = arr.map((i) => {
		return `param${i}: string`;
	});
	return `
export default async function ${no.replace(/([a-z]+)0+(\d+)/, '$1$2')}(${ps.join(', ')}) {
}
`;
}

function generate_usage(description: string, no: string, n: number) {
	const arr = new Array<number>(n).fill(0).map((_it, i) => {
		return i + 1;
	});
	const params = arr.map((i) => {
		return `\t\tconst param${i} = $${i};	// todo add param description`;
	});
	const ps = arr.map((i) => {
		return `param${i}`;
	});
	const t1 = `\t// ${description}`;
	const t2 = '\tconst r$CURRENT_SECONDS_UNIX = await(() => {';
	const t3 = `\t\treturn ${no.replace(/([a-z]+)0+(\d+)/, '$1$2')}(${ps.join(', ')});`;
	const t4 = '\t})();';
	return [t1, t2, ...params, t3, t4].join('\n');
}

interface SelectAtomTypeItem extends QuickPickItem {
	type: AtomType;
}

function get_types(): SelectAtomTypeItem[] {
	const conf = workspace.getConfiguration();
	const ins = conf.inspect<string>('mm.proj.type');
	if (ins && ins.workspaceValue) {
		const type = ins.workspaceValue as PrjType;
		return [
			{
				detail: '1.服务端原子操作',
				label: 'nodejs',
				type: 'nodejs'
			},
			{
				detail: '2.客户端原子操作',
				label: type,
				type
			}];
	}
	return [
		{
			detail: '1.服务端原子操作',
			label: 'nodejs',
			type: 'nodejs'
		},
		{
			detail: '2.web/h5原子操作',
			label: 'web/h5',
			type: PrjType.web
		},
		{
			detail: '3.移动端app原子操作',
			label: 'mobile',
			type: PrjType.mobile
		},
		{
			detail: '4.微信小程序原子操作',
			label: 'wxapp',
			type: PrjType.wxapp
		}
	];
}

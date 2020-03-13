import { basename, join } from 'path';
import { commands, QuickPickItem, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import nodejs from '../nodejs/atom/add-common';
import web from '../web/atom/add-common';
import root from '../util/root';
import generate from '../util/generate';
import tplatomusage from '../util/tpl-atom-useage';
import { AtomType } from '../util/atom-type';
import tplatom from '../util/tpl-atom';
import { createfile } from '../util/fs';

const ap = new Map<AtomType, () => Promise<unknown>>();
ap.set(AtomType.node, nodejs);
ap.set(AtomType.web, web);

export default function add_atom() {
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
			const n = parseInt(s, 10);
			const rt = await root();
			const prefix = p1.prefix;
			const dir = join(rt, 'src', 'atom', prefix);
			await workspace.fs.createDirectory(Uri.file(dir));
			const atom_dir = await generate(dir, prefix, '', 3);
			const no = basename(atom_dir);
			const we = new WorkspaceEdit();
			const ts = join(atom_dir, 'index.ts');
			createfile(we, ts, tplatom(no, n));
			createfile(we, join(atom_dir, 'use.snippet'), tplatomusage('原子操作功能描述', no, n));
			createfile(we, join(atom_dir, 'amd.json'), '{}');
			await workspace.applyEdit(we);
			window.showInformationMessage('原子操作模板已生成');
			const doc = await workspace.openTextDocument(ts);
			window.showTextDocument(doc);
			await workspace.saveAll();
		} else {
			const fun = ap.get(p1.type);
			if (fun) {
				await fun();
			} else {
				window.showErrorMessage('敬请期待');
			}
		}
	});
}

interface SelectAtomTypeItem extends QuickPickItem {
	type: AtomType;
	prefix: 'ap' | 'anp';
}

function get_types(): SelectAtomTypeItem[] {
	const conf = workspace.getConfiguration();
	const ins = conf.inspect<string>('mm.proj.type');
	if (ins && ins.workspaceValue) {
		const type = ins.workspaceValue as AtomType;
		return [
			{
				detail: '1.服务端原子操作',
				label: 'nodejs',
				type: AtomType.node,
				prefix: 'anp'
			},
			{
				detail: '2.客户端原子操作',
				label: type,
				type,
				prefix: 'ap'
			}];
	}
	return [
		{
			detail: '1.服务端原子操作',
			label: 'nodejs',
			type: AtomType.node,
			prefix: 'anp'
		},
		{
			detail: '2.web/h5原子操作',
			label: 'web/h5',
			type: AtomType.web,
			prefix: 'ap'
		},
		{
			detail: '3.移动端app原子操作',
			label: 'mobile',
			type: AtomType.mobile,
			prefix: 'ap'
		},
		{
			detail: '4.微信小程序原子操作',
			label: 'wxapp',
			type: AtomType.wxapp,
			prefix: 'ap'
		}
	];
}

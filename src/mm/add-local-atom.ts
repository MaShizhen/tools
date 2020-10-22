import { basename, join } from 'path';
import { commands, QuickPickItem, Uri, window, workspace } from 'vscode';
import root from '../util/root';
import generate from '../util/generate';
import tplatomusage from '../util/tpl-atom-useage';
import { AtomType } from '../util/atom-type';
import tplatom from '../util/tpl-atom';
import { writefileasync } from '../util/fs';
import pickoption from '../util/pickoption';

export default function add_local_atom() {
	return commands.registerCommand('mm.atom.addlocal', async () => {
		const p1 = await (() => {
			const types = get_types();
			if (types.length === 0) {
				return null;
			} else if (types.length === 1) {
				return types[0];
			}
			return window.showQuickPick(types, {
				...pickoption,
				placeHolder: '请选择项目端点类型'
			});
		})();
		if (!p1) {
			return;
		}
		const s = await window.showInputBox({
			value: '2',
			prompt: '请设置参数个数，该操作为初始操作，后期仍需要修改use.snippet和index.ts文件',
			ignoreFocusOut: true,
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
		const dir = join(rt, 'src', 'atoms');
		await workspace.fs.createDirectory(Uri.file(dir));
		const atom_dir = await generate(dir, prefix, '', 3);
		const no = basename(atom_dir);
		const ts = join(atom_dir, 'index.ts');
		await writefileasync(ts, tplatom(no, n));
		await writefileasync(join(atom_dir, 'use.snippet'), tplatomusage('原子操作功能描述', no, n));
		if (p1.type === 'web/h5') {
			await writefileasync(join(atom_dir, 'amd.json'), '[]');
		}
		window.showInformationMessage('原子操作模板已生成');
		const doc = await workspace.openTextDocument(ts);
		window.showTextDocument(doc);
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
		if (type === AtomType.serve) {
			return [
				{
					detail: '1.服务端原子操作',
					label: 'nodejs',
					type: AtomType.node,
					prefix: 'anp'
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

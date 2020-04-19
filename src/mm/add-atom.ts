import { commands, QuickPickItem, window, workspace } from 'vscode';
import nodejs from '../nodejs/add-atom';
import web from '../web/atom/add-common';
import wxapp from '../wxapp/add-atom';
import mobile from '../mobile/add-atom';
import { AtomType } from '../util/atom-type';
import pickoption from '../util/pickoption';

const ap = new Map<AtomType, () => Promise<unknown>>();
ap.set(AtomType.node, nodejs);
ap.set(AtomType.web, web);
ap.set(AtomType.wxapp, wxapp);
ap.set(AtomType.mobile, mobile);

export default function add_atom() {
	return commands.registerCommand('mm.atom.add', async () => {
		const p1 = await window.showQuickPick(get_types(), {
			...pickoption,
			placeHolder: '请选择项目端点类型'
		});
		if (!p1) {
			return;
		}
		const fun = ap.get(p1.type);
		if (fun) {
			await fun();
		} else {
			window.showErrorMessage('敬请期待');
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

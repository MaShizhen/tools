import { commands, window, workspace } from 'vscode';
import nodejs from '../nodejs/atom/add';
import web from '../web/atom/add';
import { PrjType } from '../util/prj-type';

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
				detail: '具体操作需要参考相关文档<https://mmstudio.gitee.com>',	// todo 地址需要替换
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
		switch (p1.type) {
			case 'nodejs':
				await nodejs(isprj);
				break;
			case PrjType.web:
				web(isprj);	// todo add await
				break;
		}
	});
}

function get_types() {
	const conf = workspace.getConfiguration();
	const ins = conf.inspect<string>('mm.proj.type');
	if (ins && ins.workspaceValue) {
		const type = ins.workspaceValue;
		return [
			{
				detail: '1.服务端原子操作',
				label: 'nodejs',
				type: 'nodejs'
			},
			{
				detail: '2.客户端原子操作',
				label: type,
				type: PrjType[type] as string
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

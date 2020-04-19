import { commands, window, workspace } from 'vscode';
import web from '../web/widget/add';
import mobile from '../mobile/widget/add-widgets';
import wxapp from '../wxapp/widget/add-widgets';
import { WidgetType } from '../util/widget-type';
import pickoption from '../util/pickoption';

const pw = new Map<WidgetType, () => Promise<unknown>>();
pw.set(WidgetType.web, web);
pw.set(WidgetType.mobile, mobile);
pw.set(WidgetType.wxapp, wxapp);

export default function addwidget() {
	return commands.registerCommand('mm.widget.add', async () => {
		const type = await get_type();
		if (!type) {
			return;
		}
		const fun = pw.get(type);
		if (fun) {
			await fun();
		} else {
			window.showErrorMessage('敬请期待');
		}
	});
}

async function get_type() {
	const conf = workspace.getConfiguration();
	const ins = conf.inspect<string>('mm.proj.type');
	if (ins && ins.workspaceValue) {
		const type = ins.workspaceValue as WidgetType;
		return type;
	}
	const items = [
		{
			detail: '1.web/h5控件',
			label: 'web/h5',
			type: WidgetType.web
		},
		{
			detail: '2.移动端app控件',
			label: 'mobile',
			type: WidgetType.mobile
		},
		{
			detail: '3.微信小程序控件',
			label: 'wxapp',
			type: WidgetType.wxapp
		}
	];
	const picked = await window.showQuickPick(items, {
		...pickoption,
		placeHolder: '请选择项目端点类型'
	});
	return picked && picked.type;
}

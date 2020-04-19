import { basename, join } from 'path';
import { commands, window, workspace } from 'vscode';
import root from '../util/root';
import generate from '../util/generate';
import { WidgetType } from '../util/widget-type';
import tplwidgetweb from '../web/widget/tpl-web-widget';
import tplwidgetmobile from '../mobile/widget/tpl-widget';
import tplwidgetwxapp from '../wxapp/widget/tpl-widget';
import tplwidgetusageweb from '../web/widget/tpl-web-widget-useage';
import tplwidgetusagemobile from '../mobile/widget/tpl-widget-useage';
import tplwidgetusagewxapp from '../wxapp/widget/tpl-widget-useage';
import { mkdirasync, writefileasync } from '../util/fs';
import pickoption from '../util/pickoption';

export default function add_local_widget() {
	return commands.registerCommand('mm.widget.addlocal', async () => {
		const type = await get_type();
		if (!type) {
			return;
		}
		const rt = await root();
		const prefix = 'pw';	// not wc, we wish local wigets list before remote when searching. cw means client widget
		const dir = join(rt, 'src', 'widgets');
		await mkdirasync(dir);
		const atom_dir = await generate(dir, prefix, '', 3);
		const no = basename(atom_dir);
		const postfix = type === WidgetType.mobile ? 'tsx' : 'ts';
		const ts = join(atom_dir, `index.${postfix}`);
		const tscontent = (() => {
			switch (type) {
				case WidgetType.web:
					return tplwidgetweb(no, true);
				case WidgetType.mobile:
					return tplwidgetmobile(no);
				case WidgetType.wxapp:
					return tplwidgetwxapp('');
				default:
					return '';
			}
		})();
		await writefileasync(ts, tscontent);
		const usecontent = (() => {
			switch (type) {
				case WidgetType.web:
					return tplwidgetusageweb(no, true);
				case WidgetType.mobile:
					return tplwidgetusagemobile(no);
				case WidgetType.wxapp:
					return tplwidgetusagewxapp(no, true);
				default:
					return '';
			}
		})();
		await writefileasync(join(atom_dir, 'use.snippet'), usecontent);
		if (type === WidgetType.web) {
			await writefileasync(join(atom_dir, 'amd.json'), '[]');
		} else if (type === WidgetType.wxapp) {
			await writefileasync(join(atom_dir, 'index.json'), '{}');
			await writefileasync(join(atom_dir, 'index.wxml'), '');
			await writefileasync(join(atom_dir, 'index.wxss'), '');
		}
		window.showInformationMessage('控件模板已生成');
		const doc = await workspace.openTextDocument(ts);
		window.showTextDocument(doc);
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

import { basename, join } from 'path';
import { commands, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import web from '../web/widget/add';
import mobile from '../mobile/widget/add-widgets';
import root from '../util/root';
import generate from '../util/generate';
import { WidgetType } from '../util/widget-type';
import tplwidgetweb from '../web/widget/tpl-web-widget';
import tplwidgetmobile from '../mobile/widget/tpl-widget';
import tplwidgetusageweb from '../web/widget/tpl-web-widget-useage';
import tplwidgetusagemobile from '../mobile/widget/tpl-widget-useage';
import { createfile } from '../util/fs';
import pickoption from '../util/pickoption';

const pw = new Map<WidgetType, () => Promise<unknown>>();
pw.set(WidgetType.web, web);
pw.set(WidgetType.mobile, mobile);

export default function add() {
	return commands.registerCommand('mm.widget.add', async () => {
		const type = await get_type();
		if (!type) {
			return;
		}
		const p2 = await window.showQuickPick([
			{
				description: '只在该项目可用，多个项目无法共用',
				label: '1.项目级控件',
				detail: '具体操作需要参考相关文档<https://mmstudio.gitee.io>',
				prj: true
			},
			{
				description: '所有项目均将可用，编写相对较为复杂',
				label: '2.通用控件',
				prj: false
			}], {
			...pickoption,
			placeHolder: '请选择原子操作类型'
		});
		if (!p2) {
			return;
		}
		const isprj = p2.prj;
		if (isprj) {
			const rt = await root();
			const prefix = 'pw';	// not wc, we wish local wigets list before remote when searching. cw means client widget
			const dir = join(rt, 'src', 'widgets');
			await workspace.fs.createDirectory(Uri.file(dir));
			const atom_dir = await generate(dir, prefix, '', 3);
			const no = basename(atom_dir);
			const we = new WorkspaceEdit();
			const postfix = type === WidgetType.mobile ? 'tsx' : 'ts';
			const ts = join(atom_dir, `index.${postfix}`);
			const tscontent = (() => {
				switch (type) {
					case WidgetType.web:
						return tplwidgetweb(no, true);
					case WidgetType.mobile:
						return tplwidgetmobile(no);
					default:
						return '';
				}
			})();
			createfile(we, ts, tscontent);
			const usecontent = (() => {
				switch (type) {
					case WidgetType.web:
						return tplwidgetusageweb(no, true);
					case WidgetType.mobile:
						return tplwidgetusagemobile(no);
					default:
						return '';
				}
			})();
			createfile(we, join(atom_dir, 'use.snippet'), usecontent);
			if (type === WidgetType.web) {
				createfile(we, join(atom_dir, 'amd.json'), '[]');
			}
			await workspace.applyEdit(we);
			window.showInformationMessage('控件模板已生成');
			const doc = await workspace.openTextDocument(ts);
			window.showTextDocument(doc);
			await workspace.saveAll();
		} else {
			const fun = pw.get(type);
			if (fun) {
				await fun();
			} else {
				window.showErrorMessage('敬请期待');
			}
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

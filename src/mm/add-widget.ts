import { basename, join } from 'path';
import { commands, Position, Uri, window, workspace, WorkspaceEdit } from 'vscode';
import web from '../web/widget/add';
import root from '../util/root';
import generate from '../util/generate';
import { WidgetType } from '../util/widget-type';
import tplwidget from '../web/widget/tpl-web-widget';
import tplwidgetusage from '../web/widget/tpl-web-widget-useage';

const pw = new Map<WidgetType, () => Promise<unknown>>();
pw.set(WidgetType.web, web);

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
				detail: '具体操作需要参考相关文档<https://mm-edu.gitee.io>',
				prj: true
			},
			{
				description: '所有项目均将可用，编写相对较为复杂',
				label: '2.通用控件',
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
			const rt = root();
			const prefix = 'pw';	// not wc, we wish local wigets list before remote when searching. cw means client widget
			const dir = join(rt, 'src', 'widgets');
			await workspace.fs.createDirectory(Uri.file(dir));
			const atom_dir = await generate(dir, prefix, '', 3);
			const no = basename(atom_dir);
			const we = new WorkspaceEdit();
			const postfix = type === WidgetType.mobile ? 'tsx' : 'ts';
			const ts = Uri.file(join(atom_dir, `index.${postfix}`));
			we.createFile(ts, { overwrite: true });
			we.insert(ts, new Position(0, 0), tplwidget(no, true));
			const snippet = Uri.file(join(atom_dir, 'use.snippet'));
			we.createFile(snippet, { overwrite: true });
			we.insert(snippet, new Position(0, 0), tplwidgetusage(no, true));
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
		placeHolder: '请选择项目端点类型',
		matchOnDescription: true,
		matchOnDetail: true
	});
	return picked && picked.type;
}

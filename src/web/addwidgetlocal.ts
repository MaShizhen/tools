import { basename, join } from 'path';
import { TextEditor, window } from 'vscode';
import tplwidgetweb from '../web/widget/tpl-web-widget';
import tplwidgetusageweb from '../web/widget/tpl-web-widget-useage';
import Actor from '../actor';

export default class AddWidgetLocalWeb extends Actor {
	public do(_editor: TextEditor): Promise<void> {
		throw new Error('Method not implemented.');
	}
	public async act(): Promise<void> {
		const rt = this.root();
		const prefix = 'pw';	// not wc, we wish local wigets list before remote when searching. cw means client widget
		const dir = join(rt, 'src', 'widgets');
		await this.mkdirasync(dir);
		const atom_dir = await this.generate(dir, prefix, '', 3);
		const no = basename(atom_dir);
		const postfix = 'ts';
		const ts = join(atom_dir, `index.${postfix}`);
		const tscontent = tplwidgetweb(no, true);
		await this.writefileasync(ts, tscontent);
		const usecontent = tplwidgetusageweb(no, true);
		await this.writefileasync(join(atom_dir, 'use.snippet'), usecontent);
		await this.writefileasync(join(atom_dir, 'amd.json'), '[]');
		window.showInformationMessage('控件模板已生成');
		this.show_doc(ts);
	}
}

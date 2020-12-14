import { basename, join } from 'path';
import { TextEditor, window } from 'vscode';
import tplwidgetwxapp from '../wxapp/widget/tpl-widget';
import tplwidgetusagewxapp from '../wxapp/widget/tpl-widget-useage';
import Actor from '../actor';

export default class AddWidgetLocalWx extends Actor {
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
		const tscontent = tplwidgetwxapp('');
		await this.writefileasync(ts, tscontent);
		const usecontent = tplwidgetusagewxapp(no, true);
		await this.writefileasync(join(atom_dir, 'use.snippet'), usecontent);
		await this.writefileasync(join(atom_dir, 'index.json'), '{}');
		await this.writefileasync(join(atom_dir, 'index.wxml'), '');
		await this.writefileasync(join(atom_dir, 'index.wxss'), '');
		window.showInformationMessage('控件模板已生成');
		this.show_doc(ts);
	}
}

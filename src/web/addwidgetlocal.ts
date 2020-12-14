import { basename, join } from 'path';
import { window } from 'vscode';
import Actor from '../actor';
import TplWeb from './tpl';

export default class AddWidgetLocalWeb extends Actor {
	private tpl = new TplWeb();
	public async do(): Promise<void> {
		const rt = this.root();
		const prefix = 'pw';	// not wc, we wish local wigets list before remote when searching. cw means client widget
		const dir = join(rt, 'src', 'widgets');
		await this.mkdir(dir);
		const atom_dir = await this.generate(dir, prefix, '', 3);
		const no = basename(atom_dir);
		const postfix = 'ts';
		const ts = join(atom_dir, `index.${postfix}`);
		const tscontent = this.tpl.widget(no, true);
		await this.writefile(ts, tscontent);
		const usecontent = this.tpl.widgetusage(no, true);
		await this.writefile(join(atom_dir, 'use.snippet'), usecontent);
		await this.writefile(join(atom_dir, 'amd.json'), '[]');
		window.showInformationMessage('控件模板已生成');
		this.show_doc(ts);
	}
}

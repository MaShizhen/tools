import { basename, join } from 'path';
import { Uri, window, workspace } from 'vscode';
import Actor from '../actor';
import TplUtil from '../util/tpl';

export default class AddAtomLocal extends Actor {
	private tpl = new TplUtil();
	public async do(): Promise<void> {
		const p1 = await this.pick([
			{
				detail: '1.服务端原子操作',
				label: 'serve',
				prefix: 'anp'
			},
			{
				detail: '2.客户端原子操作',
				label: 'client',
				prefix: 'ap'
			}], '请选择项目端点类型');
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
		const rt = this.root();
		const prefix = p1.prefix;
		const dir = join(rt, 'src', 'atoms');
		await workspace.fs.createDirectory(Uri.file(dir));
		const atom_dir = await this.generate(dir, prefix, '', 3);
		const no = basename(atom_dir);
		const ts = join(atom_dir, 'index.ts');
		await this.writefile(ts, this.tpl.atom(no, n));
		await this.writefile(join(atom_dir, 'use.snippet'), this.tpl.atomusage('原子操作功能描述', no, n));
		// if (p1.type === 'web/h5') {
		// 	await writefileasync(join(atom_dir, 'amd.json'), '[]');
		// }
		window.showInformationMessage('原子操作模板已生成');
		this.show_doc(ts);
	}
}
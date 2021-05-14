import { join } from 'path';
import { window } from 'vscode';
import Actor from '../actor';

export default class AddComponentNext2 extends Actor {
	public async do(d?: string): Promise<void> {
		const dir = await this.getdirorbypath(d);
		if (!dir) {
			this.showerror('不能在当前页面插入组件');
			return;
		}
		const name = await this.generate(dir, 'c', 3);
		const f = await window.showInputBox({
			prompt: 'type name',
			placeHolder: 'component name',
			value: name
		});
		if (!f) {
			return;
		}
		const file = f.toLowerCase();
		const cname = f.toUpperCase();
		const fullpath = join(dir, `${file}.tsx`);
		const tpl = `
export default function ${cname}() {
	return <>
	</>;
}
`;
		await this.writefile(fullpath, tpl);
		this.set_status_bar_message('成功添加组件');
		await this.show_doc(fullpath);
	}
}

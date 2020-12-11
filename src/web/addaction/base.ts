import { TextEditor } from 'vscode';
import Tools from '../../tools';
import reg_in_comment from '../../util/reg-in-component';

export default abstract class Base extends Tools {
	public abstract addaction(editor: TextEditor): Promise<void>;
	protected abstract async update_b(path: string): Promise<void>;
	protected abstract create_a(path: string): Promise<string>;
	protected reg_in_comment(path: string) {
		return reg_in_comment(path);
	}
}

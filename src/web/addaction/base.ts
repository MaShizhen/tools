import { TextEditor } from 'vscode';
import Tools from '../../tools';

export default abstract class AddActionWebBase extends Tools {
	public abstract addaction(editor: TextEditor): Promise<void>;
	protected abstract async update_b(path: string): Promise<void>;
	protected abstract create_a(path: string): Promise<string>;
}

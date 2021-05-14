import { TextEditor } from 'vscode';
import Tools from './tools';

export default abstract class Actor extends Tools {
	public abstract do(editororpath?: TextEditor | string): Promise<void>;
}

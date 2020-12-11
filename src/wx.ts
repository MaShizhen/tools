import { TextEditor } from 'vscode';
import Base from './base';
import AddActionWeixinPage from './wxapp/addaction/page';

export default class WeiXin extends Base {
	public addaction(editor: TextEditor): Promise<void> {
		return new AddActionWeixinPage().addaction(editor);
	}
}

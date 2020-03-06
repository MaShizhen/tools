import { ExtensionContext } from 'vscode';
import adda from './mm/addaction';
import addc from './mm/addc';
import addp2 from './mm/addp';
import addp from './mm/addpage';
import addr from './mm/addrouter';
import adds from './mm/addservice';
import list_events from './mm/list-events';
import shell_build from './mm/shell/build';
import create_proj from './mm/shell/create';
import shell_debug from './mm/shell/debug';
import atom from './mm/snippets/atom';
import tpl from './mm/snippets/tpl';
import widget from './mm/snippets/widget';
import list_services from './nodejs/list-services';

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		adda(),
		addc(),
		adds(),
		addp(),
		addp2(),
		addr(),
		atom(),
		tpl(),
		widget(),
		list_events(),
		list_services(),
		shell_debug(),
		shell_build(),
		create_proj()
	);
}

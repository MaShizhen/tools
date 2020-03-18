import { ExtensionContext } from 'vscode';
import adda from './mm/addaction';
import addc from './mm/addc';
import addtpl from './mm/add-tpl';
import addpage from './mm/addpage';
import addwebrouters from './mm/add-web-routers';
import adds from './mm/addservice';
import list_events from './mm/list-events';
import shell_build from './mm/shell/build';
import create_proj from './mm/shell/create';
import shell_debug from './mm/shell/debug';
import insert_atom from './mm/snippets/insert-atom';
import insert_tpl from './mm/snippets/insert-tpl';
import insert_widget from './mm/snippets/insert-widget';
import list_services from './nodejs/list-services';
import addatom from './mm/add-atom';
import addwidget from './mm/add-widget';
import addwebfilter from './mm/add-web-filter';
import addschedule from './mm/add-schedule';

export function activate(context: ExtensionContext) {
	context.subscriptions.push(
		adda(),
		addc(),
		adds(),
		addpage(),
		addtpl(),
		addwebrouters(),
		insert_atom(),
		insert_tpl(),
		insert_widget(),
		list_events(),
		list_services(),
		shell_debug(),
		shell_build(),
		create_proj(),
		addatom(),
		addwidget(),
		addwebfilter(),
		addschedule()
	);
}

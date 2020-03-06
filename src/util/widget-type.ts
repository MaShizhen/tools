import { workspace } from 'vscode';

export enum WidgetType {
	web = 'web/h5',
	wxapp = 'wxapp',
	desktop = 'desktop',
	mobile = 'mobile'
}

export default function widget_type() {
	return workspace.getConfiguration().get('mm.widget.type', 'web/h5' as WidgetType);
}

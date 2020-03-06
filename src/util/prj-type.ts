import { workspace } from 'vscode';

export enum PrjType {
	web = 'web/h5',
	wxapp = 'wxapp',
	desktop = 'desktop',
	mobile = 'mobile'
}

export default function prj_type() {
	return workspace.getConfiguration().get('mm.proj.type', 'web/h5' as PrjType);
}

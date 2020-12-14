import Tools from '../tools';

export default class TplWX extends Tools {
	public widgetusage(no: string, project: boolean) {
		no = no.replace(/[a-z]*/, '');
		const prefix = project ? 'mm-p' : 'mm-';
		const tag = `${prefix}${no}`;
		return `<${tag}></${tag}>`;
	}
	public widget(desc: string) {
		return `/**
 * ${desc}
 */
Component({
	/**
	 * 组件的属性列表
	 */
	options: {
	},
	properties: {
	},

	methods: {
	}
});
`;
	}

}

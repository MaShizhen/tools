import c from './common';
import prj from './prj';

export default function add(is_proj: boolean) {
	if (is_proj) {
		return prj();
	}
	return c();
}

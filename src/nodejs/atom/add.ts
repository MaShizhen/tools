import c from './common';
import prj from './prj';

export default function addatom(is_proj: boolean) {
	if (is_proj) {
		return prj();
	}
	return c();
}

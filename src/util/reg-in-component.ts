
export default function reg_in_comment(path: string) {
	return /[/\\](src[/\\]\w[\w\d-]*[/\\](zj-\d{3,6}))[/\\]?/.exec(path);
}

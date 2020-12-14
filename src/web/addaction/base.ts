import Actor from '../../actor';

export default abstract class AddActionWebBase extends Actor {
	protected abstract async update_b(path: string): Promise<void>;
	protected abstract create_a(path: string): Promise<string>;
}

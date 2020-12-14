import Tools from './tools';

export default abstract class Actor extends Tools {
	public abstract do(): Promise<void>;
}

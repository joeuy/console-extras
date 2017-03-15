import {IArgs} from './IArgs';

export interface ICommand {

	usage: string;
	summary: string;
	canExecute(args: IArgs);
	execute(args: IArgs);
}
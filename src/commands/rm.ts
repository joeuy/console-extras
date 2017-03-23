import * as rimraf from 'rimraf';
import * as path from 'path';

import {ICommand} from '../ICommand';
import {IArgs} from '../IArgs';


export class Rm implements ICommand{
	
	get usage(){
		return 'rm <file_path/folder_path to delete>';
	}
	
	get summary(){
		return "Deletes files or folders with long names > 260 characters.";
	}
	
	public canExecute(args:IArgs) : boolean{
		return args.list.length === 1;
	}
	
	public execute (args:IArgs): void{
		
		let file_system_path = path.isAbsolute(args.list[0]) ? args.list[0] : path.resolve(args.list[0]);
		rimraf(file_system_path, error => {});
	}
}
import * as express from 'express';
import * as index from 'serve-index';
import * as open from 'open';

import {ICommand} from '../ICommand';
import {IArgs} from '../IArgs';


export class Serve implements ICommand{
	
	get usage(){
		return 'serve <port number (optional)>';
	}
	
	get summary(){
		return "Starts an express static server on cwd";
	}
	
	public canExecute(args:IArgs) : boolean{
		return true;
	}
	
	public execute (args:IArgs): void{
		let app = express();
		let port = args.list[0] || 7777;
		let folder = process.cwd();
		app.use(express.static(folder, { maxAge: 0 }));
		app.use(index(folder));
		
		app.listen(port, function() {
			console.log('Static server running: 127.0.0.1:%d', port);
			open('http://127.0.0.1:' + port);
		});
	}
}
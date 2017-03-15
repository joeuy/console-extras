/// <reference path="type_definitions/node.d.ts" />
import * as fs from 'fs';
import * as path from 'path';
import {ICommand} from './ICommand';
import {IArgs} from './IArgs';

module Main {

	let config = {
		command_folder: 'commands',
		command_name_pattern: /\.js$/,
		flag_prefix: '-'
	}

	function loadCommandNames(): string[] {
		let commands_folder = path.join(__dirname, config.command_folder);

		return fs.readdirSync(commands_folder)
			.filter(file_name => config.command_name_pattern.test(file_name))
			.map(file_name => file_name.split('.')[0]);
	}

	function getSelectedCommandName(command_names: string[]): string {

		let args = process.argv.slice(2);

		if (args.length === 0) {
			console.log('Specify a command to get help:\n');
			command_names.forEach(name => console.log('-- ', name));
			return undefined;
		}

		let command_index = command_names.indexOf(args[0]);
		if (command_index === -1) {
			console.log('Command not found');
			return undefined;
		}

		return command_names[command_index];
	}

	function parseArguments(): IArgs {
		let command_args: IArgs = { flags: {}, list: [] };

		for (let index = 3; index < process.argv.length; index++) {
			let ith_arg = process.argv[index];
			if (ith_arg.indexOf(config.flag_prefix) === 0) {
				command_args.flags[ith_arg.substr(config.flag_prefix.length)] = true;
			} else {
				command_args.list.push(ith_arg);
			}
		}

		return command_args;
	}

	function runCommand(command_name: string) {

		let command_args: IArgs = parseArguments(),
			commands_folder = path.join(__dirname, config.command_folder),
			command_module = require(path.join(commands_folder, command_name)),
			command_constructor_key = Object.keys(command_module)[0],
			command: ICommand = new (command_module[command_constructor_key]);

		if (command.canExecute(command_args)) {
			command.execute(command_args);
		}
		else {
			console.log('\n-- ', command.usage);
			console.log(command.summary);
		}
	}

	export function run() {

		//load commands
		let command_names = loadCommandNames(),
			command_name = getSelectedCommandName(command_names);

		if (command_name !== undefined) {
			runCommand(command_name);
		}
	}
}

Main.run();
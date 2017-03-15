export interface IVisitor<T> { (node: T): void }
export interface IExpandSearch<T> { (node: T): T[] }

export function DFS<T>(root: T, visitor: IVisitor<T>, expand_search: IExpandSearch<T>) {

	let fringe: T[] = [];
	fringe.push(root);

	while (fringe.length > 0) {
		
		let node = fringe.pop();
		visitor(node);
		
		fringe = fringe.concat(expand_search(node));
	}
}
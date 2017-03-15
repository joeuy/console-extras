export function curry(fn, ...args): Function
{
	return function (...args2) {
		return fn.apply(null, args.concat(args2));
	};
}
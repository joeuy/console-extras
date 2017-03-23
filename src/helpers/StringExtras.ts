function escapeRegExp(string: string) : string {
    return string.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
}

export function replaceAll(string: string, find: string, replace: string): string {
	return string.replace(new RegExp(escapeRegExp(find), 'g'), replace);
}

export function padWithZeros(number: number, length: number): string {

    var result = '' + number;
    while (result.length < length) {
        result = '0' + result;
    }

    return result;
}
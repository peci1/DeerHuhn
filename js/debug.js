function printArray(array) {
    var result = '';
    for (var i = 0; i < array.length; i++) {
	if (array[i] != undefined) {
	    result = result + i + ', ';
	}
    }
    return result;
}

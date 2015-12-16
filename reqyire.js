const DEFAULT_CACHE_SIZE = 5;
var exec = require("child_process").execSync;

//Свой велосипед для мемоизации. Так захотелось.

function Cache(size){
	var keys = [], values = [];
	this.add = function(key, value){
		var i = keys.indexOf(key);
		if(i > -1){
			keys = keys.concat(keys.splice(i, 1));
			values.splice(i, 1);
			values.push(value);
		}else{
			keys.push(key);
			values.push(value);
			if(keys.length > size){
				keys.shift();
				values.shift();
			}
		}
	}
	this.get = function(key){
		var i = keys.indexOf(key);
		if(i > -1){
			keys = keys.concat(keys.splice(i, 1));
			values = values.concat(values.splice(i, 1));
			return values[values.length];
		}else{
			return null;
		}
	}
}

function cachedFunction(fn, size){
	var cache = new Cache(size);
	return function(key){
		var value = cache.get(key);
		if(!value){
			value = fn(key);
			cache.add(key, value)
		}
		return value;
	}
}

//Слегка модифицированный алгоритм Вагнера-Фишера

function distanceLessThan(str1, str2, n){
	var distances = [];
	var distancesNext = [];
	var i, j, flag = true;
	for(j = 0; j <= str1.length; j++){
		distances[j] = j;
	}
	for(i = 1; i <= str2.length; i++){
		flag = false;
		distancesNext[0] = i;
		flag = flag || (distancesNext[0] < n);
		for(j = 1; j <= str1.length; j++){
			distancesNext[j] = Math.min(
				distances[j] + 1,
				distancesNext[j - 1] + 1,
				distances[j - 1] + ((str2[i - 1] == str1[j - 1]) ? 0 : 1)
			);
			flag = flag || (distancesNext[j] < n);
		}
		if(flag || !n){
			distances = distancesNext;
			distancesNext = [];
		}else{
			return -1;
		}
	}
	return distances[str1.length];
}

function fuzzySearch(arr, key){
	var current, best = 0, bestResult = "";
	for(var i = 0; i < arr.length; i++){
		current = distanceLessThan(arr[i], key, best);
		if(current > -1){
			best = current;
			bestResult = arr[i];
		}
	}
	return bestResult;
}

function cachedSearch(arr){
	return cachedFunction(fuzzySearch.bind(null, arr), DEFAULT_CACHE_SIZE);
}

var moduleSearch;

function reqyire(moduleName){
	try{
		return require(moduleName);
	}catch(e){
		if(!moduleSearch){
			var localModules = Object.keys(JSON.parse(exec("npm ls -json") + "").dependencies || {});
			var globalModules = Object.keys(JSON.parse(exec("npm ls -g -json") + "").dependencies || {});
			var builtinModules = require("builtin-modules");
			var modules = localModules.concat(globalModules).concat(builtinModules);
			moduleSearch = cachedSearch(modules);
		}
		return require(moduleSearch(moduleName));
	}
}

module.exports = reqyire;
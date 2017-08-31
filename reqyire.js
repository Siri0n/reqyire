const DEFAULT_CACHE_SIZE = 265;
const PROXY_SUPPORT = (typeof Proxy != "undefined");

var path = require("path");
var fs = require("fs");
var stackTrace = require("stack-trace");

var exec = require("child_process").execSync;
PROXY_SUPPORT && require("harmony-reflect");

var moduleSearch;
var pathRegex = /^(\/|\.\/|\.\.\/)/;

function reqyire(moduleName){
	if(pathRegex.test(moduleName)){
		return fileSearch(moduleName);
	}else{
		try{
			return require(moduleName);
		}catch(e){
			if(!moduleSearch){
				var localModules = Object.keys(JSON.parse(executeCommand("npm ls -json")).dependencies || {});
				var globalModules = Object.keys(JSON.parse(executeCommand("npm ls -g -json")).dependencies || {});
				var builtinModules = require("builtin-modules");
				var modules = localModules.concat(globalModules).concat(builtinModules);
				moduleSearch = cachedSearch(modules);
			}
			return require(moduleSearch(moduleName));
		}
	}
}

function wrap(obj){
	if(PROXY_SUPPORT){
		return fuzzy(obj);
	}else{
		return obj;
	}
}

if(PROXY_SUPPORT){
	reqyire.wrap = fuzzy;
}

module.exports = wrap(reqyire);


function fileSearch(moduleName){
	var callerName = stackTrace.get()[3].getFileName();
	var callerFolder = path.dirname(callerName);
	var resolvedName = path.resolve(callerFolder, moduleName);

	try{
		return require(resolvedName);
	}catch(e){
		var pathFragments = resolvedName.split(path.sep);
		var i = pathFragments.length - 1;
		var partialPath;
		while(i > 0){
			partialPath = pathFragments.slice(0, i).join(path.sep);
			if(access(partialPath)){
				break;
			}else{
				i--;
			}
		}
		pathFragments = pathFragments.slice(i);
		var fragment, names, correct;
		while(pathFragments.length){
			fragment = pathFragments.shift();
			if(pathFragments.length){
				names = getFolderNames(partialPath);
			}else{
				names = getFileNames(partialPath);
			}
			correct = fuzzySearch(names, fragment);
			partialPath = path.join(partialPath, correct);
		}
		return require(partialPath);
	}
}

function access(path){
	try{
		fs.accessSync(path);
		return true;
	}catch(e){
		return false;
	}
}

function getFileNames(dir){
	return fs.readdirSync(dir).filter(function(name){
		return fs.statSync(path.join(dir, name)).isFile();
	});
}

function getFolderNames(dir){
	return fs.readdirSync(dir).filter(function(name){
		return fs.statSync(path.join(dir, name)).isDirectory();
	});
}

function executeCommand(command){
	var result;
	try{
		result = exec(command, {stdio: ["pipe", "pipe", "ignore"]}) + "";
	}catch(e){
		result = e.stdout + "";
	}
	return result;
}

function fuzzy(obj){
	if(typeof obj != "object" && typeof obj != "function"){
		return obj;
	}
	return new Proxy(obj, {
		get: function(obj, key){
			if(key in obj){
				return obj[key];
			}
			var keys = [];
			var p = obj;
			do{
				keys = keys.concat(Object.getOwnPropertyNames(p));
			}while (p = Object.getPrototypeOf(p));
			return fuzzy(obj[fuzzySearch(keys, key)]);
		},
		apply: function(obj, thisArg, argsList){
			return fuzzy(obj.apply(thisArg, argsList));
		}
	})
}

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

function cachedSearch(arr){
	return cachedFunction(fuzzySearch.bind(null, arr), DEFAULT_CACHE_SIZE);
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
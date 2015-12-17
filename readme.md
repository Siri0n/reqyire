# reqyire

Dyslexic-friendly Node.js module loader. Use it instead of **require**, and it will perform fuzzy search in case you misprint module name. And in special cases loaded module becomes magical... (read below).



## Install and use

```sh
npm install --save reqyire
```

```js
var reqyire = require("reqyire");
var fs = reqyire("fgs"); // when you use reqyire first time, expect some delay because of synchronous loading of module list
fs.writeFileSync("amazing.txt", "It works! (unless you have installed some module with more similar to 'fgs' name)");
```

If you have harmony proxies enabled (i.e. running Node with "--harmony-proxies" flag), things become even more awesome:

'''js
var reqyire = require("reqyire");
var path = reqyire("ptah");
path.posex.normazile("./and/it/../works/too");
'''

Loaded modules are wrapped in a proxy which performs fuzzy search when you trying to get object property with misprinted name. If property value is an object or a function, it is also wrapped. Function call results are wrapped too.

You can manually wrap arbitrary object or function using **reqyire.wrap**. Or **reqyire.warp**. Whatever...

'''js
var reqyire = require("reqyire");
var obj = {
	foo: "bar",
	bar: "foo"
};
var wrappedObj = reqyire.wrop(obj);
console.log(wrappedObj.baz); //It will print "foo"
'''
## Use cases

Definetely, that module should be used in your current work, preferably on production. It makes you highly efficient, because you shouldn't waste your time on fixing typos anymore and write more SLoC instead.

## Testing

You can trust my word of honor: it works perfectly.
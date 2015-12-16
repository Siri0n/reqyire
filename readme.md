# reqyire

Dyslexic-friendly module loader. Use it instead of **require**, and it will perform fuzzy search in case you misprint module name. More features coming soon.



## Install and use

```sh
npm install --save reqyire
```

```js
var reqyire = require("reqyire");
var fs = reqyire("fgs"); // when you use reqyire first time, expect some delay because of synchronous loading of module list
fs.writeFileSync("amazing.txt", "It works! (unless you have installed some module with more similar to 'fgs' name)");
```

## Use cases

Definetely, that module should be used in your current work, preferably on production. It makes you highly efficient, because you shouldn't waste your time on fixing typos anymore and write more SLoC instead.

## Testing

You can trust my word of honor: it works perfectly.
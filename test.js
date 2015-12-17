var obj = {a:1};
var p = Proxy.create(obj, {
	set: function(){return true}
});
console.log(p.a);
p.a = 2;
console.log(p.a);
obj.a = 2;
console.log(p.a);
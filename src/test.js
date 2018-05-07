const {default: State, accepts, acceptsTransition, context} = require('./');

class Foo extends State {
	@context baz = 1;

	bar(message) {
		console.log('foo.bar', {context: this, message});
		this.popState();
		this.pushState('baz', {feld: 16});
	}
}

@accepts(({feld}) => feld === 15)
class Baz extends State {
	@context kint = 28;
	@context dift = 12;

	bar(message) {
		console.log('baz.bar', {context: this, message});
	}

	@accepts(({sind}) => sind === 14)
	quux(message) {
		console.log('baz.quux', {context: this, message});
		this.pushState('frob', {dift: 23})
	}
}

@accepts(({dift}) => dift === 23)
@acceptsTransition(({feld}) => feld === 15)
class Frob extends State {
	@context neld = 1234;

	quint(message) {
		console.log('baz.frob.quint', {context: this, message});
		this.popState();
	}
}

const s = new Foo({baz: 153});

console.log('state', s.state);

s.pushState(Baz, {dift: 103});
s.pushState(Frob, {neld: 13});

console.log('state', s.state);
console.log('parent contexts of Baz', s.getChild([Baz]).parentContexts);
console.log('context', s.context);
console.log('context of Baz', s.getChild([Baz]).context);
console.log('context of Frob', s.getChild([Baz, Frob]).context);
console.log('parent contexts of Frob', s.getChild([Baz, Frob]).parentContexts);

s.getChild([Baz]).foo = 'TEST';

s.popState();
console.log(s.state);

s.popState();
console.log(s.state);

s.transition([
	[Baz, {dift: 103}],
	[Frob, {neld: 13}]
]);

console.log('state', s.state);
console.log('parent contexts of Baz', s.getChild([Baz]).parentContexts);
console.log('context', s.context);
console.log('context of Baz', s.getChild([Baz]).context);
console.log('kint', s.getChild([Baz]).kint);
console.log('context of Frob', s.getChild([Baz, Frob]).context);
console.log('parent contexts of Frob', s.getChild([Baz, Frob]).parentContexts);
console.log('baz.foo', s.getChild([Baz]).foo);

// s.message('quint', {dunt: 10});


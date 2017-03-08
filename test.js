const {default: State, accepts, acceptsTransition} = require('./');

class Foo extends State {
	bar(message) {
		console.log('foo.bar', {context: this, message});
		this.popState();
		this.pushState('baz', {feld: 16});
	}
}

@accepts(({feld}) => feld === 15)
class Baz extends State {


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
	quint(message) {
		console.log('baz.frob.quint', {context: this, message});
		this.popState();
	}
}

const s = new Foo({baz: 153});

console.log(s.state);

s.pushState(Baz, {dift: 103});
s.pushState(Frob, {neld: 13});

console.log(s.state);
console.log(s.getChild([Baz]).parentContexts);
console.log(s.context);
console.log(s.getChild([Baz]).context);
console.log(s.getChild([Baz, Frob]).context);

console.log(s.getChild([Baz, Frob]).parentContexts);

s.popState();
console.log(s.state);

// s.popState();
// s.transition({
// 	baz: {feld: 15},
// 	frob: {dift: 23}
// })

// s.message('quint', {dunt: 10});


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

const s = new Foo();

s.popState();
s.transition({
	baz: {feld: 15},
	frob: {dift: 23}
})

s.message('quint', {dunt: 10});


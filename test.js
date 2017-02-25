const {default: Statum, accepts} = require('./');

const state = {
	initialState: ['foo'],
	initialContext: {
		foo: {
			jant: 35
		}
	},

	foo: {
		bar(context, message) {
			console.log('foo.bar', {context, message});
			this.popState();
			this.pushState('baz', {feld: 16});
		}
	},

	@accepts(({feld}) => feld === 15)
	baz: {
		bar(context, message) {
			console.log('baz.bar', {context, message});
		},

		quux(context, message) {
			console.log('baz.quux', {context, message});
			this.pushState('frob', {dift: 23})
		},

		frob: {
			quint(context, message) {
				console.log('baz.frob.quint', {context, message});
				this.popState();
			}
		}
	},

	@accepts
	quez: {}
};

const s = new Statum(state);

s.popState();
s.pushState('baz');
s.pushState('frob', {feld: 15});

s.message('quint', {dunt: 10});
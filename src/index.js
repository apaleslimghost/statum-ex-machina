import im from 'immutable';

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
	}
};

class StateMachine {
	constructor(stateMap) {
		this.stateMap = im.fromJS(stateMap);
		this.state = im.List(stateMap.initialState || []);
		this.context = im.Map(stateMap.initialContext || {});
	}

	popState() {
		const poppedState = this.state.last();
		this.state = this.state.pop();
		this.context = this.context.delete(poppedState);
	}

	pushState(state, context) {
		this.state = this.state.push(state);
		this.context = this.context.set(state, im.Map(context));
	}

	message(name, message) {
		const receivers = this.stateMap.getIn(this.state);
		if(receivers.has(name)) {
			const context = this.state.reduce(
				(context, key) => context.merge(this.context.get(key)),
				im.Map()
			);

			receivers.get(name).call(this, context.toJS(), message);
		} else {
			throw new ReferenceError(`Invalid message ${name} for state ${this.state}`);
		}
	}
}

const s = new StateMachine(state);

s.message('bar', {foo: 5});
s.message('bar', {foo: 7});
s.message('quux', {foo: 7});
s.message('quint', {bar: 10})
s.message('bar', {foo: 7});

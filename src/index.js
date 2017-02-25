import get from 'lodash.get';

const state = {
	initialState: ['foo'],

	foo: {
		bar(state, message) {
			console.log('foo.bar', {state, message});
			this.transition('baz', {feld: 16});
		}
	},

	baz: {
		quux(state, message) {
			console.log('baz.quux', {state, message});
		}
	}
}

class StateMachine {
	constructor(stateMap) {
		this.stateMap = stateMap;
		this.state = stateMap.initialState || [];
		this.args = {};
	}

	transition(state, args) {
		this.state = state;
		this.args = args;
	}

	message(name, message) {
		const receivers = get(this.stateMap, this.state);
		if(receivers[name]) {
			receivers[name].call(this, this.args, message);
		} else {
			throw new ReferenceError(`Invalid message ${name} for state ${this.state}`);
		}
	}
}

const s = new StateMachine(state);

s.message('bar', {foo: 5});
s.transition('foo', {bar: 6});
s.message('bar', {foo: 7});
s.message('quux', {foo: 7});

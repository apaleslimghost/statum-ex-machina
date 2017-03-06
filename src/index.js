import im from 'immutable';

const scan = iterable => iterable.reduce(
	(acc, item) => acc.push(acc.last().push(item)),
	im.fromJS([[]])
);

export default class Statum {
	popState() {
		const oldState = this.state;
		this.state = this.state.pop();
		this.stateTree = this.stateTree.deleteIn(oldState.push('_context'));
	}

	pushState(state, nextContext) {
		const nextState = this.state.push(state);

		const {context} = this.accumulateContext(nextState, nextContext);
		const accepter = this.getParentKey(nextState, '_acceptsTransition');

		if(accepter && !accepter(context.toJS())) {
			throw new TypeError(
				`Transition to ${state} not accepted by ${nextState.join('.')}`
			);
		}

		this.state = nextState;
		this.stateTree = this.stateTree.setIn(this.state.push('_context'), im.Map(nextContext));
	}

	transition(states) {
		const orderedStates = im.OrderedMap(states);

		scan(this.state).forEach(oldState => {
			this.stateTree = this.stateTree.deleteIn(oldState.push('_context'))
		});

		this.state = im.List([]);
		orderedStates.forEach((context, state) => this.pushState(state, context));
	}

	accumulateContext(state = this.state, extraContext = im.Map()) {
		const parts = scan(state);

		const context = parts.reduce(
			(context, key) => context.merge(this.stateTree.getIn(key.push('_context'))),
			im.Map()
		).merge(extraContext);

		return {parts, context};
	}

	getParentKey(path, key) {
		const parent = this.stateTree.getIn(path.butLast());
		const level = path.last();

		return parent.getIn([key, level]);
	}

	message(name, message) {
		const receivers = this.stateTree.getIn(this.state);

		if(receivers.has(name)) {
			const {parts, context} = this.accumulateContext();

			parts.forEach(path => {
				const accepter = this.getParentKey(path, '_accepts');

				if(accepter && !accepter(context.toJS(), message)) {
					throw new TypeError(
						`Message ${name} to ${this.state.join('.')} not accepted by ${path.join('.')}`
					);
				}
			});

			receivers.get(name).call(this, context.toJS(), message);
		} else {
			throw new ReferenceError(`Invalid message ${name} for state ${this.state.join('.')}`);
		}
	}
}

const tag = (name, tagged) => (...args) => (...decorate) => {
	switch(decorate.length) {
		case 1: { // class decorator
			const [klass] = decorate;
			return Object.assign(klass, {
				[name]: tagged(...args)
			});
		}

		case 3: { // property/method decorator
			const [obj, prop, desc] = decorate;

			obj._accepts = Object.assign(obj._accepts || {}, {
				[prop]: tagged(...args)
			});

			return desc;
		}
	}
}

export const accepts = tag('_accepts', (...tests) =>
	(context, message) => tests.every(test => test(context, message)));

export const acceptsTransition = tag('acceptsTransition', (...tests) =>
	(message) => tests.every(test => test(message)));

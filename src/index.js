import im from 'immutable';

const scan = iterable => iterable.reduce(
	(acc, item) => acc.push(acc.last().push(item)),
	im.fromJS([[]])
);

export default class Statum {
	constructor(stateTree) {
		this.stateTree = im.fromJS(stateTree)
			.set('_context', im.Map(stateTree.initialContext || {}));
		this.state = im.List(stateTree.initialState || []);
	}

	popState() {
		const oldState = this.state;
		this.state = this.state.pop();
		this.stateTree = this.stateTree.deleteIn(oldState.push('_context'));
	}

	pushState(state, context) {
		this.state = this.state.push(state);
		this.stateTree = this.stateTree.setIn(this.state.push('_context'), im.Map(context));
	}

	transition(states) {
		const orderedStates = im.OrderedMap(states);
		scan(this.state).map(oldState => {
			this.stateTree = this.stateTree.deleteIn(oldState.push('_context'))
		});

		this.state = im.List([]);
		orderedStates.forEach((context, state) => this.pushState(state, context));
	}

	message(name, message) {
		const receivers = this.stateTree.getIn(this.state);

		if(receivers.has(name)) {
			const parts = scan(this.state);

			const context = parts.reduce(
				(context, key) => context.merge(this.stateTree.getIn(key.push('_context'))),
				im.Map()
			);

			const accepted = parts.forEach(path => {
				const parent = this.stateTree.getIn(path.butLast());
				const level = path.last();

				const accepter = parent.getIn(['_accepts', level]);

				if(accepter && !accepter(context.toJS(), message)) {
					throw new TypeError(
						`Message ${name} to ${this.state.toJS().join('.')} not accepted by ${path.toJS().join('.')}`
					);
				}
			});

			receivers.get(name).call(this, context.toJS(), message);
		} else {
			throw new ReferenceError(`Invalid message ${name} for state ${this.state.toJS().join('.')}`);
		}
	}
}

const tag = (name, tagged) => (...args) => (obj, prop, desc) => {
	obj[name] = Object.assign(obj[name] || {}, {
		[prop]: tagged(...args)
	});

	Object.defineProperty(obj, prop, desc);
};

export const accepts = tag('_accepts', (...tests) => (context, message) => tests.every(test => test(context, message)));
export const acceptsTransition = tag('_acceptsTransition');

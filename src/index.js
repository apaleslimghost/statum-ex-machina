import im from 'immutable';

const scan = iterable => iterable.reduce(
	(acc, item) => acc.push(acc.last().push(item)),
	im.fromJS([[]])
);

export default class Statum {
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

			const accepted = scan(this.state).forEach(path => {
				const parent = this.stateMap.getIn(path.butLast());
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

export const accepts = (...tests) => (obj, prop, desc) => {
	obj._accepts = Object.assign(obj._accepts || {}, {
		[prop]: (context, message) => tests.every(test => test(context, message))
	});

	Object.defineProperty(obj, prop, desc);
};

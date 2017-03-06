import im from 'immutable';

const scan = iterable => iterable.reduce(
	(acc, item) => acc.push(acc.last().push(item)),
	im.fromJS([[]])
);

export default class Statum {
	children = im.Map();

	constructor(context = {}) {
		this.context = im.Map(context);
	}

	get parents() {
		return this.parent ? [this.parent].concat(this.parent.parents) : [];
	}

	get state() {
		return this.currentChild ? [this.currentChild].concat(
			this.children.get(this.currentChild).state
		) : [];
	}

	getChild(path) {
		return path.length === 0 ? this
		: this.children.get(path[0]).getChild(path.slice(1));
	}

	addContext(nextContext) {
		this.context = this.context.merge(nextContext);
	}

	popState() {
		if(this.currentChild) {
			this.children.get(this.currentChild).popState();
			this.currentChild = null;
		}
	}

	shouldReuseInstance(nextContext) {
		return this.context.eq(nextContext);
	}

	pushState(Child, childContext) {
		let instance;

		if(this.children.has(Child)) {
			const child = this.children.get(Child);

			if(child.shouldReuseInstance(childContext)) {
				instance = child;
			}
		}

		if(!instance) {
			instance = new Child(childContext);
		}

		this.children = this.children.set(Child, instance);
		this.currentChild = Child;
	}

	transition(states) {
		const orderedStates = im.OrderedMap(states);

		scan(this.state).forEach(oldState => {
			this.stateTree = this.stateTree.deleteIn(oldState.push('_context'))
		});

		this.state = im.List([]);
		orderedStates.forEach((context, state) => this.pushState(state, context));
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

			Object.defineProperty(klass, name, {
				value: tagged(...args)
			});

			return klass;
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

export const context = (obj, prop, desc) => ({
	get() {
		return this.context.get(prop, desc.value);
	},

	set(value) {
		this.context = this.context.set(prop, value);
	},

	enumerable: true,
})
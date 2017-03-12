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

	get parentContexts() {
		return this.parents.reduce(
			(context, parent) => context.set(parent.constructor.name, parent.context),
			im.Map()
		).toJS();
	}

	get state() {
		return this.currentChild ? [this.currentChild].concat(this.childInstance.state) : [];
	}

	get childInstance() {
		return this.children.get(this.currentChild);
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
			const {deleteMe} = this.childInstance.popState() || {};

			if(deleteMe) {
				this.currentChild = null;
			}
		} else {
			return {deleteMe: true}
		}
	}

	clearChildStates() {
		if(this.currentChild) {
			this.currentChild.clearChildStates();
			this.currentChild = null;
		}
	}

	shouldReuseInstance(nextContext) {
		return this.context.equals(im.Map(nextContext));
	}

	pushState(Child, childContext) {
		let instance;

		if(this.currentChild) {
			return this.childInstance.pushState(Child, childContext);
		}

		if(this.children.has(Child)) {
			const child = this.children.get(Child);

			if(child.shouldReuseInstance(childContext)) {
				instance = child;
			}
		}

		if(!instance) {
			instance = new Child(childContext);
		}

		instance.parent = this;
		this.children = this.children.set(Child, instance);
		this.currentChild = Child;
	}

	transition(states) {
		this.clearChildStates();
		im.OrderedMap(states).forEach((context, state) => this.pushState(state, context));
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

			Object.defineProperty(desc.value, name, {
				value: tagged(...args)
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
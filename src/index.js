import im from 'immutable';

const scan = iterable => iterable.reduce(
	(acc, item) => acc.push(acc.last().push(item)),
	im.fromJS([[]])
);

export default class State {
	children = im.Map();
	_contextKeys = this._contextKeys || [];

	constructor(context = {}) {
		this.context = im.Map();
		this.addContext(context);
		this.addContext(this._contextKeys.reduce(
			(extraContext, key) => Object.assign(extraContext, {[key]: this[key]}),
			{}
		));
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

	addContext(nextContext = {}) {
		const nextContextMap = im.Map(nextContext);
		const extraKeys = im.Set(nextContextMap.keys()).subtract(this._contextKeys);
		if(extraKeys.size !== 0) {
			throw new Error(`State ${this.constructor.name} has no context keys ${extraKeys.toJS()}`);
		}

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

	send(path, message) {
		
	}

	receive(path, message) {
		if(path.length === 1 && this[path[0]]) {
			const nextContext = this[path[0]](message, this.context.toJS(), this.parentContexts);
			this.addContext(nextContext);
			return this.context;
		}

		return this.send(path, message);
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

export const context = (obj, prop, desc) => {
	(obj._contextKeys = obj._contextKeys || []).push(prop);

	return {
		get() {
			return this.context.get(prop, desc.initializer());
		},

		set(value) {
			this.context = this.context.set(prop, value);
		},

		enumerable: true,
	}
};
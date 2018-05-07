const delay = ms => new Promise(resolve => setTimeout(resolve, ms, true));

const fields = Symbol('fields');
const field = (obj, prop, descriptor) => {
	if(!obj[fields]) obj[fields] = new Set();
	obj[fields].add(prop);

	const sym = 

	return {

	}
};

class Fields {
	constructor(initializer) {
		for(const key in initializer) {
			if(!this[fields].has(key)) throw new Error(`${this.constructor.name} has no field ${key}`);
			this[key] = initializer[key];
		}
	}
}

const link = (obj, prop, {initializer}) => ({
	get() {
		const Type = initializer();
		return new Type(this).fetch();
	}
});

const items = type => (obj, prop, {value}) => ({
	async value(...args) {
		return (await value(...args)).map(
			item => new type(item)
		);
	}
});

class Arrival extends Fields {
	@field due = null;
}

class Arrivals {
	constructor(stopPoint) {
		this.stopPoint = stopPoint;
	}

	@items(Arrival)
	async fetch() {
		await delay(2000);
		return [
			{due: 1234},
			{due: 2345},
		];
	}
}

class StopPoint {
	@link arrivals = Arrivals;
}

const a = new StopPoint();
a.arrivals.then(console.log);

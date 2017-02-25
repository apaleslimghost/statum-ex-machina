src-files := $(shell find src -name '*.js')
lib-files := $(patsubst src/%, lib/%, $(src-files))

all: $(lib-files)

lib/%.js: src/%.js
	mkdir -p $(@D)
	node_modules/.bin/babel -o $@ $<

run: lib/index.js
	node $<
REPORTER = spec

test:
		@./node_modules/.bin/mocha \
			--reporter $(REPORTER) \
			./test/demo-maker-cortex-test.js

.PHONY: test
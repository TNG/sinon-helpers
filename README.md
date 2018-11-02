# sinon-helpers

Create easily configurable [sinon](https://github.com/sinonjs/sinon) stubs that mimic constructors and keep track of their instances.

[![npm](https://img.shields.io/npm/v/sinon-helpers.svg?maxAge=3600)](https://www.npmjs.com/package/sinon-helpers)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?maxAge=3600)](http://standardjs.com/)
[![npm](https://img.shields.io/npm/dm/sinon-helpers.svg?maxAge=3600)](https://www.npmjs.com/package/sinon-helpers)
[![David](https://img.shields.io/david/TNG/sinon-helpers.svg?maxAge=3600)](https://david-dm.org/TNG/sinon-helpers)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?maxAge=3600)](https://github.com/semantic-release/semantic-release)

If updating from v1, please see [updating from v1 to v2](#migrating-from-v1-to-v2).

## Motivation

Especially when working with the new ES6 classes, a common problem in unit testing is to find out if a module creates
instances of a class using the right constructor arguments and which methods are called on these instances. Moreover,
it would be nice to be able to control that these classes are properly stubbed i.e. that in our tests, none of the
original class code is executed.

New test dependencies can be easily injected with [rewire](https://github.com/jhnns/rewire) or
[proxyquire](https://github.com/thlorenz/proxyquire) for [node](https://nodejs.org) testing and
[inject-loader](https://github.com/plasticine/inject-loader) or
[babel-plugin-rewire](https://github.com/speedskater/babel-plugin-rewire) for [webpack](https://webpack.github.io/)
testing. The question remains how the stated goal can be achieved using a mocking library such as
[sinon](https://github.com/sinonjs/sinon).

In the examples, we want to mock a constructor `MyConstructor`.

### Approaches without `sinon-helpers`

* Replace `MyConstructor` by `sinon.stub(MyConstructor)`. That way, we can find out which parameters are used to create
instances. The instances, however, will feature none of the methods of `MyConstructor`.
* Do the same using `sinon.spy(MyConstructor)` instead. But now the original code is executed as well and we still
cannot test method invocations.
* To test method invocations, we could stub methods of the prototype i.e.
`sinon.stub(MyConstructor.prototype, 'myMethod')` (do not forget to remove your stub after the test!), or if
`MyConstructorStub = sinon.stub(MyConstructor)`, we could use `MyConstructorStub.prototype.myMethod = sinon.stub()` to
add the corresponding stubs. Now, however, all instances share the same stubs and we cannot match stub invocations with
the instances on which they were invoked.

To really solve this problem, we will need to create our own custom constructor. **sinon-helpers** is a library that
offers an easy and generic solution to this problem.

### What **sinon-helpers** offers

* `MyStubConstructor = getStubConstructor(MyConstructor)` generates a new constructor using `MyConstrucor` as a template. This means that new instances will contain all methods of `MyConstructor` as stubs including inherited and non-enumerable methods but skipping getters.
* `MyStubConstructor.instances` holds an array of all instances that have been created using this constructor. If you expect only a single instance to be created, you can retrieve it directly via `MyStubConstructor.getInstance()`, which will also throw an error if more than one or no instance has been created. Thus you can test for all instances separately which methods have been invoked in which way.
* `MyStubConstructor.args` returns an array of arrays of arguments used to create the instances.
* As the prototype is not modified, you do not have to clean up your stubs after the test!

## Installation
```bash
npm install --save-dev sinon-helpers
```

or

```bash
yarn add --dev sinon-helpers
```

## Usage
```js
var sh = require('sinon-helpers') // CommonJS
import * as sh from 'sinon-helpers' // ES6
// alternative: import {getStubConstructor, getSpyConstructor} from 'sinon-helpers'

// Create a constructor mimicking a given constructor
var MyStubConstructor = sh.getStubConstructor(MyConstructor)

// You can initialize your stub to e.g. provide return values for your methods
// or add fields that are not part of the prototype
var MyStubConstructor = sh.getStubConstructor(MyConstructor)
  .withInit(instance => {
    // this assumes MyConstructor.prototype.myMethod exists
    instance.myMethod.returns(42)
    instance.additionalField = 'added'
  })

// Create a constructor that calls through to the original constructor
// with spies on all methods instead of stubs
var MySpyConstructor = sh.getSpyConstructor(MyConstructor)
```

## API
### `getStubConstructor(<OriginalConstructor>)`
Returns a [`StubConstructor`](#stubconstructor-api) mimicking the given constructor `OriginalConstructor`. When called with `new`, this constructor creates an object with stubs for any methods of the prototype object of `ConstructorName`.

If you call `getStubConstructor` without any arguments, you receive a StubConstructor without any pre-defined methods. A `StubConstructor` features methods to configure and query the created instances.

### `StubConstructor` API
A `StubConstructor` has the following methods and fields:
* `.withInit(onInit)`  
  Each time a new instance is created, `onInit(instance)` is called receiving the new instance as parameter; this enables you to perform manual post-processing like configuring return values and adding additional fields before the instance is returned.
* `.instances`  
  An array of all instances created with the stub constructor. Contains `null` if the constructor is called without `new`.
* `.getInstance()`  
  Throws an error if no or more than one instance has been created. Otherwise, returns the instance created.
* `.getInstance(index)`  
  Throws an error if not at least `index` instances have been created. Otherwise, returns the instance `index`.
* `.args`  
  An array of arrays containing the arguments of each constructor call.

### `getSpyConstructor(OriginalConstructor)`
Returns a [`SpyConstructor`](#spyconstructor-api) of the given constructor `OriginalConstructor`. A `SpyConstructor` is similar to a `StubConstructor` except for the following differences:
* The `OriginalConstructor` is called when creating a new instance.
* Methods are not stubbed but spied on.
* Which methods are spied on is not determined by looking at the prototype but by looking at what methods are actually present after the original constructor has run.

This is useful if you need to preserve the constructor's functionality while being able to track its instances. Note however that having to rely on `SpyConstructor`s instead of `StubConstructor`s may be an indication of strong couplings in your software that are generally a sign that your architecture could be improved.

### `SpyConstructor` API
A `SpyConstructor` has the following methods and fields:
* `.withInit(onInit)`  
  When a new instance is created, `onInit(instance)` is called receiving the new instance as parameter; this enables you to perform manual post-processing before the instance is returned.
* `.instances`   
  An array of all instances created with the spy constructor. Contains `null` if the constructor is called without `new`.
* `.getInstance()`  
  Throws an error if no or more than one instance has been created. Otherwise, returns the instance created.
* `.getInstance(index)`  
  Throws an error if not at least `index` instances have been created. Otherwise, returns the instance `index`.
* `.args`  
  An array of arrays containing the arguments of each constructor call.
  
## Migrating from v1 to v2
* Instead of `getInstances()`, use `instances` to access the array of instances.
* Instead of `getInstancesArgs()`, use `args` to access the arguments used to create instances.
* `afterCreation()` is now called `withInit()`.
* `withMethods`, `withStubs`: These methods have been removed in favour of using `withInit()`, which is much more powerful.

## Contributing
Feel like this library could do more for you? Found an issue with your setup? Want to get involved? Then why not [contribute](./CONTRIBUTING.md) by raising an issue or creating a pull-request!

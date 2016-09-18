# sinon-helpers
Create [`sinon`](https://github.com/sinonjs/sinon) stubs that mimic your constructors and keep track of their instances.

[![npm](https://img.shields.io/npm/v/sinon-helpers.svg?maxAge=3600)](https://www.npmjs.com/package/sinon-helpers)
[![Travis branch](https://img.shields.io/travis/lukastaegert/sinon-helpers/master.svg?maxAge=3600)](https://travis-ci.org/lukastaegert/sinon-helpers)
[![codecov.io](https://img.shields.io/codecov/c/github/lukastaegert/sinon-helpers.svg?maxAge=3600)](http://codecov.io/github/lukastaegert/sinon-helpers)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?maxAge=3600)](http://standardjs.com/)
[![npm](https://img.shields.io/npm/dm/sinon-helpers.svg?maxAge=3600)](https://www.npmjs.com/package/sinon-helpers)
[![David](https://img.shields.io/david/lukastaegert/sinon-helpers.svg?maxAge=3600)](https://david-dm.org/lukastaegert/sinon-helpers)
[![David](https://img.shields.io/david/dev/lukastaegert/sinon-helpers.svg?maxAge=3600)](https://david-dm.org/lukastaegert/sinon-helpers?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?maxAge=3600)](https://github.com/semantic-release/semantic-release)

## API

### `getStubConstructor(OriginalConstructor)`

Returns a [`StubConstructor`](#stubconstructor-api) mimicking the given constructor `OriginalConstructor`. This can be
especially handy if you use something like [`rewire`](https://github.com/jhnns/rewire) or
[`babel-plugin-rewire`](https://github.com/speedskater/babel-plugin-rewire) for dependency injection. When called
with `new`, this constructor creates an object with stubs for any methods of the prototype object of `ConstructorName`.
The `StubConstructor` features several methods to add methods and query created instances.

### `StubConstructor` API
A `StubConstructor` has the following methods:
* `.withMethods('method1' <,'method2' <...>>)`  
    *not yet implemented*  
    Instances should have the listed additional methods as stubs.
* `.getInstances()`   
    Returns an array of instances created with the stub constructor.
* `.getInstance()`  
    Throws an error if no or more than one instance has been created. Otherwise, returns the instance created.
* `.getInstance(index)`  
    Throws an error if not at least `index` instances have been created. Otherwise, returns the instance `index`.
* `.getInstancesArgs()`  
    Returns an array of arrays containing the arguments of each instance creation.
* `.getInstanceArgs()`  
    Throws an error if no or more than one instance has been created. Otherwise, returns the arguments with which the
    instance has been created.
* `.getInstanceArgs(index)`  
    Throws an error if not at least `index` instances have been created. Otherwise, returns the arguments with which
    instance `index` has been created.

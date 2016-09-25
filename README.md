# sinon-helpers
Create easily configurable [`sinon`](https://github.com/sinonjs/sinon) stubs that mimic constructors and keep track of their instances.

[![npm](https://img.shields.io/npm/v/sinon-helpers.svg?maxAge=3600)](https://www.npmjs.com/package/sinon-helpers)
[![Travis branch](https://img.shields.io/travis/TNG/sinon-helpers/master.svg?maxAge=3600)](https://travis-ci.org/TNG/sinon-helpers)
[![codecov.io](https://img.shields.io/codecov/c/github/TNG/sinon-helpers.svg?maxAge=3600)](http://codecov.io/github/TNG/sinon-helpers)
[![JavaScript Style Guide](https://img.shields.io/badge/code%20style-standard-brightgreen.svg?maxAge=3600)](http://standardjs.com/)
[![npm](https://img.shields.io/npm/dm/sinon-helpers.svg?maxAge=3600)](https://www.npmjs.com/package/sinon-helpers)
[![David](https://img.shields.io/david/TNG/sinon-helpers.svg?maxAge=3600)](https://david-dm.org/TNG/sinon-helpers)
[![David](https://img.shields.io/david/dev/TNG/sinon-helpers.svg?maxAge=3600)](https://david-dm.org/TNG/sinon-helpers?type=dev)
[![semantic-release](https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg?maxAge=3600)](https://github.com/semantic-release/semantic-release)

## Usage
```javascript
var sh = require('sinon-helpers')

// Create a constructor mimicking a given constructor
var MyStubConstructor = sh.getStubConstructor(MyConstructor)

// You may also add new methods and provide return values to existing methods
MyStubConstructor = MyStubConstructor.withMethods('method1', sh.returning(1), 'method2', sh.returningThis)

// Create a constructor that calls through to the original constructor
// with spies on all methods and having a few methods stubbed
var MySpyConstructor = sh.getSpyConstructor(MyConstructor).withStubs('method1', 'method2', sh.returning(true))

// Create an object with the given methods as stubs
var myMethods = sh.getMethodStubs('method1', 'method2', sh.returning('Hello'))
```

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
  Instances should have the listed additional methods as stubs. Returns the `StubConstructor` so you can assign
    
  ```javascript
var Stub = getStubConstructor(MyConstructor).withMethods('myMethod')
  ```
    
  `.withMethods` also [allows you to specify method return values](#specifying-stub-return-values), see below.
* `.afterCreation(onAfterCreation)`  
  When a new instance is created, `onAfterCreation(instance)` is called receiving the new instance as parameter; this
  enables you to perform manual post-processing like adding additional fields before the instance is returned.
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

### `getSpyConstructor(OriginalConstructor)`
Returns a [`SpyConstructor`](#spyconstructor-api) of the given constructor `OriginalConstructor`. A `SpyConstructor` is
similar to a `StubConstructor` except for the following differences:
* The `OriginalConstructor` is called when creating a new instance.
* Methods are not stubbed but spied on (but you may manually stub some methods).
* Which methods are spied on is not determined by looking at the prototype but by looking at what methods are actually
present after the constructor has run.

This is useful if you need to preserve the constructor's functionality while being able to track its instances. Note
however that having to rely on `SpyConstructor`s instead of `StubConstructor`s may be an indication of strong couplings
in you software that are generally a sign that your architecture could be improved.

### `SpyConstructor` API
A `SpyConstructor` has the following methods:
* `.withStubs('method1' <,'method2' <...>>)`  
  Instead of spied on, instances should have the listed methods as stubs. If these methods do not exist, an error will
  be thrown. Returns the `SpyConstructor` so you can assign
  
  ```javascript
var Spy = getSpyConstructor(MyConstructor).withStubs('myMethod')
  ```
  
  `.withStubs` also [allows you to specify stub return values](#specifying-stub-return-values), see below.
* `.afterCreation(onAfterCreation)`  
  When a new instance is created, `onAfterCreation(instance)` is called receiving the new instance as parameter; this
  enables you to perform manual post-processing like adding additional fields before the instance is returned.
* `.getInstances()`   
  Returns an array of instances created with the spy constructor.
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

### `getMethodStubs(methodName1 <, methodName2 ...>)`
Returns an object containing the given methods as stubs. Again, `getMethodStubs`
[allows you to specify stub return values](#specifying-stub-return-values).

### Specifying stub return values
`sinon-helpers` allows you to specify return values for any created stub methods:

```javascript
var Stub = sh.getStubConstructor(MyConstructor).withMethods(
             'method1', sh.returning(3),
             'method2', sh.returningThis,
             'method3'
           )
```

This creates a `StubConstructor` where any instance has the three methods `.method1()`, `.method2()` and `.method3()`.
`.method1()` always returns `3`, `.method2()` returns its `this` value and `.method3()` returns `undefined`. This
can also be used to add return values to prototype methods. This also works with `SpyConstrucor`s:

```javascript
var Spy = sh.getSpyConstructor(MyConstructor).withStubs(
             'method1', sh.returning(3),
             'method2', sh.returningThis,
             'method3'
           )
```

This creates a `SpyConstructor` where for any instance, `.method1()`, `.method2()` and `.method3()` are stubbed, and
`.method1()` always returns `3`, `.method2()` returns its `this` value and `.method3()` returns `undefined`.  
With `getMethodStubs()`, you can do the same:

```javascript
var methodStubs = sh.getMethodStubs(
                     'method1', sh.returning(3),
                     'method2', sh.returningThis,
                     'method3'
                  )
```


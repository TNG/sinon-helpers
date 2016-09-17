/* global sinon */
var R = require('ramda')

var setMethodToStub = R.curry(function (object, methodName) {
  object[ methodName ] = sinon.stub()
})

var applyToEachFunctionKeyInObject = function (appliedFunction, object) {
  R.compose(
    R.forEach(appliedFunction),
    R.filter(R.propIs(Function, R.__, object))
  )(Object.getOwnPropertyNames(object))
}

var applyToEachFunctionKeyInPrototypeChain = function (appliedFunction, object) {
  if (object) {
    applyToEachFunctionKeyInObject(appliedFunction, object)
    applyToEachFunctionKeyInPrototypeChain(appliedFunction, Object.getPrototypeOf(object))
  }
}

function getArrayFromArrayLikeObject (args) {
  return Array.prototype.slice.call(args)
}

function getStubConstructor (Target) {
  var instances = []
  var instanceArgs = []

  function StubConstructor () {
    instanceArgs.push(getArrayFromArrayLikeObject(arguments))
    instances.push(this)

    applyToEachFunctionKeyInPrototypeChain(setMethodToStub(this), Target.prototype)
  }

  StubConstructor.withMethods = function () {
    return this
  }

  StubConstructor.getInstances = function () {
    return instances
  }

  StubConstructor.getInstance = function (index) {
    var instanceIndex = index || 0

    if (typeof index === 'undefined') {
      if (instances.length > 1) {
        throw new Error('Tried to access only instance of StubConstructor, but there were ' + instances.length + ' instances.')
      }
    }
    if (instances.length <= instanceIndex) {
      throw new Error('Tried to access StubConstructor instance ' + instanceIndex + ', but there were only ' +
        instances.length + ' instances.')
    }

    return instances[ instanceIndex ]
  }

  StubConstructor.getInstancesArgs = function () {
    return instanceArgs
  }

  StubConstructor.getInstanceArgs = function (index) {
    var instanceIndex = index || 0

    if (typeof index === 'undefined') {
      if (instances.length > 1) {
        throw new Error('Tried to access arguments of only instance of StubConstructor, but there were ' +
          instances.length + ' instances.')
      }
    }
    if (instances.length <= instanceIndex) {
      throw new Error('Tried to access arguments of StubConstructor instance ' + instanceIndex + ', but there were only ' +
        instances.length + ' instances.')
    }

    return instanceArgs[ instanceIndex ]
  }

  return StubConstructor
}

module.exports = {
  getStubConstructor: getStubConstructor
}

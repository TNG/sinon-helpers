/* global sinon */
var R = require('ramda')
var fa = require('fluent-arguments')
var ARG_RETURN_VAL = 'returnVal'
var ARG_RETURN_THIS = 'returnThis'

var setMethodToStub = R.curry(function (object, methodName) {
  object[ methodName ] = sinon.stub()
})

function configureStub (object, params) {
  if (params.hasOwnProperty(ARG_RETURN_THIS)) {
    object[ params.value ].returnsThis()
  } else if (params.hasOwnProperty(ARG_RETURN_VAL)) {
    object[ params.value ].returns(params[ ARG_RETURN_VAL ])
  }
}
var setMethodToStubWithParams = R.curry(function (object, params) {
  setMethodToStub(object, params.value)
  configureStub(object, params)
})

var stubMethodWithParams = R.curry(function (object, params) {
  object[ params.value ] && object[ params.value ].restore && object[ params.value ].restore()
  sinon.stub(object, params.value)
  configureStub(object, params)
})

var spyOnMethod = R.curry(function (object, methodName) {
  sinon.spy(object, methodName)
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

var getInstanceIndexWithValidation = function (index, numInstances) {
  var instanceIndex = index || 0

  if (typeof index === 'undefined') {
    if (numInstances > 1) {
      throw new Error('Tried to access only instance of StubConstructor, but there were ' +
        numInstances + ' instances.')
    }
  }
  if (numInstances <= instanceIndex) {
    throw new Error('Tried to access StubConstructor instance ' + instanceIndex + ', but there were only ' +
      numInstances + ' instances.')
  }
  return instanceIndex
}

function getStubConstructor (Target) {
  var instances = []
  var instanceArgs = []
  var stubParams = []

  function StubConstructor () {
    instanceArgs.push(getArrayFromArrayLikeObject(arguments))
    instances.push(this)

    applyToEachFunctionKeyInPrototypeChain(setMethodToStub(this), Target.prototype)
    stubParams.forEach(setMethodToStubWithParams(this))
  }

  function withMethods (methods) {
    stubParams = methods
    return this
  }

  StubConstructor.withMethods = fa.createFunc(withMethods)

  StubConstructor.getInstances = function () {
    return instances
  }

  StubConstructor.getInstance = function (index) {
    return instances[ getInstanceIndexWithValidation(index, instances.length) ]
  }

  StubConstructor.getInstancesArgs = function () {
    return instanceArgs
  }

  StubConstructor.getInstanceArgs = function (index) {
    return instanceArgs[ getInstanceIndexWithValidation(index, instances.length) ]
  }

  return StubConstructor
}

function getConstructorInstanceWithArgsArray (Constructor, argsArray) {
  function HelpConstructor (args) {
    return Constructor.apply(this, args)
  }

  HelpConstructor.prototype = Constructor.prototype
  return new HelpConstructor(argsArray)
}

function getSpyConstructor (Target) {
  var instances = []
  var instanceArgs = []
  var stubParams = []

  function SpyConstructor () {
    var instance = getConstructorInstanceWithArgsArray(Target, arguments)
    instanceArgs.push(getArrayFromArrayLikeObject(arguments))
    instances.push(instance)

    applyToEachFunctionKeyInPrototypeChain(spyOnMethod(instance), instance)
    stubParams.forEach(stubMethodWithParams(instance))
    return instance
  }

  function withStubs (stubs) {
    stubParams = stubs
    return this
  }

  SpyConstructor.withStubs = fa.createFunc(withStubs)

  SpyConstructor.getInstances = function () {
    return instances
  }

  SpyConstructor.getInstance = function (index) {
    return instances[ getInstanceIndexWithValidation(index, instances.length) ]
  }

  SpyConstructor.getInstancesArgs = function () {
    return instanceArgs
  }

  SpyConstructor.getInstanceArgs = function (index) {
    return instanceArgs[ getInstanceIndexWithValidation(index, instances.length) ]
  }

  return SpyConstructor
}

module.exports = {
  getStubConstructor: getStubConstructor,
  getSpyConstructor: getSpyConstructor,
  returning: fa.createArg({ args: [ ARG_RETURN_VAL ], extendsPrevious: true }),
  returningThis: fa.createArg({ extra: { returnThis: true }, extendsPrevious: true })
}

/* global sinon */
var R = require('ramda')
var fa = require('fluent-arguments')
var ARG_RETURN_VAL = 'returnVal'
var ARG_RETURN_THIS = 'returnThis'

var setMethodToStub = R.curry(function (object, methodName) {
  object[ methodName ] = sinon.stub()
})

var stubMethodWithParams = R.curry(function (object, params) {
  setMethodToStub(object, params.value)
  if (params.hasOwnProperty(ARG_RETURN_THIS)) {
    object[ params.value ].returnsThis()
  } else if (params.hasOwnProperty(ARG_RETURN_VAL)) {
    object[ params.value ].returns(params[ ARG_RETURN_VAL ])
  }
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
    stubParams.forEach(stubMethodWithParams(this))
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

module.exports = {
  getStubConstructor: getStubConstructor,
  returning: fa.createArg({ args: [ ARG_RETURN_VAL ], extendsPrevious: true }),
  returningThis: fa.createArg({ extra: { returnThis: true }, extendsPrevious: true })
}

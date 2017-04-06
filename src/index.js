var getStubOrSpyConstructor = require('./constructors')
var R = require('ramda')
var fa = require('fluent-arguments')
var sinon = require('sinon')
var ARG_RETURN_VAL = 'returnVal'
var ARG_RETURN_THIS = 'returnThis'

var setMethodToStub = R.curry(function (object, methodName) {
  object[methodName] = sinon.stub()
})

function configureStub (object, params) {
  if (params.hasOwnProperty(ARG_RETURN_THIS)) {
    object[params.value].returnsThis()
  } else if (params.hasOwnProperty(ARG_RETURN_VAL)) {
    object[params.value].returns(params[ARG_RETURN_VAL])
  }
}
var setMethodToStubWithParams = R.curry(function (object, params) {
  setMethodToStub(object, params.value)
  configureStub(object, params)
})

var stubMethodWithParams = R.curry(function (object, params) {
  object[params.value] && object[params.value].restore && object[params.value].restore()
  sinon.stub(object, params.value)
  configureStub(object, params)
})

var spyOnMethod = R.curry(function (object, methodName) {
  if (!(object[methodName] && object[methodName].isSinonProxy)) {
    sinon.spy(object, methodName)
  }
})

var copyAndSpyOnMethod = R.curry(function (object, source, methodName) {
  if (source[methodName].isSinonProxy) {
    object[methodName] = source[methodName]
  } else {
    object[methodName] = sinon.spy(source[methodName])
  }
})

function getStubConstructorProperties (Target) {
  return {
    SourceConstructor: function () {},
    processMethodOfInstance: setMethodToStub,
    getInstanceMethodNameSource: function () { return Target.prototype },
    processMethodOfConstructor: function (TheConstructor) { return setMethodToStub(TheConstructor) },
    configureMethodsKey: 'withMethods',
    configureMethodOfInstance: setMethodToStubWithParams
  }
}

function getSpyConstructorProperties (Target) {
  return {
    SourceConstructor: Target,
    processMethodOfInstance: spyOnMethod,
    getInstanceMethodNameSource: function (instance) { return instance },
    processMethodOfConstructor: function (TheConstructor) { return copyAndSpyOnMethod(TheConstructor, Target) },
    configureMethodsKey: 'withStubs',
    configureMethodOfInstance: stubMethodWithParams
  }
}

function getMethodStubs (methodParams) {
  var result = {}

  methodParams.forEach(setMethodToStubWithParams(result))
  return result
}

module.exports = {
  getStubConstructor: getStubOrSpyConstructor(getStubConstructorProperties),
  getSpyConstructor: getStubOrSpyConstructor(getSpyConstructorProperties),
  getMethodStubs: fa.createFunc(getMethodStubs),
  returning: fa.createArg({args: [ARG_RETURN_VAL], extendsPrevious: true}),
  returningThis: fa.createArg({extra: {returnThis: true}, extendsPrevious: true})
}

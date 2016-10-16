var R = require('ramda')
var fa = require('fluent-arguments')
var sinon = require('sinon')
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
  if (!(object[ methodName ] && object[ methodName ].isSinonProxy)) {
    sinon.spy(object, methodName)
  }
})

var copyAndSpyOnMethod = R.curry(function (object, source, methodName) {
  if (source[ methodName ].isSinonProxy) {
    object[ methodName ] = source[ methodName ]
  } else {
    object[ methodName ] = sinon.spy(source[ methodName ])
  }
})

var isPropFunction = R.curry(function (object, prop) {
  return !Object.getOwnPropertyDescriptor(object, prop).get && typeof object[ prop ] === 'function'
})

var applyToEachFunctionKeyInObject = function (appliedFunction, object) {
  R.compose(
    R.forEach(appliedFunction),
    R.filter(isPropFunction(object))
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

function getConstructorInstanceWithArgs (Constructor, constructorArgs) {
  function HelpConstructor (args) {
    return Constructor.apply(this, args)
  }

  HelpConstructor.prototype = Constructor.prototype
  return new HelpConstructor(constructorArgs)
}

function getStubConstructorProperties (Target) {
  return {
    SourceConstructor: function () {},
    processInstanceMethod: setMethodToStub,
    getInstanceMethodNameSource: function () { return Target.prototype },
    processClassMethod: function (StubOrSpyConstructor) { return setMethodToStub(StubOrSpyConstructor) },
    configureMethodsKey: 'withMethods',
    configureMethod: setMethodToStubWithParams
  }
}

function getSpyConstructorProperties (Target) {
  return {
    SourceConstructor: Target,
    processInstanceMethod: spyOnMethod,
    getInstanceMethodNameSource: function (instance) { return instance },
    processClassMethod: function (StubOrSpyConstructor) { return copyAndSpyOnMethod(StubOrSpyConstructor, Target) },
    configureMethodsKey: 'withStubs',
    configureMethod: stubMethodWithParams
  }
}

function getStubOrSpyConstructor (getConstructorProperties) {
  return function (Target) {
    var constructorProps = getConstructorProperties(Target)
    var instances = []
    var instanceArgs = []
    var methodParams = []
    var afterCreation

    function StubOrSpyConstructor () {
      var instance = getConstructorInstanceWithArgs(constructorProps.SourceConstructor, arguments)
      instanceArgs.push(getArrayFromArrayLikeObject(arguments))
      instances.push(instance)

      Target && applyToEachFunctionKeyInPrototypeChain(
        constructorProps.processInstanceMethod(instance), constructorProps.getInstanceMethodNameSource(instance))
      methodParams.forEach(constructorProps.configureMethod(instance))
      afterCreation && afterCreation(instance)
      return instance
    }

    function configureMethods (methods) {
      methodParams = methods
      return this
    }

    StubOrSpyConstructor[ constructorProps.configureMethodsKey ] = fa.createFunc(configureMethods)

    StubOrSpyConstructor.afterCreation = function (onAfterCreation) {
      afterCreation = onAfterCreation
      return this
    }

    StubOrSpyConstructor.getInstances = function () {
      return instances
    }

    StubOrSpyConstructor.getInstance = function (index) {
      return instances[ getInstanceIndexWithValidation(index, instances.length) ]
    }

    StubOrSpyConstructor.getInstancesArgs = function () {
      return instanceArgs
    }

    StubOrSpyConstructor.getInstanceArgs = function (index) {
      return instanceArgs[ getInstanceIndexWithValidation(index, instances.length) ]
    }

    Target && applyToEachFunctionKeyInObject(constructorProps.processClassMethod(StubOrSpyConstructor), Target)
    return StubOrSpyConstructor
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
  returning: fa.createArg({ args: [ ARG_RETURN_VAL ], extendsPrevious: true }),
  returningThis: fa.createArg({ extra: { returnThis: true }, extendsPrevious: true })
}

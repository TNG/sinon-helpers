var R = require('ramda')
var fa = require('fluent-arguments')

function getArrayFromArrayLikeObject (args) {
  return Array.prototype.slice.call(args)
}

var isMethod = R.curry(function (object, propName) {
  return !Object.getOwnPropertyDescriptor(object, propName).get &&
    typeof object[propName] === 'function' && !(propName === 'constructor')
})

var applyToEachFunctionKeyInObject = function (appliedFunction, object) {
  R.compose(
    R.forEach(appliedFunction),
    R.filter(isMethod(object))
  )(Object.getOwnPropertyNames(object))
}

var applyToEachFunctionKeyInPrototypeChain = function (appliedFunction, object) {
  if (object) {
    applyToEachFunctionKeyInObject(appliedFunction, object)
    applyToEachFunctionKeyInPrototypeChain(appliedFunction, Object.getPrototypeOf(object))
  }
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

module.exports = function getStubOrSpyConstructor (getConstructorProperties) {
  return function (Target) {
    var constructorProps = getConstructorProperties(Target)
    var instances = []
    var instanceArgs = []
    var methodParams = []
    var afterCreation

    function StubOrSpyConstructor () {
      constructorProps.SourceConstructor.apply(this, arguments)
      instanceArgs.push(getArrayFromArrayLikeObject(arguments))
      instances.push(this)

      Target && applyToEachFunctionKeyInPrototypeChain(
        constructorProps.processMethodOfInstance(this), constructorProps.getInstanceMethodNameSource(this))
      methodParams.forEach(constructorProps.configureMethodOfInstance(this))
      afterCreation && afterCreation(this)
    }

    StubOrSpyConstructor.prototype = constructorProps.SourceConstructor.prototype

    function configureMethods (methods) {
      methodParams = methods
      return this
    }

    StubOrSpyConstructor[constructorProps.configureMethodsKey] = fa.createFunc(configureMethods)

    StubOrSpyConstructor.afterCreation = function (onAfterCreation) {
      afterCreation = onAfterCreation
      return this
    }

    StubOrSpyConstructor.getInstances = function () {
      return instances
    }

    StubOrSpyConstructor.getInstance = function (index) {
      return instances[getInstanceIndexWithValidation(index, instances.length)]
    }

    StubOrSpyConstructor.getInstancesArgs = function () {
      return instanceArgs
    }

    StubOrSpyConstructor.getInstanceArgs = function (index) {
      return instanceArgs[getInstanceIndexWithValidation(index, instances.length)]
    }

    Target && applyToEachFunctionKeyInObject(constructorProps.processMethodOfConstructor(StubOrSpyConstructor), Target)
    return StubOrSpyConstructor
  }
}

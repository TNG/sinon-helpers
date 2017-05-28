import fa from 'fluent-arguments'
import { compose, curry, filter, forEach } from 'ramda'

const getArrayFromArrayLikeObject = args => Array.prototype.slice.call(args)

const isMethod = curry(
  (object, propName) =>
    !Object.getOwnPropertyDescriptor(object, propName).get &&
    typeof object[propName] === 'function' &&
    !(propName === 'constructor')
)

const applyToEachFunctionKeyInObject = (appliedFunction, object) =>
  compose(forEach(appliedFunction), filter(isMethod(object)))(
    Object.getOwnPropertyNames(object)
  )

const applyToEachFunctionKeyInPrototypeChain = (appliedFunction, object) => {
  if (object) {
    applyToEachFunctionKeyInObject(appliedFunction, object)
    applyToEachFunctionKeyInPrototypeChain(
      appliedFunction,
      Object.getPrototypeOf(object)
    )
  }
}

const getInstanceIndexWithValidation = (index, numInstances) => {
  const instanceIndex = index || 0

  if (typeof index === 'undefined') {
    if (numInstances > 1) {
      throw new Error(
        `Tried to access only instance of StubConstructor, ` +
          `but there were ${numInstances} instances.`
      )
    }
  }
  if (numInstances <= instanceIndex) {
    throw new Error(
      `Tried to access StubConstructor instance ${instanceIndex}, ` +
        `but there were only ${numInstances} instances.`
    )
  }
  return instanceIndex
}

export default getConstructorProperties => Target => {
  const constructorProps = getConstructorProperties(Target)
  const instances = []
  const instanceArgs = []
  let methodParams = []
  let afterCreation

  function StubOrSpyConstructor () {
    constructorProps.SourceConstructor.apply(this, arguments)
    instanceArgs.push(getArrayFromArrayLikeObject(arguments))
    instances.push(this)

    Target &&
      applyToEachFunctionKeyInPrototypeChain(
        constructorProps.processMethodOfInstance(this),
        constructorProps.getInstanceMethodNameSource(this)
      )
    methodParams.forEach(constructorProps.configureMethodOfInstance(this))
    afterCreation && afterCreation(this)
  }

  StubOrSpyConstructor.prototype = constructorProps.SourceConstructor.prototype

  StubOrSpyConstructor[constructorProps.addMethodsKey] = fa.createFunc(function (
    methods
  ) {
    methodParams = methods
    return this
  })

  StubOrSpyConstructor.afterCreation = function (onAfterCreation) {
    afterCreation = onAfterCreation
    return this
  }

  StubOrSpyConstructor.getInstances = () => instances

  StubOrSpyConstructor.getInstance = index =>
    instances[getInstanceIndexWithValidation(index, instances.length)]

  StubOrSpyConstructor.getInstancesArgs = () => instanceArgs

  StubOrSpyConstructor.getInstanceArgs = index =>
    instanceArgs[getInstanceIndexWithValidation(index, instances.length)]

  Target &&
    applyToEachFunctionKeyInObject(
      constructorProps.processMethodOfConstructor(StubOrSpyConstructor),
      Target
    )
  return StubOrSpyConstructor
}

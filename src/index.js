import { createArg, createFunc } from 'fluent-arguments'
import { curry } from 'ramda'
import sinon from 'sinon'
import getStubOrSpyConstructor from './constructors'

const ARG_RETURN_VAL = 'returnVal'
const ARG_RETURN_THIS = 'returnThis'

const setMethodToStub = curry((object, methodName) => {
  object[methodName] = sinon.stub()
})

const configureStub = (object, params) => {
  if (params.hasOwnProperty(ARG_RETURN_THIS)) {
    object[params.value].returnsThis()
  } else if (params.hasOwnProperty(ARG_RETURN_VAL)) {
    object[params.value].returns(params[ARG_RETURN_VAL])
  }
}
const setMethodToStubWithParams = curry((object, params) => {
  setMethodToStub(object, params.value)
  configureStub(object, params)
})

const stubMethodWithParams = curry((object, params) => {
  object[params.value] &&
    object[params.value].restore &&
    object[params.value].restore()
  sinon.stub(object, params.value)
  configureStub(object, params)
})

const spyOnMethod = curry((object, methodName) => {
  if (!(object[methodName] && object[methodName].isSinonProxy)) {
    sinon.spy(object, methodName)
  }
})

const copyAndSpyOnMethod = curry((object, source, methodName) => {
  if (source[methodName].isSinonProxy) {
    object[methodName] = source[methodName]
  } else {
    object[methodName] = sinon.spy(source[methodName])
  }
})

const getStubConstructorProperties = Target => ({
  SourceConstructor: function () {},
  processMethodOfInstance: setMethodToStub,
  getInstanceMethodNameSource: () => Target.prototype,
  processMethodOfConstructor: TheConstructor => setMethodToStub(TheConstructor),
  addMethodsKey: 'withMethods',
  configureMethodOfInstance: setMethodToStubWithParams
})

const getSpyConstructorProperties = Target => ({
  SourceConstructor: Target,
  processMethodOfInstance: spyOnMethod,
  getInstanceMethodNameSource: instance => instance,
  processMethodOfConstructor: TheConstructor =>
    copyAndSpyOnMethod(TheConstructor, Target),
  addMethodsKey: 'withStubs',
  configureMethodOfInstance: stubMethodWithParams
})

function getMethodStubsHandler (methodParams) {
  const result = {}

  methodParams.forEach(setMethodToStubWithParams(result))
  return result
}

export const getStubConstructor = getStubOrSpyConstructor(
  getStubConstructorProperties
)

export const getSpyConstructor = getStubOrSpyConstructor(
  getSpyConstructorProperties
)

export const getMethodStubs = createFunc(getMethodStubsHandler)

export const returning = createArg({
  args: [ARG_RETURN_VAL],
  extendsPrevious: true
})

export const returningThis = createArg({
  extra: { returnThis: true },
  extendsPrevious: true
})

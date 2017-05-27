import fa from 'fluent-arguments'
import R from 'ramda'
import sinon from 'sinon'
import getStubOrSpyConstructor from './constructors'

const ARG_RETURN_VAL = 'returnVal'
const ARG_RETURN_THIS = 'returnThis'

const setMethodToStub = R.curry((object, methodName) => {
  object[methodName] = sinon.stub()
})

const configureStub = (object, params) => {
  if (params.hasOwnProperty(ARG_RETURN_THIS)) {
    object[params.value].returnsThis()
  } else if (params.hasOwnProperty(ARG_RETURN_VAL)) {
    object[params.value].returns(params[ARG_RETURN_VAL])
  }
}
const setMethodToStubWithParams = R.curry((object, params) => {
  setMethodToStub(object, params.value)
  configureStub(object, params)
})

const stubMethodWithParams = R.curry((object, params) => {
  object[params.value] && object[params.value].restore && object[params.value].restore()
  sinon.stub(object, params.value)
  configureStub(object, params)
})

const spyOnMethod = R.curry((object, methodName) => {
  if (!(object[methodName] && object[methodName].isSinonProxy)) {
    sinon.spy(object, methodName)
  }
})

const copyAndSpyOnMethod = R.curry((object, source, methodName) => {
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
  configureMethodsKey: 'withMethods',
  configureMethodOfInstance: setMethodToStubWithParams
})

const getSpyConstructorProperties = Target => ({
  SourceConstructor: Target,
  processMethodOfInstance: spyOnMethod,
  getInstanceMethodNameSource: instance => instance,
  processMethodOfConstructor: TheConstructor => copyAndSpyOnMethod(TheConstructor, Target),
  configureMethodsKey: 'withStubs',
  configureMethodOfInstance: stubMethodWithParams
})

function getMethodStubsHandler (methodParams) {
  var result = {}

  methodParams.forEach(setMethodToStubWithParams(result))
  return result
}

export const getStubConstructor = getStubOrSpyConstructor(getStubConstructorProperties)
export const getSpyConstructor = getStubOrSpyConstructor(getSpyConstructorProperties)
export const getMethodStubs = fa.createFunc(getMethodStubsHandler)
export const returning = fa.createArg({args: [ARG_RETURN_VAL], extendsPrevious: true})
export const returningThis = fa.createArg({extra: {returnThis: true}, extendsPrevious: true})

import sinon from 'sinon'
import /* tree-shaking no-side-effects-when-called */ getStubOrSpyConstructor from './constructors'

const setMethodToStub = object => methodName => {
  if (!(methodName in object)) {
    object[methodName] = sinon.stub()
  }
}

const spyOnMethod = object => methodName => {
  if (
    !(methodName in Object.prototype) &&
    !(object[methodName] && object[methodName].isSinonProxy)
  ) {
    sinon.spy(object, methodName)
  }
}

const copyAndSpyOnMethod = (object, source) => methodName => {
  if (source[methodName].isSinonProxy) {
    object[methodName] = source[methodName]
  } else {
    object[methodName] = sinon.spy(source[methodName])
  }
}

const getStubConstructorProperties = Target => ({
  SourceConstructor: function () {},
  processMethodOfInstance: setMethodToStub,
  getInstanceMethodNameSource: () => Target.prototype,
  processMethodOfConstructor: TheConstructor => setMethodToStub(TheConstructor)
})

const getSpyConstructorProperties = Target => ({
  SourceConstructor: Target,
  processMethodOfInstance: spyOnMethod,
  getInstanceMethodNameSource: instance => instance,
  processMethodOfConstructor: TheConstructor => copyAndSpyOnMethod(TheConstructor, Target)
})

export const getStubConstructor = /* @__PURE__ */ getStubOrSpyConstructor(
  getStubConstructorProperties
)

export const getSpyConstructor = /* @__PURE__ */ getStubOrSpyConstructor(
  getSpyConstructorProperties
)

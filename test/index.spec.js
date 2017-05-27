/* eslint-env mocha */
/* eslint-disable no-unused-expressions,no-new */

const sinonHelpers = require('../dist/index')
const getStubConstructor = sinonHelpers.getStubConstructor
const getSpyConstructor = sinonHelpers.getSpyConstructor
const getMethodStubs = sinonHelpers.getMethodStubs
const returning = sinonHelpers.returning
const returningThis = sinonHelpers.returningThis

const expect = require('chai').expect
const sinon = require('sinon')

let TestConstructor

beforeEach(() => {
  global.sinon = sinon

  const testPrototype2 = {
    proto2: () => 'p2',
    field1: () => 'pf1'
  }

  const testPrototype1 = Object.create(testPrototype2, {
    proto1: {writable: true, enumerable: false, value: () => 'p1'}
  })

  // if this were defined in the object literal, it would be evaluated by Object.create
  Object.defineProperty(testPrototype1, 'protoGetter',
    {get: () => { throw new Error('inherited getter was evaluated') }})

  const testPrototype = Object.create(testPrototype1, {
    field1: {writable: true, enumerable: true, value: () => 1},
    field2: {writable: true, enumerable: false, value: () => 2}
  })

  TestConstructor = function () {
    this.args = Array.prototype.slice.call(arguments)
    this.field3 = () => 3
    this.field4 = sinon.stub()
    Object.defineProperty(this, 'getter', {get: () => { throw new Error('getter was evaluated') }})
  }

  TestConstructor.prototype = testPrototype
  TestConstructor.instanceMethod1 = () => 'i1'
  TestConstructor.instanceMethod2 = sinon.stub()
})

afterEach(() => {
  delete global.sinon
})

describe('getStubConstructor', () => {
  let StubConstructor

  beforeEach(() => {
    StubConstructor = getStubConstructor(TestConstructor)
  })

  it('should return a constructor that creates an object with all methods of the prototype object', () => {
    const stubbedObject = new StubConstructor()

    expect(stubbedObject.field1).to.be.a('function', 'field1')
    expect(stubbedObject.field2).to.be.a('function', 'field2')
    expect(stubbedObject.proto1).to.be.a('function', 'proto1')
    expect(stubbedObject.proto2).to.be.a('function', 'proto2')
  })

  it('should not call through to the original constructor', () => {
    const stubbedObject = new StubConstructor()

    expect(stubbedObject.field3).to.be.undefined
  })

  it('should create stubs for all instance methods', () => {
    expect(StubConstructor.instanceMethod1).to.have.property('isSinonProxy', true)
    expect(StubConstructor.instanceMethod1()).to.be.undefined
    expect(StubConstructor.instanceMethod2).to.have.property('isSinonProxy', true)
  })

  it('should create an empty constructor if no arguments are supplied', () => {
    StubConstructor = getStubConstructor()
    const stubbedObject = new StubConstructor()

    expect(stubbedObject).to.be.an('object')
  })

  describe('withMethods', () => {
    it('should allow specifying additional methods', () => {
      StubConstructor = StubConstructor.withMethods('m1', 'm2')
      const stubbedObject = new StubConstructor()

      expect(stubbedObject.m1).to.be.a('function', 'm1')
      expect(stubbedObject.m2).to.be.a('function', 'm2')
    })

    it('should allow specifying method return values', () => {
      StubConstructor = StubConstructor.withMethods('m1', returning(1), 'field1', returning(2), 'm2')
      const stubbedObject = new StubConstructor()

      expect(stubbedObject.m1()).to.equal(1, 'm1')
      expect(stubbedObject.field1()).to.equal(2, 'field1')
      expect(stubbedObject.m2()).to.be.undefined
    })

    it('should allow for methods to return their this value', () => {
      StubConstructor = StubConstructor.withMethods('m1', returningThis, 'field1', returningThis, 'm2')
      const stubbedObject = new StubConstructor()

      expect(stubbedObject.m1().field1().m2).to.be.a('function')
    })
  })
})

describe('getSpyConstructor', () => {
  let SpyConstructor

  beforeEach(() => {
    SpyConstructor = getSpyConstructor(TestConstructor)
  })

  it('should return a constructor that creates an object with all methods the constructor creates', () => {
    const spiedObject = new SpyConstructor()

    expect(spiedObject.field1()).to.equal(1)
    expect(spiedObject.field2()).to.equal(2)
    expect(spiedObject.field3()).to.equal(3)
    expect(spiedObject.proto1()).to.equal('p1')
    expect(spiedObject.proto2()).to.equal('p2')
  })

  it('should create instances of the original constructor', () => {
    const spiedObject = new SpyConstructor()
    expect(spiedObject).to.be.an.instanceof(TestConstructor)
  })

  it('should create instances using the right arguments', () => {
    const spiedObject = new SpyConstructor('Var 1', 2)
    expect(spiedObject.args).to.deep.equal(['Var 1', 2])
  })

  it('should put spies on all methods', () => {
    const spiedObject = new SpyConstructor()

    expect(spiedObject.field1).to.have.property('isSinonProxy', true, 'field1')
    expect(spiedObject.field2).to.have.property('isSinonProxy', true, 'field2')
    expect(spiedObject.field3).to.have.property('isSinonProxy', true, 'field3')
    expect(spiedObject.field4).to.have.property('isSinonProxy', true, 'field4')
    expect(spiedObject.proto1).to.have.property('isSinonProxy', true, 'proto1')
    expect(spiedObject.proto2).to.have.property('isSinonProxy', true, 'proto2')
  })

  it('should spy on all instance methods', () => {
    expect(SpyConstructor.instanceMethod1).to.have.property('isSinonProxy', true)
    expect(SpyConstructor.instanceMethod1()).to.equal('i1')
    expect(SpyConstructor.instanceMethod2).to.have.property('isSinonProxy', true)
  })

  describe('withStubs', () => {
    it('should allow stubbing methods', () => {
      SpyConstructor = SpyConstructor.withStubs('field1', 'field3', 'proto1')
      const spiedObject = new SpyConstructor()

      expect(spiedObject.field1).to.have.property('isSinonProxy', true)
      expect(spiedObject.field3).to.have.property('isSinonProxy', true)
      expect(spiedObject.proto1).to.have.property('isSinonProxy', true)
      expect(spiedObject.field1()).to.be.undefined
      expect(spiedObject.field3()).to.be.undefined
      expect(spiedObject.proto1()).to.be.undefined
    })

    it('should allow specifying stub return values', () => {
      SpyConstructor = SpyConstructor.withStubs('field1', returning(10), 'field3', returning(20), 'proto1')
      const spiedObject = new SpyConstructor()

      expect(spiedObject.field1()).to.equal(10, 'field1')
      expect(spiedObject.field3()).to.equal(20, 'field3')
      expect(spiedObject.proto1()).to.be.undefined
    })

    it('should allow for methods to return their this value', () => {
      SpyConstructor = SpyConstructor.withStubs('field1', returningThis, 'field3', returningThis, 'proto1')
      const spiedObject = new SpyConstructor()

      expect(spiedObject.field1().field3().proto1).to.be.a('function')
    })
  })
})

describe('getSpy- and getStubConstructor', () => {
  const dataProvider = [{
    description: 'getStubConstrucor',
    getConstructor: getStubConstructor
  }, {
    description: 'getSpyConstrucor',
    getConstructor: getSpyConstructor
  }]

  dataProvider.forEach(testData => {
    describe(testData.description, () => {
      let NewConstructor

      beforeEach(() => {
        NewConstructor = testData.getConstructor(TestConstructor)
      })

      it('should create instances of itself', () => {
        const instance = new NewConstructor()
        expect(instance).to.be.an.instanceof(NewConstructor)
      })

      describe('afterCreation', () => {
        it('should allow for manual post-processing before an instance is created', () => {
          NewConstructor.afterCreation(instance => {
            instance.extraField = 7
          })
          const instance = new NewConstructor()
          expect(instance.extraField).to.equal(7)
        })

        it('should return the constructor', () => {
          expect(NewConstructor.afterCreation(instance => {
            instance.extraField = 7
          })).to.equal(NewConstructor)
        })
      })

      describe('getInstances', () => {
        it('should return an empty list if there are no instances', () => {
          expect(NewConstructor.getInstances()).to.deep.equal([])
        })

        it('should return a list of instances', () => {
          const instance1 = new NewConstructor()
          const instance2 = new NewConstructor()

          expect(NewConstructor.getInstances()).to.deep.equal([instance1, instance2])
        })
      })

      describe('getInstance', () => {
        it('should return a single instance if one has been created', () => {
          const instance = new NewConstructor()

          expect(NewConstructor.getInstance()).to.equal(instance)
        })

        it('should throw an error if no instance has been created', () => {
          expect(NewConstructor.getInstance).to.throw(/0 instances/)
        })

        it('should throw an error if more than one instance has been created', () => {
          new NewConstructor()
          new NewConstructor()

          expect(NewConstructor.getInstance).to.throw(/2 instances/)
        })

        it('should return an instance with a given index', () => {
          new NewConstructor()
          const instance2 = new NewConstructor()

          expect(NewConstructor.getInstance(1)).to.equal(instance2)
        })

        it('should throw an error if not enough instances exist', () => {
          new NewConstructor()

          expect(() => NewConstructor.getInstance(1)).to.throw(/1 instances/)
        })
      })

      describe('getInstancesArgs', () => {
        it('should return an empty list if there are no instances', () => {
          expect(NewConstructor.getInstancesArgs()).to.deep.equal([])
        })

        it('should return a list of constructor arguments', () => {
          new NewConstructor('foo', 'bar')
          new NewConstructor('baz', 'bla')

          expect(NewConstructor.getInstancesArgs()).to.deep.equal([['foo', 'bar'], ['baz', 'bla']])
        })
      })

      describe('getInstanceArgs', () => {
        it('should return the arguments of a single instance if one has been created', () => {
          new NewConstructor('foo', 'bar')
          expect(NewConstructor.getInstanceArgs()).to.deep.equal(['foo', 'bar'])
        })

        it('should throw an error if no instance has been created', () => {
          expect(NewConstructor.getInstanceArgs).to.throw(/0 instances/)
        })

        it('should throw an error if more than one instance has been created', () => {
          new NewConstructor('foo', 'bar')
          new NewConstructor('baz', 'bla')

          expect(NewConstructor.getInstanceArgs).to.throw(/2 instances/)
        })

        it('should return the arguments of an instance with a given index', () => {
          new NewConstructor('foo', 'bar')
          new NewConstructor('baz', 'bla')

          expect(NewConstructor.getInstanceArgs(1)).to.deep.equal(['baz', 'bla'])
        })

        it('should throw an error if not enough instances exist', () => {
          new NewConstructor('foo', 'bar')

          expect(() => { NewConstructor.getInstanceArgs(1) }).to.throw(/1 instances/)
        })
      })
    })
  })
})

describe('getMethodStubs', () => {
  it('should create an object with stubs', () => {
    const methodStubs = getMethodStubs('method1', 'method2')

    expect(methodStubs.method1.isSinonProxy).to.be.true
    expect(methodStubs.method2.isSinonProxy).to.be.true
  })

  it('should allow specifying stub return values', () => {
    const methodStubs = getMethodStubs('method1', returning(10), 'method2', returning(20), 'method3')

    expect(methodStubs.method1()).to.equal(10, 'method1')
    expect(methodStubs.method2()).to.equal(20, 'method2')
    expect(methodStubs.method3()).to.be.undefined
  })

  it('should allow for methods to return their this value', () => {
    const methodStubs = getMethodStubs('method1', returningThis, 'method2', returningThis, 'method3')

    expect(methodStubs.method1().method2().method3).to.be.a('function')
  })
})

/* eslint-env mocha */
/* eslint-disable no-unused-expressions,no-new,tree-shaking/no-side-effects-in-initialization */

const sinonHelpers = require('../dist/index')
const getStubConstructor = sinonHelpers.getStubConstructor
const getSpyConstructor = sinonHelpers.getSpyConstructor

const expect = require('chai').expect
const sinon = require('sinon')

let TestConstructor

beforeEach(function () {
  global.sinon = sinon

  const testPrototype2 = {
    proto2: function () {
      return 'p2'
    },
    field1: function () {
      return 'pf1'
    }
  }

  const testPrototype1 = Object.create(testPrototype2, {
    proto1: {
      writable: true,
      enumerable: false,
      value: function () {
        return 'p1'
      }
    }
  })

  // if this were defined in the object literal, it would be evaluated by Object.create
  Object.defineProperty(testPrototype1, 'protoGetter', {
    get: function () {
      throw new Error('inherited getter was evaluated')
    }
  })

  const testPrototype = Object.create(testPrototype1, {
    field1: {
      writable: true,
      enumerable: true,
      value: function () {
        return 1
      }
    },
    field2: {
      writable: true,
      enumerable: false,
      value: function () {
        return 2
      }
    }
  })

  TestConstructor = function () {
    if (this instanceof TestConstructor) {
      this.args = Array.prototype.slice.call(arguments)
      this.field3 = function () {
        return 3
      }
      this.field4 = sinon.stub()
      Object.defineProperty(this, 'getter', {
        get: function () {
          throw new Error('getter was evaluated')
        }
      })
    }
  }

  TestConstructor.prototype = testPrototype
  TestConstructor.classMethod1 = function () {
    return 'i1'
  }
  TestConstructor.classMethod2 = sinon.stub()
})

afterEach(function () {
  delete global.sinon
})

describe('getStubConstructor', function () {
  let StubConstructor

  beforeEach(function () {
    StubConstructor = getStubConstructor(TestConstructor)
  })

  it('should return a constructor that creates an object with all methods of the prototype object', function () {
    const stubbedObject = new StubConstructor()

    expect(stubbedObject.field1).to.be.a('function', 'field1')
    expect(stubbedObject.field2).to.be.a('function', 'field2')
    expect(stubbedObject.proto1).to.be.a('function', 'proto1')
    expect(stubbedObject.proto2).to.be.a('function', 'proto2')
  })

  it('should not call through to the original constructor', function () {
    const stubbedObject = new StubConstructor()

    expect(stubbedObject.field3).to.be.undefined
  })

  it('should create stubs for all class methods', function () {
    expect(StubConstructor.classMethod1).to.have.property('isSinonProxy', true)
    expect(StubConstructor.classMethod1()).to.be.undefined
    expect(StubConstructor.classMethod2).to.have.property('isSinonProxy', true)
  })

  it('should create an empty constructor if no arguments are supplied', function () {
    StubConstructor = getStubConstructor()
    const stubbedObject = new StubConstructor()

    expect(stubbedObject).to.be.an('object')
  })
})

describe('getSpyConstructor', function () {
  let SpyConstructor

  beforeEach(function () {
    SpyConstructor = getSpyConstructor(TestConstructor)
  })

  it('should return a constructor that creates an object with all methods the constructor creates', function () {
    const spiedObject = new SpyConstructor()

    expect(spiedObject.field1()).to.equal(1)
    expect(spiedObject.field2()).to.equal(2)
    expect(spiedObject.field3()).to.equal(3)
    expect(spiedObject.proto1()).to.equal('p1')
    expect(spiedObject.proto2()).to.equal('p2')
  })

  it('should create instances of the original constructor', function () {
    const spiedObject = new SpyConstructor()
    expect(spiedObject).to.be.an.instanceof(TestConstructor)
  })

  it('should create instances using the right arguments', function () {
    const spiedObject = new SpyConstructor('Var 1', 2)
    expect(spiedObject.args).to.deep.equal(['Var 1', 2])
  })

  it('should put spies on all methods', function () {
    const spiedObject = new SpyConstructor()

    expect(spiedObject.field1).to.have.property('isSinonProxy', true, 'field1')
    expect(spiedObject.field2).to.have.property('isSinonProxy', true, 'field2')
    expect(spiedObject.field3).to.have.property('isSinonProxy', true, 'field3')
    expect(spiedObject.field4).to.have.property('isSinonProxy', true, 'field4')
    expect(spiedObject.proto1).to.have.property('isSinonProxy', true, 'proto1')
    expect(spiedObject.proto2).to.have.property('isSinonProxy', true, 'proto2')
  })

  it('should spy on all class methods', function () {
    expect(SpyConstructor.classMethod1).to.have.property('isSinonProxy', true)
    expect(SpyConstructor.classMethod1()).to.equal('i1')
    expect(SpyConstructor.classMethod2).to.have.property('isSinonProxy', true)
  })
})

describe('getSpy- and getStubConstructor', function () {
  const dataProvider = [
    {
      description: 'getStubConstrucor',
      getConstructor: getStubConstructor
    },
    {
      description: 'getSpyConstrucor',
      getConstructor: getSpyConstructor
    }
  ]

  dataProvider.forEach(function (testData) {
    describe(testData.description, function () {
      let NewConstructor

      beforeEach(function () {
        NewConstructor = testData.getConstructor(TestConstructor)
      })

      it('should create instances of itself', function () {
        const instance = new NewConstructor()
        expect(instance).to.be.an.instanceof(NewConstructor)
      })

      describe('withInit', function () {
        it('should allow for manual post-processing before an instance is created', function () {
          NewConstructor.withInit(function (instance) {
            instance.extraField = 7
            instance.returnSelf = sinon.stub().callsFake(() => instance)
          })
          const instance = new NewConstructor()
          expect(instance.extraField).to.equal(7)
          expect(instance.returnSelf().returnSelf()).to.equal(instance)
        })

        it('should return the constructor', function () {
          expect(
            NewConstructor.withInit(function (instance) {
              instance.extraField = 7
            })
          ).to.equal(NewConstructor)
        })
      })

      describe('instances', function () {
        it('should be an empty list if there are no instances', function () {
          expect(NewConstructor.instances).to.deep.equal([])
        })

        it('should be a list of instances with null for non-constructor calls', function () {
          const instance1 = new NewConstructor()
          NewConstructor()
          const instance2 = new NewConstructor()

          expect(NewConstructor.instances).to.deep.equal([instance1, null, instance2])
        })
      })

      describe('getInstance', function () {
        it('should return a single instance if one has been created', function () {
          const instance = new NewConstructor()

          expect(NewConstructor.getInstance()).to.equal(instance)
        })

        it('should throw an error if no instance has been created', function () {
          expect(NewConstructor.getInstance).to.throw(/0 instances/)
        })

        it('should throw an error if more than one instance has been created', function () {
          new NewConstructor()
          new NewConstructor()

          expect(NewConstructor.getInstance).to.throw(/2 instances/)
        })

        it('should return an instance with a given index', function () {
          new NewConstructor()
          const instance2 = new NewConstructor()

          expect(NewConstructor.getInstance(1)).to.equal(instance2)
        })

        it('should throw an error if not enough instances exist', function () {
          new NewConstructor()

          expect(function () {
            NewConstructor.getInstance(1)
          }).to.throw(/1 instances/)
        })
      })

      describe('args', function () {
        it('should be an empty list if there are no instances', function () {
          expect(NewConstructor.args).to.deep.equal([])
        })

        it('should be a list of constructor arguments', function () {
          new NewConstructor('foo', 'bar')
          NewConstructor('pi', 'biz')
          new NewConstructor('baz', 'bla')

          expect(NewConstructor.args).to.deep.equal([
            ['foo', 'bar'],
            ['pi', 'biz'],
            ['baz', 'bla']
          ])
        })
      })
    })
  })
})

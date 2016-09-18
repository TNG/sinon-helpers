var sinonHelpers = require('../index')
var getStubConstructor = sinonHelpers.getStubConstructor
var returning = sinonHelpers.returning
var returningThis = sinonHelpers.returningThis

var expect = require('chai').expect
var sinon = require('sinon')

beforeEach(function () {
  global.sinon = sinon
})

afterEach(function () {
  delete global.sinon
})

describe('getStubConstructor', function () {
  var TestConstructor, StubConstructor

  beforeEach(function () {
    var testPrototype2 = {
      proto2: function () { return 'p2' }
    }
    var testPrototype1 = Object.create(testPrototype2, {
      proto1: { enumerable: false, value: function () { return 'p1' } }
    })
    var testPrototype = Object.create(testPrototype1, {
      field1: { enumerable: true, value: function () { return 1 } },
      field2: { enumerable: false, value: function () { return 2 } }
    })
    TestConstructor = function () {
      this.field3 = function () { return 3 }
    }
    TestConstructor.prototype = testPrototype
    StubConstructor = getStubConstructor(TestConstructor)
  })

  it('should return a constructor that creates an object with all methods of the prototype object', function () {
    var stubbedObject = new StubConstructor()

    expect(stubbedObject.field1).to.be.a('function', 'field1')
    expect(stubbedObject.field2).to.be.a('function', 'field2')
    expect(stubbedObject.proto1).to.be.a('function', 'proto1')
    expect(stubbedObject.proto2).to.be.a('function', 'proto2')
  })

  it('should not call through to the original constructor', function () {
    var stubbedObject = new StubConstructor()

    expect(stubbedObject.field3).to.be.undefined
  })

  describe('withMethods', function () {
    it('should allow specifying additional methods', function () {
      StubConstructor = StubConstructor.withMethods('m1', 'm2')
      var stubbedObject = new StubConstructor()

      expect(stubbedObject.m1).to.be.a('function', 'm1')
      expect(stubbedObject.m2).to.be.a('function', 'm2')
    })

    it('should allow specifying method return values', function () {
      StubConstructor = StubConstructor.withMethods('m1', returning(1), 'field1', returning(2), 'm2')
      var stubbedObject = new StubConstructor()

      expect(stubbedObject.m1()).to.equal(1, 'm1')
      expect(stubbedObject.field1()).to.equal(2, 'field1')
      expect(stubbedObject.m2()).to.be.undefined
    })

    it('should allow for methods to return their this value', function () {
      StubConstructor = StubConstructor.withMethods('m1', returningThis, 'field1', returningThis, 'm2')
      var stubbedObject = new StubConstructor()

      expect(stubbedObject.m1().field1().m2).to.be.a('function')
    })
  })

  describe('getInstances', function () {
    it('should return an empty list if there are no instances', function () {
      expect(StubConstructor.getInstances()).to.deep.equal([])
    })

    it('should return a list of instances', function () {
      var instance1 = new StubConstructor()
      var instance2 = new StubConstructor()

      expect(StubConstructor.getInstances()).to.deep.equal([ instance1, instance2 ])
    })
  })

  describe('getInstance', function () {
    it('should return a single instance if one has been created', function () {
      var instance = new StubConstructor()

      expect(StubConstructor.getInstance()).to.equal(instance)
    })

    it('should throw an error if no instance has been created', function () {
      expect(StubConstructor.getInstance).to.throw(/0 instances/)
    })

    it('should throw an error if more than one instance has been created', function () {
      new StubConstructor()
      new StubConstructor()

      expect(StubConstructor.getInstance).to.throw(/2 instances/)
    })

    it('should return an instance with a given index', function () {
      new StubConstructor()
      var instance2 = new StubConstructor()

      expect(StubConstructor.getInstance(1)).to.equal(instance2)
    })

    it('should throw an error if not enough instances exist', function () {
      new StubConstructor()

      expect(function () { StubConstructor.getInstance(1) }).to.throw(/1 instances/)
    })
  })

  describe('getInstancesArgs', function () {
    it('should return an empty list if there are no instances', function () {
      expect(StubConstructor.getInstancesArgs()).to.deep.equal([])
    })

    it('should return a list of constructor arguments', function () {
      new StubConstructor('foo', 'bar')
      new StubConstructor('baz', 'bla')

      expect(StubConstructor.getInstancesArgs()).to.deep.equal([ [ 'foo', 'bar' ], [ 'baz', 'bla' ] ])
    })
  })

  describe('getInstanceArgs', function () {
    it('should return the arguments of a single instance if one has been created', function () {
      new StubConstructor('foo', 'bar')
      expect(StubConstructor.getInstanceArgs()).to.deep.equal([ 'foo', 'bar' ])
    })

    it('should throw an error if no instance has been created', function () {
      expect(StubConstructor.getInstanceArgs).to.throw(/0 instances/)
    })

    it('should throw an error if more than one instance has been created', function () {
      new StubConstructor('foo', 'bar')
      new StubConstructor('baz', 'bla')

      expect(StubConstructor.getInstanceArgs).to.throw(/2 instances/)
    })

    it('should return the arguments of an instance with a given index', function () {
      new StubConstructor('foo', 'bar')
      new StubConstructor('baz', 'bla')

      expect(StubConstructor.getInstanceArgs(1)).to.deep.equal([ 'baz', 'bla' ])
    })

    it('should throw an error if not enough instances exist', function () {
      new StubConstructor('foo', 'bar')

      expect(function () { StubConstructor.getInstanceArgs(1) }).to.throw(/1 instances/)
    })
  })
})

const getArrayFromArrayLikeObject = (args) => Array.prototype.slice.call(args);

const isMethod = (object) => (propName) =>
  !Object.getOwnPropertyDescriptor(object, propName).get &&
  typeof object[propName] === "function" &&
  !(propName === "constructor");

const applyToEachFunctionKeyInObject = (appliedFunction, object) =>
  Object.getOwnPropertyNames(object).filter(isMethod(object)).forEach(appliedFunction);

const applyToEachFunctionKeyInPrototypeChain = (appliedFunction, object) => {
  if (object) {
    applyToEachFunctionKeyInObject(appliedFunction, object);
    applyToEachFunctionKeyInPrototypeChain(appliedFunction, Object.getPrototypeOf(object));
  }
};

const getInstanceIndexWithValidation = (index, numInstances) => {
  const instanceIndex = index || 0;

  if (typeof index === "undefined") {
    if (numInstances > 1) {
      throw new Error(
        "Tried to access only instance of StubConstructor, " +
          `but there were ${numInstances} instances.`,
      );
    }
  }
  if (numInstances <= instanceIndex) {
    throw new Error(
      `Tried to access StubConstructor instance ${instanceIndex}, ` +
        `but there were only ${numInstances} instances.`,
    );
  }
  return instanceIndex;
};

export default /* tree-shaking no-side-effects-when-called */ (getConstructorProperties) =>
  (Target) => {
    const constructorProps = getConstructorProperties(Target);
    let init;

    function StubOrSpyConstructor() {
      constructorProps.SourceConstructor.apply(this, arguments);
      StubOrSpyConstructor.args.push(getArrayFromArrayLikeObject(arguments));
      if (this instanceof StubOrSpyConstructor) {
        StubOrSpyConstructor.instances.push(this);

        Target &&
          applyToEachFunctionKeyInPrototypeChain(
            constructorProps.processMethodOfInstance(this),
            constructorProps.getInstanceMethodNameSource(this),
          );
        init && init(this);
      } else {
        StubOrSpyConstructor.instances.push(null);
      }
    }

    StubOrSpyConstructor.prototype = constructorProps.SourceConstructor.prototype;

    StubOrSpyConstructor.withInit = function (onInit) {
      init = onInit;
      return this;
    };

    StubOrSpyConstructor.instances = [];

    StubOrSpyConstructor.getInstance = (index) => {
      const validatedIndex = getInstanceIndexWithValidation(
        index,
        StubOrSpyConstructor.instances.length,
      );
      return StubOrSpyConstructor.instances[validatedIndex];
    };

    StubOrSpyConstructor.args = [];

    Target &&
      applyToEachFunctionKeyInObject(
        constructorProps.processMethodOfConstructor(StubOrSpyConstructor),
        Target,
      );
    return StubOrSpyConstructor;
  };

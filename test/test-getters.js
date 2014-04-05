var mocha = require('mocha'),
    expect = require('chai').expect;


function Foo() {

}

Object.defineProperty(Foo.prototype, 'baz', {get: function () {
  return 'val';
}});

describe('Foo', function () {
  var foo;
  beforeEach(function () {
    foo = new Foo();
  });

  it('has a baz property', function () {
    expect(foo).to.have.property('baz');
  });
});
var wire = require('wire');

describe('wire', function () {
  it('can define primitive components', function () {
    var resolved = wire({
      aComponentName: 'This is a component that is just a string'
    });
    console.log(resolved);
  });

});


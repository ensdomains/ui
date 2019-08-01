const packageJson = require('./package.json');

test('test @ethvault/iframe-provider is still 0.1.9', () => {
  expect(
    packageJson.dependencies['@ethvault/iframe-provider']
  ).toBe('0.1.9');
});
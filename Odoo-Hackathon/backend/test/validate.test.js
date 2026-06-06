const test = require('node:test');
const assert = require('node:assert/strict');
const { validate } = require('../middleware/validate');

test('validate accepts nested array payloads when fields are valid', () => {
  const middleware = validate({
    items: {
      required: true,
      type: 'array',
      minItems: 1,
      items: {
        rfq_item_id: { required: true, type: 'uuid' },
        unit_price: { required: true, type: 'number', min: 0.01 },
      },
    },
  });

  let nextCalled = false;
  middleware({
    body: {
      items: [{
        rfq_item_id: '550e8400-e29b-41d4-a716-446655440000',
        unit_price: 10,
      }],
    },
  }, {}, () => { nextCalled = true; });

  assert.equal(nextCalled, true);
});

test('validate rejects bad nested array payloads', () => {
  const middleware = validate({
    items: {
      required: true,
      type: 'array',
      minItems: 1,
      items: {
        rfq_item_id: { required: true, type: 'uuid' },
        quantity: { required: true, type: 'number', min: 1 },
      },
    },
  });

  assert.throws(() => {
    middleware({
      body: {
        items: [{ rfq_item_id: 'not-a-uuid', quantity: 0 }],
      },
    }, {}, () => {});
  }, /items\[0\]\.rfq_item_id must be a valid UUID/);
});

import { parseToursData } from './tours-data.util';

describe('parseToursData', () => {
  it('parses JSON arrays with a UTF-8 BOM', () => {
    expect(parseToursData('\uFEFF[{"id":1}]')).toEqual([{ id: 1 }]);
  });

  it('returns an empty array for blank file content', () => {
    expect(parseToursData('   \n\t')).toEqual([]);
  });

  it('throws when the file does not contain a JSON array', () => {
    expect(() => parseToursData('{"id":1}')).toThrow(SyntaxError);
  });
});

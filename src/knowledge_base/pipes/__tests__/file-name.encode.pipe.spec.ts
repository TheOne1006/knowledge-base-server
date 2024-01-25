import { FileNameEncodePipe } from '../file-name.encode.pipe';

describe('FileNameEncodePipe', () => {
  let pipe: FileNameEncodePipe;

  beforeEach(() => {
    pipe = new FileNameEncodePipe();
  });

  it('should handle single file', () => {
    const mockFile = {
      originalname: '测试.txt',
    } as any;

    const actual = pipe.transform(mockFile) as any;

    const expected = '测试.txt';

    expect(actual.originalname).toEqual(expected);
  });

  it('should handle array of files', () => {
    const mockFiles = [
      {
        originalname: 'abc测试.txt',
      },
      {
        originalname: 'skip.txt',
      },
    ] as any[];

    const actual = pipe.transform(mockFiles) as any[];

    const expected = ['abc测试.txt', 'skip.txt'];

    expect(actual.map((item) => item.originalname)).toEqual(expected);
  });
});

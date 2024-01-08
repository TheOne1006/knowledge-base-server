import { urlAppendSuffix } from '../append-suffix';

describe('urlAppendSuffix', () => {
  it('should append suffix if url path does not contain .', () => {
    const url = 'http://example.com/path';
    const result = urlAppendSuffix(url);
    expect(result.toString()).toEqual('http://example.com/path.html');
  });

  it('should not append suffix if url path already contains .', () => {
    const url = 'http://example.com/path.jpg';
    const result = urlAppendSuffix(url);
    expect(result.toString()).toEqual('http://example.com/path.jpg');
  });

  it('should remove trailing slash before appending suffix', () => {
    const url = 'http://example.com/path/';
    const result = urlAppendSuffix(url);
    expect(result.toString()).toEqual('http://example.com/path.html');
  });

  it('should append custom suffix if provided', () => {
    const url = 'http://example.com/path';
    const result = urlAppendSuffix(url, '.xml');
    expect(result.toString()).toEqual('http://example.com/path.xml');
  });
});

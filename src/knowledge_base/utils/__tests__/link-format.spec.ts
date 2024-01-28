import {
  urlAppendSuffix,
  urlRemoveHash,
  toAbsoluteURL,
  isValidUrl,
} from '../link-format';

describe('link-format', () => {
  describe('urlAppendSuffix', () => {
    const table = [
      {
        url: 'http://example.com',
        suffix: null,
        expected: 'http://example.com/index.html',
      },
      {
        url: 'http://example.com/123',
        suffix: '.xml',
        expected: 'http://example.com/123.xml',
      },
      {
        url: 'http://example.com/123',
        suffix: undefined,
        expected: 'http://example.com/123.html',
      },
      {
        url: new URL('http://example.com/123'),
        suffix: undefined,
        expected: 'http://example.com/123.html',
      },
    ];

    it.each(table)(
      'should append suffix to the url',
      ({ url, suffix, expected }) => {
        const result = urlAppendSuffix(url, suffix);
        expect(result.toString()).toEqual(expected);
      },
    );
  });

  describe('isValidUrl', () => {
    it('should return true for valid urls', () => {
      const validUrls = [
        'http://example.com',
        'https://example.com',
        'http://www.example.com',
        'https://www.example.com',
        'http://example.com/path',
        'https://example.com/path',
        'http://example.com/path?query=param',
        'https://example.com/path?query=param',
        'http://example.com/path?query=param#hash',
        'https://example.com/path?query=param#hash',
      ];

      validUrls.forEach((url) => {
        const result = isValidUrl(url);
        expect(result).toBe(true);
      });
    });

    describe('should return false for invalid urls', () => {
      const invalidUrls = [
        'example',
        'http//example.com',
        'https//example.com',
        'http://',
        'https://',
        'http:///',
        'https:///',
        'http://#hash',
        'https://#hash',
      ];

      describe.each(invalidUrls)(
        'should return false for invalid urls',
        (url) => {
          it(`${url} is invalid urls`, () => {
            const result = isValidUrl(url);

            expect(result).toBe(false);
          });
        },
      );
    });
  });

  describe('urlRemoveHash', () => {
    it('should remove hash from the url', () => {
      const url = 'http://example.com#hash';
      const result = urlRemoveHash(url);
      expect(result.toString()).toEqual('http://example.com/');
    });

    it('should remove hash from the URL object', () => {
      const url = new URL('http://example.com#hash');
      const result = urlRemoveHash(url);
      expect(result.toString()).toEqual('http://example.com/');
    });
  });

  describe('toAbsoluteURL', () => {
    it('should convert relative url to absolute url', () => {
      const base = 'http://example.com';
      const relative = '/path';
      const result = toAbsoluteURL(base, relative);
      expect(result.toString()).toEqual('http://example.com/path');
    });

    it('should convert relative url to absolute url', () => {
      const base = 'http://example.com';
      const relative = '/path?p=1#123';
      const result = toAbsoluteURL(base, relative);
      expect(result).toEqual('http://example.com/path?p=1#123');
    });

    it('should absolute url to throw error', () => {
      const base = 'xxxssd\\example.com';
      const relative = '/path?p=1#123';

      // let err: any;
      let hasError = false;
      try {
        toAbsoluteURL(base, relative);
      } catch (error) {
        hasError = true;
        // err = error;
      }
      expect(hasError).toBeTruthy();
    });
  });
});

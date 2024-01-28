import * as path from 'path';
import { CustomPlaywrightWebBaseLoader } from '../CustomPlaywrightWebBaseLoader';

describe('CustomPlaywrightWebBaseLoader', () => {
  // let loader: CustomPlaywrightWebBaseLoader;

  describe('with evaluate throw Error', () => {
    const url = path.join(__dirname, 'mock_files', 'mock_html.html');
    // beforeEach(() => {
    //   loader = new CustomPlaywrightWebBaseLoader(url);
    // });

    it('should handle _scrape method', async () => {
      const mockOptions = {
        evaluate: () => {
          throw new Error('evaluate throw');
        },
      };

      await expect(
        CustomPlaywrightWebBaseLoader._scrape(`file://${url}`, mockOptions),
      ).rejects.toThrow('evaluate throw');
    });
  });
});

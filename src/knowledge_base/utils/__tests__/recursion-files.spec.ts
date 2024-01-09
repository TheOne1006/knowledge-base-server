import * as path from 'path';
import {
  getAllFilesAndDirectoriesRecursively,
  flatFileAndDirRecursively,
} from '../recursion-files';
import { FileStatDto } from '../dtos';

describe('recursion-files', () => {
  it('should get all files and directories recursively', async () => {
    const dirPath = path.join(__dirname, 'mock_dir');
    const ignorePathPrefix = __dirname;

    const result = await getAllFilesAndDirectoriesRecursively(
      dirPath,
      ignorePathPrefix,
    );
    const expected = [
      { name: 'mock1.txt', path: '/mock_dir/mock1.txt', isDir: false },
      {
        name: 'mock_dir2',
        path: '/mock_dir/mock_dir2',
        isDir: true,
        children: [
          {
            name: 'mock2.txt',
            path: '/mock_dir/mock_dir2/mock2.txt',
            isDir: false,
          },
          {
            name: 'mock_dir3',
            path: '/mock_dir/mock_dir2/mock_dir3',
            isDir: true,
            children: [
              {
                name: 'mock3.txt',
                path: '/mock_dir/mock_dir2/mock_dir3/mock3.txt',
                isDir: false,
              },
            ],
          },
        ],
      },
      {
        name: 'mock_dir22',
        path: '/mock_dir/mock_dir22',
        isDir: true,
        children: [
          {
            name: 'mock_dir22.txt',
            path: '/mock_dir/mock_dir22/mock_dir22.txt',
            isDir: false,
          },
        ],
      },
    ];

    expect(result).toEqual(expected);
  });

  it('should flatten FileStatDto array', () => {
    const files: FileStatDto[] = [
      {
        name: 'mock_dir2',
        path: '/mock_dir/mock_dir2',
        isDir: true,
        children: [
          {
            name: 'mock2.txt',
            path: '/mock_dir/mock_dir2/mock2.txt',
            isDir: false,
          },
          {
            name: 'mock_dir3',
            path: '/mock_dir/mock_dir2/mock_dir3',
            isDir: true,
            children: [
              {
                name: 'mock3.txt',
                path: '/mock_dir/mock_dir2/mock_dir3/mock3.txt',
                isDir: false,
              },
            ],
          },
        ],
      },
    ];

    const actual = flatFileAndDirRecursively(files);

    const expected = [
      {
        name: 'mock2.txt',
        path: '/mock_dir/mock_dir2/mock2.txt',
        isDir: false,
      },
      {
        name: 'mock3.txt',
        path: '/mock_dir/mock_dir2/mock_dir3/mock3.txt',
        isDir: false,
      },
    ];

    expect(actual).toEqual(expected);
  });
});

// istanbul ignore file
import {
  BlockType,
  DocBlock,
  TEXT_MARK,
  TextElement,
  TextElementStyle,
  TextElementStyleKey,
} from './types';

/**
 * 根据 block_type 获取对应的数据
 * @param block
 * @returns
 */
export const getBlockData = (block: DocBlock) => {
  const key = BlockType[`${block.block_type}`].toLowerCase();
  return block[key];
};

export const getDocumentTokenFromUrl = (url: string) => {
  const match = /\/docx\/([^?]+)/.exec(url);
  if (match && match[1]) {
    return match[1];
  } else {
    throw new Error('invalid url');
  }
};

export const isInlineCodeElement = (element: TextElement) => {
  return element?.text_run?.text_element_style.inline_code;
};

export const isLinkElement = (element: TextElement) => {
  return !!element?.text_run?.text_element_style.link;
};

export const isEquationElement = (element: TextElement) => {
  return !!element?.equation;
};

export const findSequenceElements = (
  startIndex: number,
  fn: (element: TextElement) => boolean,
  elements: TextElement[],
) => {
  const targets = [];
  for (let i = startIndex; i < elements.length; i++) {
    const isSameElement = fn(elements[i]);
    if (isSameElement) {
      targets.push(elements[i]);
    } else {
      break;
    }
  }
  return targets;
};

export const computeMarkdownTagText = (
  tagStatus: TextElementStyle,
  cur?: TextElementStyle,
) => {
  let openingTags = '';
  let closingTags = '';
  const keys = Object.keys(tagStatus) as TextElementStyleKey[];

  keys.forEach((key) => {
    if (key === 'link') {
      // link比较特别，单独处理
      return;
    }
    if (!cur) {
      // all close
      if (tagStatus[key]) {
        closingTags += TEXT_MARK[key][1];
        tagStatus[key] = false;
      }
      return;
    }
    const oldVal = tagStatus[key];
    const newVal = cur[key];
    if (oldVal === newVal) {
      return;
    }
    if (newVal) {
      // opening tag
      openingTags += TEXT_MARK[key][0];
    } else {
      // closing tag
      closingTags += TEXT_MARK[key][1];
    }
    tagStatus[key] = newVal;
  });
  return closingTags + openingTags;
};

/** 用于删除文件名中的非法字符的函数 */
export const sanitizeFilename = (filename: string) => {
  return filename.replace(/[\\/:"*?<>|]/g, '_');
};

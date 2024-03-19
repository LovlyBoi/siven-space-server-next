import { marked } from 'marked';
import {
  gfmHeadingId,
  getHeadingList,
  type HeadingData,
} from 'marked-gfm-heading-id';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import createDOMPurify = require('dompurify');
import jsDom = require('jsdom');
import type { ParsedHtml } from '../types';

// 暂时保存outline
const _outline: HeadingData[] = [];

// 添加header-id
marked.use(gfmHeadingId(), {
  hooks: {
    postprocess(html) {
      _outline.push(...getHeadingList());
      return html;
    },
  },
});

// 使用highlightjs
marked.use(
  markedHighlight({
    highlight(code, lang) {
      const language = fixLanguage(lang);
      console.log(language);
      return hljs.highlight(code, { language, ignoreIllegals: true }).value;
    },
  }),
);

export async function parseMarkDown(
  markdownString: string | Buffer,
): Promise<ParsedHtml> {
  markdownString =
    typeof markdownString === 'string'
      ? markdownString
      : markdownString.toString();

  const dirtyHtml = await marked.parse(markdownString, {
    async: true,
  });

  const window = new jsDom.JSDOM('').window;
  const DOMPurify = createDOMPurify(window);

  const html = DOMPurify.sanitize(dirtyHtml);

  const outline = _outline.map(({ text, id, level }) => ({
    text: DOMPurify.sanitize(text),
    id,
    level,
  }));
  _outline.length = 0;

  return {
    html,
    outline,
  };
}

const hljsLang = new Set([...hljs.listLanguages(), 'html']);

function fixLanguage(lang: string) {
  lang = lang.trim().toLowerCase();
  switch (lang) {
    case 'vue':
      return 'html';
    case 'js':
    case 'jsx':
    case 'react':
    case 'react-jsx':
      return 'javascript';
    case 'ts':
    case 'tsx':
    case 'react-tsx':
      return 'typescript';
    default:
      return hljsLang.has(lang) ? lang : 'text';
  }
}

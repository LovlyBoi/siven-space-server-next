import { marked } from 'marked';
import {
  gfmHeadingId,
  getHeadingList,
  type HeadingData,
} from 'marked-gfm-heading-id';
import jsDom = require('jsdom');
import createDOMPurify = require('dompurify');
import type { ParsedHtml } from '../types';

// 暂时保存outline
const _outline: HeadingData[] = [];
// 所有支持的语言，参考 https://shiki-zh-docs.vercel.app/languages
let supportedLang = new Set<string>();

// 添加header-id
marked.use(gfmHeadingId(), {
  hooks: {
    postprocess(html) {
      _outline.push(...getHeadingList());
      return html;
    },
  },
});

// shiki仅支持ESM，CJS不支持同步加载ESM
// 而TS会自动编译import到require，所以还需要eval骗一下TS
const loaded = Promise.all([
  eval(`import('shiki')`) as Promise<typeof import('shiki')>,
  eval(`import('marked-shiki')`) as Promise<typeof import('marked-shiki')>,
  eval(`import('@shikijs/transformers')`) as Promise<
    typeof import('@shikijs/transformers')
  >,
]).then(
  async ([
    { getHighlighter, bundledLanguages },
    { default: markedShiki },
    {
      transformerNotationDiff,
      transformerNotationHighlight,
      transformerNotationWordHighlight,
      transformerNotationFocus,
      transformerNotationErrorLevel,
      transformerMetaHighlight,
      transformerMetaWordHighlight,
    },
  ]) => {
    supportedLang = new Set(Object.keys(bundledLanguages));

    const highlighter = await getHighlighter({
      // 加载所有语言
      langs: [...supportedLang],
      themes: ['min-light', 'nord', 'min-dark'],
    });

    // 记录每次的code有多少行代码
    let lineCounter = 0;

    marked.use(
      markedShiki({
        async highlight(code, lang, props) {
          const language = fixLanguage(lang);
          lineCounter = 0;
          const html = highlighter.codeToHtml(code, {
            lang: language,
            themes: {
              light: 'min-light',
              dark: 'nord',
            },
            meta: { __raw: props.join(' ') }, // required by `transformerMeta*`
            transformers: [
              {
                line(node, line) {
                  node.properties['data-line'] = line;
                  lineCounter = Math.max(lineCounter, line);
                },
              },
              transformerNotationDiff(),
              transformerNotationHighlight(),
              transformerNotationWordHighlight(),
              transformerNotationFocus(),
              transformerNotationErrorLevel(),
              transformerMetaHighlight(),
              transformerMetaWordHighlight(),
            ],
          });

          return `<pre class="shiki-code-block" data-lang="${language}">
  <div class="shiki-code-lines">${Array(lineCounter)
    .fill(0)
    .map((_, index) => `<div data-line=${index + 1}></div>`)
    .join('')}</div>
  ${html}
</pre>`;
        },
      }),
    );
  },
);

export async function parseMarkDown(
  markdownString: string | Buffer,
): Promise<ParsedHtml> {
  await loaded;

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

// 调用时须确保shiki已经加载完成
function fixLanguage(lang: string) {
  lang = lang.trim().toLowerCase();
  switch (lang) {
    case 'vue':
      return 'vue';
    case 'js':
      return 'javascript';
    case 'jsx':
    case 'react':
    case 'react-jsx':
      return 'jsx';
    case 'ts':
      return 'typescript';
    case 'react-tsx':
      return 'tsx';
    default:
      return supportedLang.has(lang) ? lang : 'text';
  }
}

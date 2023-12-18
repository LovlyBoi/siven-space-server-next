import { marked } from 'marked';
import { gfmHeadingId, getHeadingList } from 'marked-gfm-heading-id';
import { markedHighlight } from 'marked-highlight';
import hljs from 'highlight.js';
import type { ParsedHtml } from '../entities/markdown.entity';

// 暂时保存outline
const _outline = [];

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

  const html = await marked.parse(markdownString, {
    async: true,
  });

  const outline = [..._outline];
  _outline.length = 0;

  return {
    html,
    outline,
  };
}

const hljsLang = new Set([
  'bash',
  'sh',
  'zsh',
  'c',
  'cpp',
  'c++',
  'hpp',
  'cc',
  'h++',
  'cxx',
  'css',
  'curl',
  'dart',
  'diff',
  'patch',
  'django',
  'jinja',
  'dockerfile',
  'docker',
  'bat',
  'dos',
  'cmd',
  'dust',
  'dst',
  'excel',
  'xls',
  'xlsx',
  'go',
  'golang',
  'groovy',
  'xml',
  'html',
  'xhtml',
  'rss',
  'atom',
  'xjb',
  'xsd',
  'xsl',
  'plist',
  'svg',
  'http',
  'https',
  'haskell',
  'hs',
  'json',
  'java',
  'jsp',
  'javascript',
  'js',
  'jsx',
  'kotlin',
  'kt',
  'less',
  'lisp',
  'lua',
  'markdown',
  'md',
  'mkdown',
  'mkd',
  'matlab',
  'nginx',
  'nginxconf',
  'php',
  'plaintext',
  'txt',
  'text',
  'objectivec',
  'mm',
  'objc',
  'obj-c',
  'obj-c++',
  'objective-c++',
  'shell',
  'console',
  'stylus',
  'styl',
  'svelte',
  'swift',
  'typescript',
  'ts',
  'vbnet',
  'vb',
  'vim',
  'yml',
  'yaml',
]);

function fixLanguage(lang: string) {
  lang = lang.trim().toLowerCase();
  switch (lang) {
    case 'vue':
      return 'html';
    case 'react':
    case 'react-jsx':
      return 'jsx';
    case 'tsx':
    case 'react-tsx':
      return 'ts';
    default:
      return hljsLang.has(lang) ? lang : 'text';
  }
}

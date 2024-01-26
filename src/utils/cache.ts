import { existsSync, mkdirSync, createReadStream, createWriteStream } from 'fs';
import { readFile, writeFile, unlink } from 'fs/promises';
import { resolve, isAbsolute } from 'path';
import { parseMarkDown } from 'src/blogs/utils/markdown';
import type { Outline, ParsedHtml } from 'src/blogs/types';
import { Readable } from 'node:stream';

export const useCacheLocation = (path?: string) =>
  path
    ? resolve(process.env.CACHE_DIR || '', path)
    : process.env.CACHE_DIR || '';

export let cacheRootPath: string,
  cacheImagePath: string,
  cacheMarkdownPath: string,
  cacheHtmlPath: string,
  cahceOutlinePath: string;

// 初始化缓存目录
export function cacheInit(cacheDir?: string): string {
  cacheDir = cacheDir || process.env.CACHE_DIR || '../';
  process.env.CACHE_DIR = cacheDir = isAbsolute(cacheDir)
    ? cacheDir
    : resolve(process.cwd(), cacheDir);

  // 如果目录不存在，创建对应目录
  for (const subDir of ['html', 'markdown', 'outline', 'image']) {
    mkdirSync(resolve(cacheDir, subDir), { recursive: true });
  }

  cacheRootPath = useCacheLocation();
  cacheImagePath = useCacheLocation('./image');
  cacheMarkdownPath = useCacheLocation('./markdown');
  cacheHtmlPath = useCacheLocation('./html');
  cahceOutlinePath = useCacheLocation('./outline');

  return cacheDir;
}

// 存储Markdown
export async function writeMarkdown(id: string, md: Express.Multer.File) {
  return writeFile(resolve(cacheMarkdownPath, id), md.buffer);
}

// 获取解析后的HTML
export async function getHtmlById(id: string): Promise<ParsedHtml> {
  // 之前解析过了，走缓存
  const cachedParsed = await getParsedFromCache(id);
  if (cachedParsed != null) return cachedParsed;

  // 没解析过
  const mdBuffer = await readFile(resolve(cacheMarkdownPath, id));
  const parsed = await parseMarkDown(mdBuffer);

  // 尝试缓存结果，不阻塞正常返回
  cacheHtml(id, parsed.html);
  cacheOutline(id, parsed.outline);
  return parsed;
}

// 移除Markdown
export async function removeMarkdown(id: string) {
  let success = true;
  // 删除 markdown
  try {
    await unlink(resolve(cacheMarkdownPath, id));
  } catch (e) {
    success = false;
  }
  return success;
}

// 判断图片是否存在
export function isImageExist(filename: string) {
  return existsSync(resolve(cacheImagePath, filename));
}

// 存储Image
export function cacheImage(filename: string, image: string | Buffer) {
  return writeFile(resolve(cacheImagePath, filename), image);
}

// 存储Image（流）
export function cacheImageStream(filename: string, stream: Readable) {
  // return writeFileStream(resolve(cacheImagePath, filename), stream);
  const writeStream = createWriteStream(resolve(cacheImagePath, filename));
  stream.pipe(writeStream);
}

// 返回Image读流
export function getImageStream(filename: string) {
  return createReadStream(resolve(cacheImagePath, filename));
}

// 移除Image缓存
export async function removeImageCahce(filename: string) {
  let success = true;
  try {
    await unlink(resolve(cacheImagePath, filename));
  } catch (e) {
    success = false;
  }
  return success;
}

// 判断markdown文件是否存在
export function isMarkDownExist(id: string) {
  return existsSync(resolve(cacheMarkdownPath, id));
}

// 返回markdown原文（供编辑文件消费）
export function getMarkdown(id: string) {
  const exist = isMarkDownExist(id);
  return exist ? createReadStream(resolve(cacheMarkdownPath, id)) : null;
}

// 修改mardown原文（供编辑文件消费）
export async function editMarkdown(id: string, content: string | Buffer) {
  const exist = isMarkDownExist(id);
  const filePath = resolve(cacheMarkdownPath, id);
  if (!exist) return false;
  return writeFile(filePath, content);
}

// 移除markdown对应的缓存文件（html、outline）
export function removeCache(id: string) {
  existsSync(resolve(cacheHtmlPath, id)) && unlink(resolve(cacheHtmlPath, id));
  existsSync(resolve(cahceOutlinePath, id)) &&
    unlink(resolve(cahceOutlinePath, id));
}

// 缓存html
async function cacheHtml(id: string, html: string | Buffer) {
  try {
    await writeFile(resolve(cacheHtmlPath, id), html);
  } catch (e) {
    console.error(e);
    throw new Error(`缓存 HTML(${id})失败`);
  }
}

// 缓存outline
async function cacheOutline(id: string, outline: Outline) {
  try {
    await writeFile(resolve(cahceOutlinePath, id), JSON.stringify(outline));
  } catch (e) {
    console.error(e);
    throw new Error(`缓存文章大纲(${id})失败`);
  }
}

// 从缓存里读取
async function getParsedFromCache(id: string): Promise<ParsedHtml | null> {
  let html: string | Buffer, outline: Outline;
  // 缓存目录里没有
  if (
    !existsSync(resolve(cacheHtmlPath, id)) ||
    !existsSync(resolve(cahceOutlinePath, id))
  ) {
    return null;
  }
  // 从缓存里读
  try {
    html = await readFile(resolve(cacheHtmlPath, id));
    html = html.toString();
  } catch (e) {
    console.error(`读取HTML(${id})缓存失败: `, e);
    return null;
  }
  try {
    outline = JSON.parse(
      (await readFile(resolve(cahceOutlinePath, id))).toString(),
    );
  } catch (e) {
    console.error(`读取文章大纲(${id})缓存失败: `, e);
    return null;
  }
  return {
    html,
    outline,
  };
}

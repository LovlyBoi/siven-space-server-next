import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { nanoid } from 'nanoid';
import { extname } from 'node:path';
import {
  cacheImage,
  cacheImageStream,
  getImageStream,
  isImageExist as isImageExistUtil,
  extension,
  loopup,
} from 'src/utils';
import sharp = require('sharp');
import { type FormatEnum } from 'sharp';
import { Readable } from 'node:stream';

@Injectable()
export class ImageService {
  // 存储图片
  async storeImage(image: Express.Multer.File, webp: boolean) {
    const id = nanoid();

    if (webp) {
      // 转换为webp格式并存储
      const filename = `${id}.webp`;
      // Sharp 类实现了流接口，可以直接pipe进写流里面去，比较快
      cacheImageStream(filename, sharp(image.buffer).webp());
      return filename;
    }

    const ext = extension(image.mimetype);
    const filename = `${id}.${ext}`;
    await cacheImage(filename, image.buffer);
    return filename;
  }

  // 图片是否存在
  isImageExist(filename: string) {
    return isImageExistUtil(filename);
  }

  // 获取图片
  getImage(
    filename: string,
    width?: number,
    height?: number,
    quality?: number,
  ) {
    const ext = extname(filename).slice(1) as keyof FormatEnum;
    const mime = loopup(ext);
    if (!mime)
      throw new HttpException('Unsupported file type.', HttpStatus.BAD_REQUEST);

    let stream = getImageStream(filename) as Readable;

    if (quality != null) {
      stream = this.compress(stream, ext, quality);
    }

    if (width != null || height != null) {
      stream = this.resize(stream, width, height);
    }

    return {
      stream,
      mime,
    };
  }

  resize(readStream: Readable, width?: number, height?: number) {
    if (!width && !height) return readStream;
    // 保留纵横比，将图片大小调整为尽可能大，同时确保其尺寸小于或等于指定的尺寸。
    const transformer = sharp().resize(width, height, { fit: 'inside' });
    return readStream.pipe(transformer);
  }

  compress(readStream: Readable, ext: keyof FormatEnum, quality: number) {
    const transformer = sharp().toFormat(ext, { quality });
    return readStream.pipe(transformer);
  }
}

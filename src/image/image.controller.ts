import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Param,
  Put,
  Query,
  Res,
  StreamableFile,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ImageService } from './image.service';
import { AuthGuard } from 'src/auth/auth.guard';
import type { Response } from 'express';

@Controller('image')
export class ImageController {
  constructor(private readonly imageService: ImageService) {}

  @Put('/')
  @UseGuards(AuthGuard)
  @UseInterceptors(FileInterceptor('img'))
  async uploadImage(
    @UploadedFile() img: Express.Multer.File,
    @Query('webp') webp: boolean,
  ) {
    // 默认开启webp，转换为webp存储
    webp = webp == null ? true : webp;

    const filename = await this.imageService.storeImage(img, webp);
    return { filename };
  }

  @Get('/:filename')
  async getImage(
    @Res({ passthrough: true }) res: Response,
    @Param('filename') filename: string,
    @Query('w') width?: number,
    @Query('h') height?: number,
    @Query('q') quality?: number,
  ) {
    if (!this.imageService.isImageExist(filename)) {
      throw new HttpException(
        'The image does not exist.',
        HttpStatus.NOT_FOUND,
      );
    }

    width = Number.isNaN(width) ? undefined : width;
    height = Number.isNaN(height) ? undefined : height;
    quality = Number.isNaN(quality) ? undefined : quality;

    const { mime, stream } = this.imageService.getImage(
      filename,
      width,
      height,
      quality,
    );

    // 让浏览器缓存起来，不然每次都请求图片太慢了
    res.set({
      'Content-Type': mime,
      'Cache-Control': `max-age=${60 * 60 * 3}`,
    });

    return new StreamableFile(stream);
  }
}

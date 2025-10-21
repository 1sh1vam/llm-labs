import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  Query,
  ValidationPipe,
  Header,
  Res,
  Logger,
  HttpCode,
  HttpStatus,
  StreamableFile,
} from '@nestjs/common';
import type { Response } from 'express';
import { ExperimentsService } from './experiments.service';
import { CreateExperimentDto } from './dto/create-experiment.dto';

@Controller('api/experiments')
export class ExperimentsController {
  private readonly logger = new Logger(ExperimentsController.name);

  constructor(private readonly experimentsService: ExperimentsService) {}

  /**
   * Create experiment with real-time SSE streaming
   * POST with JSON body, returns SSE stream
   */
  @Post()
  async createExperiment(
    @Body(new ValidationPipe({ transform: true, whitelist: true }))
    createExperimentDto: CreateExperimentDto,
    @Res() res: Response,
  ) {
    // Set SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering

    try {
      // Process experiment with streaming callback
      await this.experimentsService.createExperiment(
        createExperimentDto,
        (event) => {
          // Stream event as SSE
          res.write(`data: ${JSON.stringify(event)}\n\n`);
        },
      );

      // End stream
      res.end();
    } catch (error) {
      this.logger.error('Stream error:', error);

      // Send error event
      res.write(
        `data: ${JSON.stringify({
          type: 'error',
          message: (error as Error).message,
        })}\n\n`,
      );
      res.end();
    }
  }

  @Get()
  async getAllExperiments(
    @Query('limit') limit?: string,
    @Query('cursor') cursor?: string,
  ) {
    const limitNum = limit ? parseInt(limit, 10) : 20;

    return this.experimentsService.getAllExperiments(limitNum, cursor);
  }

  @Get(':id/metrics')
  async getExperimentMetrics(@Param('id') id: string) {
    return this.experimentsService.getExperimentMetrics(id);
  }

  @Get(':id/export')
  @Header('Content-Type', 'application/json')
  async exportExperiment(
    @Param('id') id: string,
    @Query('format') format?: 'json' | 'csv',
  ) {
    const exportFormat = format || 'json';
    const data = await this.experimentsService.exportExperiment(
      id,
      exportFormat,
    );

    if (exportFormat === 'csv') {
      return new StreamableFile(Buffer.from(data), {
        type: 'text/csv',
        disposition: `attachment; filename="experiment-${id}.csv"`,
      });
    }

    return data;
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteExperiment(@Param('id') id: string) {
    return this.experimentsService.deleteExperiment(id);
  }
}

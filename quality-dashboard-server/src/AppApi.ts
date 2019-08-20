import * as bodyParser from 'body-parser';
import { NextFunction, Response } from 'express';
import * as express from 'express';
import * as url from 'url';
import { Config } from './Config';
import { router } from './router';
import { ExpressWrapper } from './utils-std-ts/express-wrapper';
import { Logger } from './utils-std-ts/logger';

const logger = new Logger('AppApi');

export class AppApi {
  //
  public static start(): void {
    const api = ExpressWrapper.createApi();
    const PORT = 80;

    api.listen(PORT, () => {
      logger.info(`App listening on port ${PORT}`);
    });

    api.use(`${Config.API_BASE_PATH}/reports_data`, express.static(Config.REPORT_DIR));

    api.use((req: any, res: Response, next: NextFunction) => {
      res.status(404);
      req.customApiLogging = { startDate: new Date() };
      logger.info(`${req.method} ${url.parse(req.url).pathname}`);
      next();
    });

    api.use(bodyParser.json());

    api.use(router);

    router.use((req: any, res: Response, next: NextFunction) => {
      logger.debug(
        `API Response: ${res.statusCode}; ${new Date().getTime() - req.customApiLogging.startDate.getTime()}ms`
      );
      next();
    });
  }
}

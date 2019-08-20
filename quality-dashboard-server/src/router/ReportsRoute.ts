import * as express from 'express';
import * as fse from 'fs-extra';
import * as path from 'path';
import * as targz from 'targz';
import { Config } from '../Config';
import { ReportsDB } from '../ReportsDB';
import { ExpressRouterWrapper as ERW } from '../utils-std-ts/express-router-wrapper';
import { Logger } from '../utils-std-ts/logger';

export const ReportsRoute = express.Router();
const logger = new Logger('ReportsRoute');

ERW.route(ReportsRoute, 'get', '/', async (req, res) => {
  return res.status(200).send(await ReportsDB.list());
});

ERW.route(
  ReportsRoute,
  'post',
  '/:groupName/:projectName/:projectVersion/:reportName/:processorType',
  async (req, res) => {
    const reportFolder = `${Config.REPORT_DIR}/${req.params.groupName}/${req.params.projectName}/${
      req.params.projectVersion
    }/${req.params.reportName}`;
    if (fse.existsSync(reportFolder)) {
      await fse.remove(reportFolder);
    }
    await fse.ensureDir(reportFolder);
    const reportName = (req as any).files.report.name;
    if (path.extname(reportName) === '.gz') {
      await (req as any).files.report.mv(`${reportFolder}/${reportName}`);
      await extractTo(`${reportFolder}/${(req as any).files.report.name}`, `${reportFolder}/report`);
    } else if (path.extname(reportName) === '.html') {
      await fse.ensureDir(`${reportFolder}/report`);
      await (req as any).files.report.mv(`${reportFolder}/report/report.html`);
    } else {
      throw new Error('Wrong report extension');
    }
    let processor;
    if (fse.existsSync(`${Config.PROCESSOR_DIR_USER}/${req.params.processorType}.js`)) {
      processor = require(`${Config.PROCESSOR_DIR_USER}/${req.params.processorType}.js`);
    } else if (fse.existsSync(`${Config.PROCESSOR_DIR}/${req.params.processorType}.js`)) {
      processor = require(`${Config.PROCESSOR_DIR}/${req.params.processorType}.js`);
    }
    if (processor) {
      logger.info('Processor found');
      try {
        const result = await processor.analyse(`${reportFolder}/report`);
        logger.info(result);
        ReportsDB.add(
          req.params.groupName,
          req.params.projectName,
          req.params.projectVersion,
          req.params.reportName,
          req.params.processorType,
          result
        );
      } catch (err) {
        logger.error(err);
      }
    }
    return res.status(201).send({});
  }
);

function extractTo(src: string, dest: string): Promise<void> {
  return new Promise((resolve, reject) => {
    targz.decompress(
      {
        dest,
        src
      },
      async err => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      }
    );
  });
}
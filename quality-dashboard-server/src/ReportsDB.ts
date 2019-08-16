import * as fse from 'fs-extra';
import { Config } from './Config';
import * as _ from 'lodash';

const DB_FILE_PATH = `${Config.DB_DIR}/reports.json`;
let reportsDB;

export class ReportsDB {
  static async init(): Promise<void> {
    await fse.ensureDir(Config.DB_DIR);
    if (!fse.existsSync(DB_FILE_PATH)) {
      fse.writeJSON(DB_FILE_PATH, {});
    }
    reportsDB = await fse.readJSON(DB_FILE_PATH);
    if (!reportsDB.projects) {
      reportsDB.projects = [];
    }
    fse.writeJSON(DB_FILE_PATH, reportsDB, { spaces: 2 });
  }

  static async list(): Promise<any> {
    return JSON.parse(JSON.stringify(reportsDB));
  }

  static async add(
    projectName: string,
    projectVersion: string,
    reportName: string,
    processorType: string,
    content: any
  ): Promise<void> {
    const project = arrayFindOrCreate(reportsDB.projects, { name: projectName }, { name: projectName, versions: [] });
    const version = arrayFindOrCreate(
      project.versions,
      { version: projectVersion },
      { version: projectVersion, reports: [] }
    );
    const report = arrayFindOrCreate(version.reports, { name: reportName }, { type: reportName });
    report.result = content;
    report.processor = processorType;
    report.date = new Date();
    fse.writeJSON(DB_FILE_PATH, reportsDB, { spaces: 2 });
  }
}

function arrayFindOrCreate(array: any[], query: any, defaultContent: any): any {
  let item = _.find(array, query);
  if (!item) {
    item = defaultContent;
    array.push(item);
  }
  return item;
}

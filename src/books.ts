import fetch from 'node-fetch';
import { createMeta, encryptQDInfo, encryptQDSign, IMobileMeta } from './qdsign';

const URL = 'https://druid.if.qidian.com/argus/api/v1/bookstore/getbooks';

export interface IQueryBooksOptions {
  pageIndex?: number;
  pageSize?: number;
  siteId?: 12;
  filters?: string;
  orders?: number;
}

function createHeaders(url: string, meta: IMobileMeta = {}) {
  const { ywKey, ywGuid, appId, areaId, lang, bar, appVersionName, osVersionCode, source, osUUID } = createMeta(meta);
  const agent = `Mozilla/mobile QDReaderAndroid/${appVersionName}/${osVersionCode}/${source}/${osUUID}`;
  const QDInfo = encryptQDInfo(meta);
  const Cookie = `QDInfo=${QDInfo}; ywkey=${ywKey}; ywguid=${ywGuid}; appId=${appId}; areaId=${areaId}; lang=${lang}; bar=${bar}`;
  return {
    'User-Agent': agent,
    Cookie,
    QDInfo,
    QDSign: encryptQDSign(url, meta),
  }
}

export async function getBooks(options: IQueryBooksOptions = {}) {
  const {
    pageIndex = 1,
    pageSize = 20,
    siteId = 12,
    filters = '',
    orders = 11,
  } = options;
  const url = `${URL}?pageIndex=${pageIndex}&pageSize=${pageSize}&siteId=${siteId}&filters=${filters}&order=${orders}`;
  const responses = await fetch(
    url,
    {
      headers: createHeaders(url),
    }
  );
  return responses.json();
}
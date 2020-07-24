import crypto, { HexBase64Latin1Encoding } from 'crypto';
import { Devices } from './devices';
import { generateIMEI } from './imei';

const QDSIGN_PASS = Buffer.from('7B3164596771452968392C5229684B71456376345D6B5B68', 'hex');
const QDSIGN_IV = Buffer.from('3031323334353637', 'hex');
const QDINFO_PASS = Buffer.from('0821CAAD409B84020821CAAD', 'utf8');
const QDINFO_IV = Buffer.from('0000000000000000', 'hex');

export function decryptQDSign(encodedSign: string) {
  const decipher = crypto.createDecipheriv('des-ede3-cbc', QDSIGN_PASS, QDSIGN_IV);
  return decipher.update(encodedSign.replace(/\s+/g, ''), 'base64', 'utf8') + decipher.final('utf8');
}

function normParams(url: string) {
  const index = url.indexOf('?');
  if (index === -1) {
    return '';
  }
  const queryParts = url.substring(index + 1);
  if (queryParts.length === 0) {
    return '';
  }
  const queries: string[] = [];
  const parts = queryParts.split('&');
  for (const part of parts) {
    const pos = part.indexOf('=');
    if (pos === -1) {
      queries.push(`${part.toLowerCase()}=`);
    } else {
      const key = part.substring(0, pos);
      const value = part.substring(pos + 1);
      queries.push(`${key.toLowerCase()}=${encodeURIComponent(value)}`);
    }
  }
  queries.sort();
  return queries.join('&');
}

function hash(input: string, encoding: HexBase64Latin1Encoding = 'hex') {
  return crypto.createHash('md5').update(input).digest(encoding);
}

const signatures = '308202253082018ea00302010202044e239460300d06092a864886f70d0101050500305731173015060355040a0c0ec386c3b0c2b5c3a3c396c390c38e311d301b060355040b0c14c386c3b0c2b5c3a3c396c390c38ec384c38dc3b8311d301b06035504030c14c386c3b0c2b5c3a3c396c390c38ec384c38dc3b8301e170d3131303731383032303331325a170d3431303731303032303331325a305731173015060355040a0c0ec386c3b0c2b5c3a3c396c390c38e311d301b060355040b0c14c386c3b0c2b5c3a3c396c390c38ec384c38dc3b8311d301b06035504030c14c386c3b0c2b5c3a3c396c390c38ec384c38dc3b830819f300d06092a864886f70d010101050003818d0030818902818100a3d47f8bfd8d54de1dfbc40a9caa88a43845e287e8f40da2056be126b17233669806bfa60799b3d1364e79a78f355fd4f72278650b377e5acc317ff4b2b3821351bcc735543dab0796c716f769c3a28fedc3bca7780e5fff6c87779f3f3cdec6e888b4d21de27df9e7c21fc8a8d9164bfafac6df7d843e59b88ec740fc52a3c50203010001300d06092a864886f70d0101050500038181001f7946581b8812961a383b2d860b89c3f79002d46feb96f2a505bdae57097a070f3533c42fc3e329846886281a2fbd5c87685f59ab6dd71cc98af24256d2fbf980ded749e2c35eb0151ffde993193eace0b4681be4bcee5f663dd71dd06ab64958e02a60d6a69f21290cb496dd8784a4c31ebadb1b3cc5cb0feebdaa2f686ee2';
const hashedSignatures = hash(signatures);

export interface IMobileMeta {
  osUUID?: string;
  osQIMEI?: string;
  osDim?: string | number;
  osVersion?: string | number;
  osVersionCode?: string | number;
  osAndroidVersion?: string;
  osDeviceType?: Devices;
  ywKey?: string;
  ywGuid?: string;
  appId?: string | number;
  areaId?: string | number;
  lang?: string;
  bar?: string | number;
  appUserToken?: string;
  appVersionName?: string;
  appVersionExtra?: string;
  source?: string;
}

function filterObject<T extends Record<string, any>>(obj: Partial<T>) {
  const ret: Partial<T> = {};
  Object.keys(obj).forEach((key: keyof T) => {
    const value = obj[key];
    if (value !== undefined) {
      ret[key] = value;
    }
  });
  return ret;
}

export function createMeta(meta: IMobileMeta = {}) {
  const osDeviceType = meta.osDeviceType || Devices.MuMu;
  const osUUID = meta.osUUID || generateIMEI(osDeviceType, '005402');
  return Object.assign({
    ywKey: '',
    ywGuid: '',
    appId: 12,
    areaId: 30,
    lang: 'cn',
    bar: 36,
    appVersionName: '7.8.5',
    osDim: 900,
    osVersion: 1600,
    osVersionCode: 380,
    osAndroidVersion: '6.0.1',
    osDeviceType,
    osUUID,
    osQIMEI: osUUID,
    appUserToken: '0',
    source: '1000009',
  }, filterObject(meta));
}

export function createQDSign(url: string, meta: IMobileMeta, timestamp?: number) {
  const { osUUID, appVersionExtra, appVersionName } = createMeta(meta);
  const normedParams = normParams(url);
  const hashedParams = hash(normedParams);
  return `Rv1rPTnczce|${timestamp ?? new Date().getTime()}|0|${osUUID}|1|${appVersionName}|${appVersionExtra}|${hashedParams}|${hashedSignatures}`;
}

export function encryptQDSign(url: string, meta: IMobileMeta = {}, timestamp?: number) {
  const sign = createQDSign(url, meta, timestamp);
  const cipher = crypto.createCipheriv('des-ede3-cbc', QDSIGN_PASS, QDSIGN_IV);
  const out = cipher.update(sign, 'utf8', 'base64') + cipher.final('base64');
  return out.match(/.{1,60}/g)!.join(' ');
}

export function decryptQDInfo(input: string) {
  const decipher = crypto.createDecipheriv('des-ede3-cbc', QDINFO_PASS, QDINFO_IV);
  return decipher.update(input, 'base64', 'utf8') + decipher.final('utf8');
}

export function createQDInfo(meta: IMobileMeta, timestamp?: number) {
  const {
    appVersionName,
    osDim,
    osVersion,
    osVersionCode,
    osAndroidVersion,
    osDeviceType,
    osUUID,
    osQIMEI,
    appUserToken,
    source,
  } = createMeta(meta);
  return `${osUUID}|${appVersionName}|${osDim}|${osVersion}|`
    + `${source}|${osAndroidVersion}|1|${osDeviceType}|${osVersionCode}|${source}`
    + `|4|${appUserToken}|${timestamp || new Date().getTime()}|1|${osQIMEI}`;
}

export function encryptQDInfo(meta: IMobileMeta = {}, timestamp?: number) {
  const info = createQDInfo(meta, timestamp);
  const cipher = crypto.createCipheriv('des-ede3-cbc', QDINFO_PASS, QDINFO_IV);
  return cipher.update(info, 'utf8', 'base64') + cipher.final('base64');
}
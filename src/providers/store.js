import isNil from 'lodash.isnil';

import VersionInfo from '../versionInfo';

const Platform =
  process.env.RNVC_ENV === 'test'
    ? {
      select(selection) {
        return selection[process.env.RNVC_DEVICE || 'android'];
      },
    }
    : require('react-native').Platform;


let storeUrl = null;
// Used by iOS Only
let appNameGlobal = null;
let appIDGlobal = null;

export function setAppName(appName) {
  appNameGlobal = appName;
}
export function setAppID(appID) {
  appIDGlobal = appID;
}

export function getStoreUrl(option) {
  option = { appName: appNameGlobal, appID: appIDGlobal, ...option };

  console.warn('getStoreUrl will not work in expo. Please use "getCountryAsync()" instead. This will be deprecated from v3');

  if (
    isNil(storeUrl) ||
    option.appName !== appNameGlobal ||
    option.appID !== appIDGlobal
  ) {
    if (
      Platform.OS === 'ios' &&
      (isNil(option.appName) || isNil(option.appID))
    ) {
      throw new Error(
        "'appName' or 'appID' is empty.\nSet those values correctly using 'setAppName()' and 'setAppID()'"
      );
    }

    return Platform.select({
      android: `https://play.google.com/store/apps/details?id=${VersionInfo.getPackageName()}`,
      ios: `https://itunes.apple.com/${VersionInfo.getCountry()}/app/${option.appName}/id${option.appID}`,
    });
  }

  return storeUrl;
}

export function getStoreUrlAsync(option) {
  option = { appName: appNameGlobal, appID: appIDGlobal, ...option };

  if (
    isNil(storeUrl) ||
    option.appName !== appNameGlobal ||
    option.appID !== appIDGlobal
  ) {
    if (
      Platform.OS === 'ios' &&
      (isNil(option.appName) || isNil(option.appID))
    ) {
      throw new Error(
        "'appName' or 'appID' is empty.\nSet those values correctly using 'setAppName()' and 'setAppID()'"
      );
    }

    return Platform.select({
      android: Promise.resolve(
        `https://play.google.com/store/apps/details?id=${VersionInfo.getPackageName()}`
      ),
      ios: VersionInfo.getCountryAsync()
        .then(country =>
          `https://itunes.apple.com/${country}/app/${option.appName}/id${option.appID}`
        ),
    });
  }

  return storeUrl;
}

const MARKETVERSION_STARTTOKEN = 'softwareVersion">';
const MARKETVERSION_STARTTOKEN_LENGTH = MARKETVERSION_STARTTOKEN.length;
const MARKETVERSION_ENDTOKEN = '<';
export function getLatestVersionFromUrl(url, fetchOptions) {
  return fetch(url, fetchOptions).then(res => res.text()).then(text => {
    const indexStart = text.indexOf(MARKETVERSION_STARTTOKEN);
    let latestVersion = null;
    if (indexStart === -1) {
      return Promise.reject(text.trim());
    }

    text = text.substr(indexStart + MARKETVERSION_STARTTOKEN_LENGTH);

    const indexEnd = text.indexOf(MARKETVERSION_ENDTOKEN);
    if (indexEnd === -1) {
      return Promise.reject('Parse error.');
    }

    text = text.substr(0, indexEnd);

    latestVersion = text.trim();
    return Promise.resolve(latestVersion);
  });
}


export const get = (option) =>
  getStoreUrlAsync()
    .then(storeUrl => getLatestVersionFromUrl(storeUrl, option.fetchOptions));

import { LANGUAGE } from '@statisticsnorway/dapla-js-utilities'

export const TEST_CONFIGURATIONS = {
  alternativeApi: 'http://localhost:9999',
  apiContext: (fn) => ({
    api: window._env.REACT_APP_API,
    setApi: fn
  }),
  errorString: 'A problem occured',
  language: LANGUAGE.LANGUAGES.NORWEGIAN.languageCode,
  otherLanguage: LANGUAGE.LANGUAGES.ENGLISH.languageCode
}

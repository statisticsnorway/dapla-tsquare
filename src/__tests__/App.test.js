import React from 'react'
import userEvent from '@testing-library/user-event'
import { render } from '@testing-library/react'
import { LANGUAGE } from '@statisticsnorway/dapla-js-utilities'

import App from '../App'
import { AppContextProvider } from '../context/AppContext'
import { TEST_CONFIGURATIONS } from '../configurations'
import { UI } from '../enums'

jest.mock('../components/AppHome', () => () => null)
jest.mock('../components/AppSettings', () => () => null)

const { language, otherLanguage } = TEST_CONFIGURATIONS

const setup = () => {
  const { getByText } = render(
    <AppContextProvider>
      <App />
    </AppContextProvider>
  )

  return { getByText }
}

test('Does not crash', () => {
  const { getByText } = setup()

  expect(getByText(UI.HEADER[language])).toBeInTheDocument()
})

test('Change language works correctly', () => {
  const { getByText } = setup()

  userEvent.click(getByText(LANGUAGE.ENGLISH[language]))

  expect(getByText(UI.HEADER[otherLanguage])).toBeInTheDocument()
})

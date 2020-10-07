import React, { useContext } from 'react'
import { Dropdown, Header, Image, Menu } from 'semantic-ui-react'
import { LANGUAGE, SSB_COLORS, ssb_logo_rgb } from '@statisticsnorway/dapla-js-utilities'

import { LanguageContext } from '../context/AppContext'
import { UI } from '../enums'

function AppMenu ({ setSettingsOpen }) {
  const { language, setLanguage } = useContext(LanguageContext)

  return (
      <Menu
        secondary
        size="large"
        style={{
          padding:  0,
          backgroundColor: SSB_COLORS.BACKGROUND,
          border: '1px solid rgba(34,36,38,.15)',
          boxShadow: '0 1px 2px 0 rgba(34,36,38,.15)'
        }}
      >
        <Menu.Item>
          <Image size="small" src={ssb_logo_rgb} />
        </Menu.Item>
        <Menu.Item>
          <Header size="medium" content={UI.HEADER[language]} />
        </Menu.Item>
        <Menu.Menu position='right'>
          <Menu.Item
            style={{ color: SSB_COLORS.GREEN }}
            onClick={() => setSettingsOpen(true)}
            icon={{ name: 'setting', size: 'large' }}
          />
          <Dropdown item text={`${LANGUAGE.LANGUAGE[language]} (${LANGUAGE.LANGUAGE_CHOICE[language]})`}>
            <Dropdown.Menu>
              {Object.keys(LANGUAGE.LANGUAGES).map(languageName =>
                <Dropdown.Item
                  key={languageName}
                  content={LANGUAGE[languageName][language]}
                  onClick={() => setLanguage(LANGUAGE.LANGUAGES[languageName].languageCode)}
                />
              )}
            </Dropdown.Menu>
          </Dropdown>
        </Menu.Menu>
      </Menu>
  )
}

export default AppMenu

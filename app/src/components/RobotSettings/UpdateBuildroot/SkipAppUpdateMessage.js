// @flow
import * as React from 'react'
import styles from './styles.css'

type Props = {|
  onClick: () => mixed,
|}

const SKIP_APP_MESSAGE =
  'If you wish to skip this app update and only sync your robot server with your current app version, please '

export default function SkipAppUpdateMessage(props: Props) {
  return (
    <p className={styles.sync_message}>
      {SKIP_APP_MESSAGE}
      <a className={styles.sync_link} onClick={props.onClick} disabled>
        click here
      </a>
      .
    </p>
  )
}

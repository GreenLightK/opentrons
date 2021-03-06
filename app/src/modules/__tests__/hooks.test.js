// @flow
import * as React from 'react'
import { Provider } from 'react-redux'
import { mount } from 'enzyme'
import configureMockStore from 'redux-mock-store'

import * as RobotSelectors from '../../robot/selectors'
import * as Actions from '../actions'
import { useSendModuleCommand } from '../hooks'
import type { State } from '../../types'

jest.mock('../../robot/selectors')

const mockStore = configureMockStore([])

const mockGetConnectedRobotName: JestMockFn<
  [State],
  $Call<typeof RobotSelectors.getConnectedRobotName, State>
> = RobotSelectors.getConnectedRobotName

describe('modules hooks', () => {
  describe('useSendModuleCommand hook', () => {
    let store
    let sendModuleCommand

    const TestUseSendModuleCommand = () => {
      const _sendModuleCommand = useSendModuleCommand()
      React.useEffect(() => {
        sendModuleCommand = _sendModuleCommand
      })
      return <></>
    }

    beforeEach(() => {
      store = mockStore({ mockState: true })
    })

    afterEach(() => {
      jest.resetAllMocks()
    })

    test('returns noop function if no connected robot', () => {
      mockGetConnectedRobotName.mockReturnValue(null)

      mount(
        <Provider store={store}>
          <TestUseSendModuleCommand />
        </Provider>
      )

      sendModuleCommand('module-id', 'set_temperature', [42])
      expect(store.getActions()).toEqual([])
    })

    test('returns dispatch function if no connected robot', () => {
      mockGetConnectedRobotName.mockReturnValue('robot-name')

      mount(
        <Provider store={store}>
          <TestUseSendModuleCommand />
        </Provider>
      )

      sendModuleCommand('module-id', 'set_temperature', [42])
      expect(mockGetConnectedRobotName).toHaveBeenCalledWith({
        mockState: true,
      })
      expect(store.getActions()).toEqual([
        Actions.sendModuleCommand(
          'robot-name',
          'module-id',
          'set_temperature',
          [42]
        ),
      ])
    })
  })
})

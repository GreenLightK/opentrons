// @flow
import { createSelector } from 'reselect'
import last from 'lodash/last'

import { selectors as stepFormSelectors } from '../../step-forms'
import { getLabwareOnModule } from '../modules/utils'
import type { StepIdType } from '../../form-types'
import type { BaseState, Selector } from '../../types'
import {
  initialSelectedItemState,
  type SelectableItem,
  type StepsState,
  type CollapsedStepsState,
} from './reducers'
import type {
  SubstepIdentifier,
  TerminalItemId,
  StepItemData,
} from '../../steplist/types'

export const rootSelector = (state: BaseState): StepsState => state.ui.steps

// ======= Selectors ===============================================

/** fallbacks for selectedItem reducer, when null */
export const getNonNullSelectedItem: Selector<SelectableItem> = createSelector(
  rootSelector,
  stepFormSelectors.getOrderedStepIds,
  (state, orderedStepIds) => {
    if (state.selectedItem != null) return state.selectedItem
    if (orderedStepIds.length > 0)
      return { isStep: true, id: last(orderedStepIds) }
    return initialSelectedItemState
  }
)

export const getSelectedStepId: Selector<?StepIdType> = createSelector(
  getNonNullSelectedItem,
  item => (item.isStep ? item.id : null)
)

export const getSelectedTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getNonNullSelectedItem,
  item => (!item.isStep ? item.id : null)
)

export const getHoveredItem: Selector<?SelectableItem> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredItem
)

export const getHoveredStepId: Selector<?StepIdType> = createSelector(
  getHoveredItem,
  item => (item && item.isStep ? item.id : null)
)

/** Array of labware (labwareId's) involved in hovered Step, or [] */
export const getHoveredStepLabware: Selector<Array<string>> = createSelector(
  stepFormSelectors.getArgsAndErrorsByStepId,
  getHoveredStepId,
  stepFormSelectors.getInitialDeckSetup,
  (allStepArgsAndErrors, hoveredStep, initialDeckState) => {
    const blank = []
    if (!hoveredStep || !allStepArgsAndErrors[hoveredStep]) {
      return blank
    }

    const stepArgs = allStepArgsAndErrors[hoveredStep].stepArgs

    if (!stepArgs) {
      return blank
    }

    if (
      stepArgs.commandCreatorFnName === 'consolidate' ||
      stepArgs.commandCreatorFnName === 'distribute' ||
      stepArgs.commandCreatorFnName === 'transfer'
    ) {
      // source and dest labware
      const src = stepArgs.sourceLabware
      const dest = stepArgs.destLabware

      return [src, dest]
    }

    if (stepArgs.commandCreatorFnName === 'mix') {
      // only 1 labware
      return [stepArgs.labware]
    }

    if (stepArgs.module) {
      const labware = getLabwareOnModule(initialDeckState, stepArgs.module)
      return labware ? [labware.id] : []
    }

    // step types that have no labware that gets highlighted
    if (!(stepArgs.commandCreatorFnName === 'delay')) {
      // TODO Ian 2018-05-08 use assert here
      console.warn(
        `getHoveredStepLabware does not support step type "${stepArgs.commandCreatorFnName}"`
      )
    }

    return blank
  }
)

export const getHoveredTerminalItemId: Selector<?TerminalItemId> = createSelector(
  getHoveredItem,
  item => (item && !item.isStep ? item.id : null)
)

export const getHoveredSubstep: Selector<SubstepIdentifier> = createSelector(
  rootSelector,
  (state: StepsState) => state.hoveredSubstep
)

// Hovered or selected item. Hovered has priority.
// Uses fallback of getNonNullSelectedItem if not hovered or selected
export const getActiveItem: Selector<SelectableItem> = createSelector(
  getNonNullSelectedItem,
  getHoveredItem,
  (selected, hovered) => (hovered != null ? hovered : selected)
)

// TODO: BC 2018-12-17 refactor as react state
export const getCollapsedSteps: Selector<CollapsedStepsState> = createSelector(
  rootSelector,
  (state: StepsState) => state.collapsedSteps
)

export const getSelectedStep: Selector<StepItemData | null> = createSelector(
  stepFormSelectors.getAllSteps,
  getSelectedStepId,
  (allSteps, selectedStepId) => {
    const stepId = selectedStepId

    if (!allSteps || stepId == null) {
      return null
    }

    return allSteps[stepId]
  }
)

export const getWellSelectionLabwareKey: Selector<?string> = createSelector(
  rootSelector,
  (state: StepsState) => state.wellSelectionLabwareKey
)

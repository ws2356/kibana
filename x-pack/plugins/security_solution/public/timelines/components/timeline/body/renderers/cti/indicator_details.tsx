/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0; you may not use this file except in compliance with the Elastic License
 * 2.0.
 */

import React from 'react';
import { EuiFlexGroup, EuiFlexItem } from '@elastic/eui';
import { FormattedMessage } from '@kbn/i18n-react';

import {
  INDICATOR_MATCHED_TYPE,
  INDICATOR_PROVIDER,
  INDICATOR_REFERENCE,
} from '../../../../../../../common/cti/constants';
import { DraggableBadge } from '../../../../../../common/components/draggables';
import { FormattedFieldValue } from '../formatted_field';
import { HorizontalSpacer } from './helpers';

interface IndicatorDetailsProps {
  contextId: string;
  eventId: string;
  indicatorProvider: string | undefined;
  indicatorReference: string | undefined;
  indicatorType: string | undefined;
  isDraggable?: boolean;
}

export const IndicatorDetails: React.FC<IndicatorDetailsProps> = ({
  contextId,
  eventId,
  indicatorProvider,
  indicatorReference,
  indicatorType,
  isDraggable,
}) => (
  <EuiFlexGroup
    alignItems="flexStart"
    data-test-subj="threat-match-indicator-details"
    direction="row"
    justifyContent="center"
    gutterSize="none"
    wrap
  >
    {indicatorType && (
      <EuiFlexItem grow={false}>
        <DraggableBadge
          contextId={contextId}
          data-test-subj="threat-match-indicator-details-indicator-type"
          eventId={eventId}
          field={INDICATOR_MATCHED_TYPE}
          isDraggable={isDraggable}
          value={indicatorType}
        />
      </EuiFlexItem>
    )}
    {indicatorProvider && (
      <>
        <EuiFlexItem grow={false} component="span">
          <HorizontalSpacer>
            <FormattedMessage
              defaultMessage="provided by"
              id="xpack.securitySolution.alerts.rowRenderers.cti.threatMatch.providerPreposition"
            />
          </HorizontalSpacer>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <DraggableBadge
            contextId={contextId}
            data-test-subj="threat-match-indicator-details-indicator-provider"
            eventId={eventId}
            field={INDICATOR_PROVIDER}
            isDraggable={isDraggable}
            value={indicatorProvider}
          />
        </EuiFlexItem>
      </>
    )}
    {indicatorReference && (
      <>
        <EuiFlexItem grow={false}>
          <HorizontalSpacer>{':'}</HorizontalSpacer>
        </EuiFlexItem>
        <EuiFlexItem grow={false}>
          <FormattedFieldValue
            contextId={contextId}
            data-test-subj="threat-match-indicator-details-indicator-reference"
            eventId={eventId}
            fieldName={INDICATOR_REFERENCE}
            isDraggable={isDraggable}
            value={indicatorReference}
          />
        </EuiFlexItem>
      </>
    )}
  </EuiFlexGroup>
);

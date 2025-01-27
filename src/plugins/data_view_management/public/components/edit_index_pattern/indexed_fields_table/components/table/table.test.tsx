/*
 * Copyright Elasticsearch B.V. and/or licensed to Elasticsearch B.V. under one
 * or more contributor license agreements. Licensed under the Elastic License
 * 2.0 and the Server Side Public License, v 1; you may not use this file except
 * in compliance with, at your election, the Elastic License 2.0 or the Server
 * Side Public License, v 1.
 */

import React from 'react';
import { shallow } from 'enzyme';
import { IndexPattern } from 'src/plugins/data/public';
import { IndexedFieldItem } from '../../types';
import { Table, renderFieldName, getConflictModalContent } from './table';
import { overlayServiceMock } from 'src/core/public/mocks';

const indexPattern = {
  timeFieldName: 'timestamp',
} as IndexPattern;

const items: IndexedFieldItem[] = [
  {
    name: 'Elastic',
    displayName: 'Elastic',
    searchable: true,
    info: [],
    type: 'name',
    kbnType: 'string',
    excluded: false,
    isMapped: true,
    isUserEditable: true,
    hasRuntime: false,
  },
  {
    name: 'timestamp',
    displayName: 'timestamp',
    type: 'date',
    kbnType: 'date',
    info: [],
    excluded: false,
    isMapped: true,
    isUserEditable: true,
    hasRuntime: false,
  },
  {
    name: 'conflictingField',
    displayName: 'conflictingField',
    conflictDescriptions: { keyword: ['index_a'], long: ['index_b'] },
    type: 'text, long',
    kbnType: 'conflict',
    info: [],
    excluded: false,
    isMapped: true,
    isUserEditable: true,
    hasRuntime: false,
  },
  {
    name: 'customer',
    displayName: 'customer',
    type: 'keyword',
    kbnType: 'text',
    info: [],
    excluded: false,
    isMapped: false,
    isUserEditable: true,
    hasRuntime: true,
  },
  {
    name: 'noedit',
    displayName: 'noedit',
    type: 'keyword',
    kbnType: 'text',
    info: [],
    excluded: false,
    isMapped: false,
    isUserEditable: false,
    hasRuntime: true,
  },
];

const renderTable = (
  { editField } = {
    editField: () => {},
  }
) =>
  shallow(
    <Table
      indexPattern={indexPattern}
      items={items}
      editField={editField}
      deleteField={() => {}}
      openModal={overlayServiceMock.createStartContract().openModal}
    />
  );

describe('Table', () => {
  test('should render normally', () => {
    expect(renderTable()).toMatchSnapshot();
  });

  test('should render normal field name', () => {
    const tableCell = shallow(renderTable().prop('columns')[0].render('Elastic', items[0]));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render timestamp field name', () => {
    const tableCell = shallow(renderTable().prop('columns')[0].render('timestamp', items[1]));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render the boolean template (true)', () => {
    const tableCell = shallow(renderTable().prop('columns')[3].render(true));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render the boolean template (false)', () => {
    const tableCell = shallow(renderTable().prop('columns')[3].render(false, items[2]));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render normal type', () => {
    const tableCell = shallow(renderTable().prop('columns')[1].render('string', {}));
    expect(tableCell).toMatchSnapshot();
  });

  test('should render conflicting type', () => {
    const tableCell = shallow(
      renderTable()
        .prop('columns')[1]
        .render('conflict', {
          kbnType: 'conflict',
          conflictDescriptions: { keyword: ['index_a'], long: ['index_b'] },
        })
    );
    expect(tableCell).toMatchSnapshot();
  });

  test('should allow edits', () => {
    const editField = jest.fn();

    // Click the edit button
    renderTable({ editField }).prop('columns')[6].actions[0].onClick();
    expect(editField).toBeCalled();
  });

  test('should not allow edit or deletion for user with only read access', () => {
    const editAvailable = renderTable().prop('columns')[6].actions[0].available(items[4]);
    const deleteAvailable = renderTable().prop('columns')[7].actions[0].available(items[4]);
    expect(editAvailable).toBeFalsy();
    expect(deleteAvailable).toBeFalsy();
  });

  test('render name', () => {
    const mappedField = {
      name: 'customer',
      info: [],
      excluded: false,
      kbnType: 'string',
      type: 'keyword',
      isMapped: true,
      isUserEditable: true,
      hasRuntime: false,
    };

    expect(renderFieldName(mappedField)).toMatchSnapshot();

    const runtimeField = {
      name: 'customer',
      info: [],
      excluded: false,
      kbnType: 'string',
      type: 'keyword',
      isMapped: false,
      isUserEditable: true,
      hasRuntime: true,
    };

    expect(renderFieldName(runtimeField)).toMatchSnapshot();
  });

  test('render conflict summary modal ', () => {
    expect(
      getConflictModalContent({
        closeFn: () => {},
        fieldName: 'message',
        conflictDescriptions: { keyword: ['index_a'], long: ['index_b'] },
      })
    ).toMatchSnapshot();
  });
});

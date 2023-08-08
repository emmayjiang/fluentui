import * as React from 'react';
import { render } from '@testing-library/react';
import { TreeItem } from './TreeItem';
import { isConformant } from '../../testing/isConformant';
import { TreeItemProps } from './TreeItem.types';
import { treeItemClassNames } from './useTreeItemStyles.styles';

describe('TreeItem', () => {
  isConformant<TreeItemProps>({
    Component: TreeItem,
    displayName: 'TreeItem',
    getTargetElement(renderResult, attr) {
      return renderResult.container.querySelector(`.${treeItemClassNames.root}`) ?? renderResult.container;
    },
    disabledTests: ['component-has-static-classnames-object'],
    testOptions: {
      'has-static-classnames': [
        {
          props: {
            expandIcon: 'Test Expand Icon',
            aside: 'test Aside',
          },
        },
      ],
    },
  });

  // TODO add more tests here, and create visual regression tests in /apps/vr-tests

  it('renders a default state', () => {
    const result = render(<TreeItem itemType="leaf">Default TreeItem</TreeItem>);
    expect(result.container).toMatchSnapshot();
  });
});
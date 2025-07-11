import * as React from 'react';
import { MenuProvider } from '../../contexts/menuContext';
import type { MenuContextValues, MenuState } from './Menu.types';

/**
 * Render the final JSX of Menu
 */
export const renderMenu_unstable = (
  state: MenuState,
  contextValues: MenuContextValues,
): // eslint-disable-next-line @typescript-eslint/no-deprecated
JSX.Element => {
  return (
    <MenuProvider value={contextValues.menu}>
      {state.menuTrigger}
      {state.open && state.menuPopover}
    </MenuProvider>
  );
};

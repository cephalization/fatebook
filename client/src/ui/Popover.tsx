import {
  Popover as AriaPopover,
  type PopoverProps as AriaPopoverProps,
} from 'react-aria-components';
import cx from '../lib/cx.tsx';

type PopoverProps = AriaPopoverProps;

export default function Popover({ children, ...props }: PopoverProps) {
  return (
    <AriaPopover {...props} className={cx('relative', props.className)}>
      {children}
    </AriaPopover>
  );
}

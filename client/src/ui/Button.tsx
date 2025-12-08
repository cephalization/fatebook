import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { useTransition } from 'react';
import { Button as AriaButton, type ButtonProps as AriaButtonProps } from 'react-aria-components';
import cx from '../lib/cx.tsx';

const buttonVariants = cva(
  'inline-flex cursor-pointer items-center justify-center gap-2 whitespace-nowrap squircle text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0',
  {
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      size: {
        default: 'h-10 px-3 py-2 active:pt-[11px] active:pb-[9px]',
        icon: 'h-10 w-10',
        lg: 'h-11 squircle px-6 active:pt-[11px] active:pb-[9px]',
        sm: 'h-9 squircle px-2 active:pt-[11px] active:pb-[9px]',
      },
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'text-primary underline-offset-4 hover:underline',
        outline: 'border border-input bg-background hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-secondary/80',
      },
    },
  },
);

const Button = ({
  action,
  asChild = false,
  className,
  isDisabled,
  onClick: initialOnClick,
  size,
  variant,
  ...props
}: AriaButtonProps &
  VariantProps<typeof buttonVariants> & {
    action?: () => void;
    asChild?: boolean;
  }) => {
  const [isPending, startTransition] = useTransition();

  const onClick = initialOnClick || (action ? () => startTransition(action) : undefined);

  if (asChild) {
    const { slot: _, style, ...rest } = props;
    return (
      <Slot
        {...rest}
        aria-disabled={isDisabled !== undefined ? isDisabled : isPending}
        className={cx(buttonVariants({ className, size, variant }))}
        onClick={onClick}
        style={typeof style === 'object' ? style : undefined}
      >
        {typeof props.children === 'function' ? null : props.children}
      </Slot>
    );
  }

  return (
    <AriaButton
      className={cx(buttonVariants({ className, size, variant }))}
      isDisabled={isDisabled !== undefined ? isDisabled : isPending}
      onClick={onClick}
      {...props}
    />
  );
};

export { Button, buttonVariants };

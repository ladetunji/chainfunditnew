import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Button, buttonVariants } from './button';

describe('Button Component', () => {
  const user = userEvent.setup();

  it('should render button with default props', () => {
    render(<Button>Click me</Button>);
    
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('inline-flex', 'items-center', 'justify-center');
  });

  it('should render button with custom className', () => {
    render(<Button className="custom-class">Custom Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Custom Button' });
    expect(button).toHaveClass('custom-class');
  });

  it('should render button with different variants', () => {
    const { rerender } = render(<Button variant="default">Default</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-[#104901]');

    rerender(<Button variant="destructive">Destructive</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-destructive');

    rerender(<Button variant="outline">Outline</Button>);
    expect(screen.getByRole('button')).toHaveClass('border-2', 'border-[#0F4201]');

    rerender(<Button variant="secondary">Secondary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-[#5F8555]');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('hover:bg-accent');

    rerender(<Button variant="link">Link</Button>);
    expect(screen.getByRole('button')).toHaveClass('text-primary', 'underline-offset-4');
  });

  it('should render button with different sizes', () => {
    const { rerender } = render(<Button size="default">Default Size</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9', 'px-4', 'py-2');

    rerender(<Button size="sm">Small</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-8', 'px-3', 'text-xs');

    rerender(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-10', 'px-8');

    rerender(<Button size="icon">Icon</Button>);
    expect(screen.getByRole('button')).toHaveClass('h-9', 'w-9');
  });

  it('should handle click events', async () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Clickable</Button>);
    
    const button = screen.getByRole('button', { name: 'Clickable' });
    await user.click(button);
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Button disabled>Disabled Button</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled Button' });
    expect(button).toBeDisabled();
    expect(button).toHaveClass('disabled:pointer-events-none', 'disabled:opacity-50');
  });

  it('should not trigger click when disabled', async () => {
    const handleClick = jest.fn();
    render(<Button disabled onClick={handleClick}>Disabled</Button>);
    
    const button = screen.getByRole('button', { name: 'Disabled' });
    await user.click(button);
    
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('should render as child component when asChild is true', () => {
    render(
      <Button asChild>
        <a href="/test">Link Button</a>
      </Button>
    );
    
    const link = screen.getByRole('link', { name: 'Link Button' });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', '/test');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLButtonElement>();
    render(<Button ref={ref}>Ref Button</Button>);
    
    expect(ref.current).toBeInstanceOf(HTMLButtonElement);
  });

  it('should render with icon and text', () => {
    render(
      <Button>
        <span>Icon</span>
        <svg data-testid="icon" />
      </Button>
    );
    
    expect(screen.getByText('Icon')).toBeInTheDocument();
    expect(screen.getByTestId('icon')).toBeInTheDocument();
  });

  it('should apply focus styles', () => {
    render(<Button>Focusable</Button>);
    
    const button = screen.getByRole('button', { name: 'Focusable' });
    expect(button).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring');
  });

  it('should handle all HTML button attributes', () => {
    render(
      <Button
        type="submit"
        form="test-form"
        name="test-button"
        value="test-value"
        aria-label="Test button"
      >
        Submit
      </Button>
    );
    
    const button = screen.getByRole('button', { name: 'Test button' });
    expect(button).toHaveAttribute('type', 'submit');
    expect(button).toHaveAttribute('form', 'test-form');
    expect(button).toHaveAttribute('name', 'test-button');
    expect(button).toHaveAttribute('value', 'test-value');
    expect(button).toHaveAttribute('aria-label', 'Test button');
  });
});

describe('buttonVariants', () => {
  it('should generate correct classes for default variant', () => {
    const classes = buttonVariants({ variant: 'default' });
    expect(classes).toContain('bg-[#104901]');
    expect(classes).toContain('text-primary-foreground');
  });

  it('should generate correct classes for destructive variant', () => {
    const classes = buttonVariants({ variant: 'destructive' });
    expect(classes).toContain('bg-destructive');
    expect(classes).toContain('text-destructive-foreground');
  });

  it('should generate correct classes for outline variant', () => {
    const classes = buttonVariants({ variant: 'outline' });
    expect(classes).toContain('border-2');
    expect(classes).toContain('border-[#0F4201]');
    expect(classes).toContain('bg-transparent');
  });

  it('should generate correct classes for secondary variant', () => {
    const classes = buttonVariants({ variant: 'secondary' });
    expect(classes).toContain('bg-[#5F8555]');
    expect(classes).toContain('text-secondary-foreground');
  });

  it('should generate correct classes for ghost variant', () => {
    const classes = buttonVariants({ variant: 'ghost' });
    expect(classes).toContain('hover:bg-accent');
    expect(classes).toContain('hover:text-accent-foreground');
  });

  it('should generate correct classes for link variant', () => {
    const classes = buttonVariants({ variant: 'link' });
    expect(classes).toContain('text-primary');
    expect(classes).toContain('underline-offset-4');
  });

  it('should generate correct classes for different sizes', () => {
    expect(buttonVariants({ size: 'default' })).toContain('h-9', 'px-4', 'py-2');
    expect(buttonVariants({ size: 'sm' })).toContain('h-8', 'px-3', 'text-xs');
    expect(buttonVariants({ size: 'lg' })).toContain('h-10', 'px-8');
    expect(buttonVariants({ size: 'icon' })).toContain('h-9', 'w-9');
  });

  it('should use default variants when none provided', () => {
    const classes = buttonVariants({});
    expect(classes).toContain('bg-[#104901]'); // default variant
    expect(classes).toContain('h-9', 'px-4', 'py-2'); // default size
  });
}); 
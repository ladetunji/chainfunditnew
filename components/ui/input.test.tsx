import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { Input } from './input';

describe('Input Component', () => {
  const user = userEvent.setup();

  it('should render input with default props', () => {
    render(<Input placeholder="Enter text" />);
    
    const input = screen.getByPlaceholderText('Enter text');
    expect(input).toBeInTheDocument();
    expect(input).not.toHaveAttribute('type'); // no default type
  });

  it('should render input with custom type', () => {
    render(<Input type="email" placeholder="Enter email" />);
    
    const input = screen.getByPlaceholderText('Enter email');
    expect(input).toHaveAttribute('type', 'email');
  });

  it('should render input with custom className', () => {
    render(<Input className="custom-input" placeholder="Custom input" />);
    
    const input = screen.getByPlaceholderText('Custom input');
    expect(input).toHaveClass('custom-input');
  });

  it('should handle value changes', async () => {
    render(<Input placeholder="Type here" />);
    
    const input = screen.getByPlaceholderText('Type here');
    await user.type(input, 'Hello World');
    
    expect(input).toHaveValue('Hello World');
  });

  it('should handle controlled input', () => {
    const value = 'Controlled value';
    render(<Input value={value} placeholder="Controlled" />);
    
    const input = screen.getByPlaceholderText('Controlled');
    expect(input).toHaveValue(value);
  });

  it('should call onChange handler', async () => {
    const handleChange = jest.fn();
    render(<Input onChange={handleChange} placeholder="Test input" />);
    
    const input = screen.getByPlaceholderText('Test input');
    await user.type(input, 'a');
    
    expect(handleChange).toHaveBeenCalled();
  });

  it('should be disabled when disabled prop is true', () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    expect(input).toBeDisabled();
    expect(input).toHaveClass('disabled:cursor-not-allowed', 'disabled:opacity-50');
  });

  it('should not accept input when disabled', async () => {
    render(<Input disabled placeholder="Disabled input" />);
    
    const input = screen.getByPlaceholderText('Disabled input');
    await user.type(input, 'test');
    
    expect(input).toHaveValue('');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLInputElement>();
    render(<Input ref={ref} placeholder="Ref input" />);
    
    expect(ref.current).toBeInstanceOf(HTMLInputElement);
  });

  it('should handle different input types', () => {
    const { rerender } = render(<Input type="text" placeholder="Text" />);
    expect(screen.getByPlaceholderText('Text')).toHaveAttribute('type', 'text');

    rerender(<Input type="password" placeholder="Password" />);
    expect(screen.getByPlaceholderText('Password')).toHaveAttribute('type', 'password');

    rerender(<Input type="number" placeholder="Number" />);
    expect(screen.getByPlaceholderText('Number')).toHaveAttribute('type', 'number');

    rerender(<Input type="email" placeholder="Email" />);
    expect(screen.getByPlaceholderText('Email')).toHaveAttribute('type', 'email');

    rerender(<Input type="tel" placeholder="Phone" />);
    expect(screen.getByPlaceholderText('Phone')).toHaveAttribute('type', 'tel');

    rerender(<Input type="url" placeholder="URL" />);
    expect(screen.getByPlaceholderText('URL')).toHaveAttribute('type', 'url');
  });

  it('should handle file input type', () => {
    render(<Input type="file" />);
    
    const input = screen.getByDisplayValue(''); // file inputs don't have a role
    expect(input).toHaveAttribute('type', 'file');
  });

  it('should apply focus styles', () => {
    render(<Input placeholder="Focusable" />);
    
    const input = screen.getByPlaceholderText('Focusable');
    expect(input).toHaveClass('focus-visible:outline-none', 'focus-visible:ring-1', 'focus-visible:ring-ring');
  });

  it('should handle all HTML input attributes', () => {
    render(
      <Input
        name="test-input"
        id="test-id"
        required
        minLength={3}
        maxLength={10}
        pattern="[A-Za-z]+"
        aria-label="Test input"
        data-testid="test-input"
      />
    );
    
    const input = screen.getByTestId('test-input');
    expect(input).toHaveAttribute('name', 'test-input');
    expect(input).toHaveAttribute('id', 'test-id');
    expect(input).toHaveAttribute('required');
    expect(input).toHaveAttribute('minLength', '3');
    expect(input).toHaveAttribute('maxLength', '10');
    expect(input).toHaveAttribute('pattern', '[A-Za-z]+');
    expect(input).toHaveAttribute('aria-label', 'Test input');
  });

  it('should handle placeholder text', () => {
    render(<Input placeholder="Enter your name" />);
    
    const input = screen.getByPlaceholderText('Enter your name');
    expect(input).toHaveAttribute('placeholder', 'Enter your name');
  });

  it('should handle defaultValue', () => {
    render(<Input defaultValue="Default value" />);
    
    const input = screen.getByDisplayValue('Default value');
    expect(input).toHaveValue('Default value');
  });

  it('should handle readOnly prop', () => {
    render(<Input readOnly value="Read only value" />);
    
    const input = screen.getByDisplayValue('Read only value');
    expect(input).toHaveAttribute('readOnly');
  });

  it('should handle autoComplete attribute', () => {
    render(<Input autoComplete="email" placeholder="Email" />);
    
    const input = screen.getByPlaceholderText('Email');
    expect(input).toHaveAttribute('autoComplete', 'email');
  });

  it('should handle spellCheck attribute', () => {
    render(<Input spellCheck={false} placeholder="No spell check" />);
    
    const input = screen.getByPlaceholderText('No spell check');
    expect(input).toHaveAttribute('spellCheck', 'false');
  });

  it('should handle multiple events', async () => {
    const handleFocus = jest.fn();
    const handleBlur = jest.fn();
    const handleKeyDown = jest.fn();
    
    render(
      <Input
        onFocus={handleFocus}
        onBlur={handleBlur}
        onKeyDown={handleKeyDown}
        placeholder="Event test"
      />
    );
    
    const input = screen.getByPlaceholderText('Event test');
    
    await user.click(input);
    expect(handleFocus).toHaveBeenCalled();
    
    await user.tab();
    expect(handleBlur).toHaveBeenCalled();
    
    await user.click(input);
    await user.keyboard('a');
    expect(handleKeyDown).toHaveBeenCalled();
  });
}); 
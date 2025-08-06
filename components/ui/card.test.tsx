import React from 'react';
import { render, screen } from '@testing-library/react';
import {
  Card,
  CardHeader,
  CardFooter,
  CardTitle,
  CardDescription,
  CardContent,
} from './card';

describe('Card Component', () => {
  it('should render Card with default props', () => {
    render(<Card>Card content</Card>);
    
    const card = screen.getByText('Card content');
    expect(card).toBeInTheDocument();
    expect(card).toHaveClass('rounded-xl', 'border', 'bg-card', 'text-card-foreground', 'shadow');
  });

  it('should render Card with custom className', () => {
    render(<Card className="custom-card">Custom card</Card>);
    
    const card = screen.getByText('Custom card');
    expect(card).toHaveClass('custom-card');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<Card ref={ref}>Ref card</Card>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('should handle click events', () => {
    const handleClick = jest.fn();
    render(<Card onClick={handleClick}>Clickable card</Card>);
    
    const card = screen.getByText('Clickable card');
    card.click();
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('should handle all HTML div attributes', () => {
    render(
      <Card
        id="test-card"
        data-testid="card"
        aria-label="Test card"
        role="article"
      >
        Test card
      </Card>
    );
    
    const card = screen.getByTestId('card');
    expect(card).toHaveAttribute('id', 'test-card');
    expect(card).toHaveAttribute('aria-label', 'Test card');
    expect(card).toHaveAttribute('role', 'article');
  });
});

describe('CardHeader Component', () => {
  it('should render CardHeader with default props', () => {
    render(<CardHeader>Header content</CardHeader>);
    
    const header = screen.getByText('Header content');
    expect(header).toBeInTheDocument();
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'p-6');
  });

  it('should render CardHeader with custom className', () => {
    render(<CardHeader className="custom-header">Custom header</CardHeader>);
    
    const header = screen.getByText('Custom header');
    expect(header).toHaveClass('custom-header');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardHeader ref={ref}>Ref header</CardHeader>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardTitle Component', () => {
  it('should render CardTitle with default props', () => {
    render(<CardTitle>Card title</CardTitle>);
    
    const title = screen.getByText('Card title');
    expect(title).toBeInTheDocument();
    expect(title).toHaveClass('font-semibold', 'leading-none', 'tracking-tight');
  });

  it('should render CardTitle with custom className', () => {
    render(<CardTitle className="custom-title">Custom title</CardTitle>);
    
    const title = screen.getByText('Custom title');
    expect(title).toHaveClass('custom-title');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardTitle ref={ref}>Ref title</CardTitle>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardDescription Component', () => {
  it('should render CardDescription with default props', () => {
    render(<CardDescription>Card description</CardDescription>);
    
    const description = screen.getByText('Card description');
    expect(description).toBeInTheDocument();
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('should render CardDescription with custom className', () => {
    render(<CardDescription className="custom-desc">Custom description</CardDescription>);
    
    const description = screen.getByText('Custom description');
    expect(description).toHaveClass('custom-desc');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardDescription ref={ref}>Ref description</CardDescription>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardContent Component', () => {
  it('should render CardContent with default props', () => {
    render(<CardContent>Card content</CardContent>);
    
    const content = screen.getByText('Card content');
    expect(content).toBeInTheDocument();
    expect(content).toHaveClass('p-6', 'pt-0');
  });

  it('should render CardContent with custom className', () => {
    render(<CardContent className="custom-content">Custom content</CardContent>);
    
    const content = screen.getByText('Custom content');
    expect(content).toHaveClass('custom-content');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardContent ref={ref}>Ref content</CardContent>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('CardFooter Component', () => {
  it('should render CardFooter with default props', () => {
    render(<CardFooter>Card footer</CardFooter>);
    
    const footer = screen.getByText('Card footer');
    expect(footer).toBeInTheDocument();
    expect(footer).toHaveClass('flex', 'items-center', 'p-6', 'pt-0');
  });

  it('should render CardFooter with custom className', () => {
    render(<CardFooter className="custom-footer">Custom footer</CardFooter>);
    
    const footer = screen.getByText('Custom footer');
    expect(footer).toHaveClass('custom-footer');
  });

  it('should forward ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(<CardFooter ref={ref}>Ref footer</CardFooter>);
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });
});

describe('Card Composition', () => {
  it('should render a complete card with all components', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Test content</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );
    
    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test content')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('should handle nested card components with custom styling', () => {
    render(
      <Card className="outer-card">
        <CardHeader className="custom-header">
          <CardTitle className="custom-title">Nested Title</CardTitle>
        </CardHeader>
        <CardContent className="custom-content">
          <Card className="inner-card">
            <CardContent>Inner content</CardContent>
          </Card>
        </CardContent>
      </Card>
    );
    
    const outerCard = screen.getByText('Nested Title').closest('.outer-card');
    const innerCard = screen.getByText('Inner content').closest('.inner-card');
    
    expect(outerCard).toBeInTheDocument();
    expect(innerCard).toBeInTheDocument();
    expect(outerCard).toHaveClass('outer-card');
    expect(innerCard).toHaveClass('inner-card');
  });

  it('should handle card with only header and content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Header Only</CardTitle>
        </CardHeader>
        <CardContent>Content only</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Header Only')).toBeInTheDocument();
    expect(screen.getByText('Content only')).toBeInTheDocument();
    expect(screen.queryByRole('button')).not.toBeInTheDocument(); // No footer
  });

  it('should handle card with only content', () => {
    render(
      <Card>
        <CardContent>Just content</CardContent>
      </Card>
    );
    
    expect(screen.getByText('Just content')).toBeInTheDocument();
    expect(screen.queryByText('Header')).not.toBeInTheDocument();
    expect(screen.queryByText('Footer')).not.toBeInTheDocument();
  });
}); 
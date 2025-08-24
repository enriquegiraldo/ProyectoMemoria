import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import LazyImage, { MemoryImage, AvatarImage, GalleryImage } from '../LazyImage';

// Mock de IntersectionObserver
const mockIntersectionObserver = vi.fn();
mockIntersectionObserver.mockReturnValue({
  observe: () => null,
  unobserve: () => null,
  disconnect: () => null,
});
window.IntersectionObserver = mockIntersectionObserver;

describe('LazyImage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders with placeholder initially', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );
    
    const img = screen.getByAltText('Test image');
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', '/placeholder-image.jpg');
  });

  it('loads image when in view', async () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simular que la imagen entra en vista
    const observerCallback = mockIntersectionObserver.mock.calls[0][0];
    observerCallback([{ isIntersecting: true }]);

    await waitFor(() => {
      expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
    });
  });

  it('handles image load success', async () => {
    const onLoad = vi.fn();
    
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        onLoad={onLoad}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simular carga exitosa
    fireEvent.load(img);

    await waitFor(() => {
      expect(onLoad).toHaveBeenCalled();
    });
  });

  it('handles image load error', async () => {
    const onError = vi.fn();
    
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        fallback="/fallback.jpg"
        onError={onError}
      />
    );

    const img = screen.getByAltText('Test image');
    
    // Simular error de carga
    fireEvent.error(img);

    await waitFor(() => {
      expect(img).toHaveAttribute('src', '/fallback.jpg');
    });
  });

  it('optimizes Cloudinary URLs', () => {
    render(
      <LazyImage
        src="https://res.cloudinary.com/demo/image/upload/v123/sample.jpg"
        alt="Cloudinary image"
        width={800}
        height={600}
        quality={85}
      />
    );

    const img = screen.getByAltText('Cloudinary image');
    expect(img).toHaveAttribute(
      'src',
      'https://res.cloudinary.com/demo/image/upload/f_auto,q_auto,w_800,h_600,q_85/sample.jpg'
    );
  });

  it('applies custom className', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        className="custom-class"
      />
    );

    const container = screen.getByAltText('Test image').parentElement;
    expect(container).toHaveClass('custom-class');
  });

  it('renders with priority loading', () => {
    render(
      <LazyImage
        src="https://example.com/image.jpg"
        alt="Test image"
        priority={true}
      />
    );

    const img = screen.getByAltText('Test image');
    expect(img).toHaveAttribute('loading', 'eager');
    expect(img).toHaveAttribute('src', 'https://example.com/image.jpg');
  });
});

describe('MemoryImage', () => {
  it('renders with correct aspect ratio and dimensions', () => {
    render(
      <MemoryImage
        src="https://example.com/memory.jpg"
        alt="Memory image"
      />
    );

    const img = screen.getByAltText('Memory image');
    const container = img.parentElement;
    
    expect(container).toHaveClass('aspect-video');
    expect(img).toHaveAttribute('src', 'https://example.com/memory.jpg');
  });

  it('applies custom className', () => {
    render(
      <MemoryImage
        src="https://example.com/memory.jpg"
        alt="Memory image"
        className="custom-class"
      />
    );

    const container = screen.getByAltText('Memory image').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

describe('AvatarImage', () => {
  it('renders with default size', () => {
    render(
      <AvatarImage
        src="https://example.com/avatar.jpg"
        alt="User avatar"
      />
    );

    const img = screen.getByAltText('User avatar');
    const container = img.parentElement;
    
    expect(container).toHaveClass('w-12', 'h-12', 'rounded-full');
  });

  it('renders with small size', () => {
    render(
      <AvatarImage
        src="https://example.com/avatar.jpg"
        alt="User avatar"
        size="sm"
      />
    );

    const img = screen.getByAltText('User avatar');
    const container = img.parentElement;
    
    expect(container).toHaveClass('w-8', 'h-8', 'rounded-full');
  });

  it('renders with large size', () => {
    render(
      <AvatarImage
        src="https://example.com/avatar.jpg"
        alt="User avatar"
        size="lg"
      />
    );

    const img = screen.getByAltText('User avatar');
    const container = img.parentElement;
    
    expect(container).toHaveClass('w-16', 'h-16', 'rounded-full');
  });

  it('applies custom className', () => {
    render(
      <AvatarImage
        src="https://example.com/avatar.jpg"
        alt="User avatar"
        className="custom-class"
      />
    );

    const container = screen.getByAltText('User avatar').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

describe('GalleryImage', () => {
  it('renders with correct styling', () => {
    render(
      <GalleryImage
        src="https://example.com/gallery.jpg"
        alt="Gallery image"
      />
    );

    const img = screen.getByAltText('Gallery image');
    const container = img.parentElement;
    
    expect(container).toHaveClass('cursor-pointer', 'group');
  });

  it('handles click events', () => {
    const onClick = vi.fn();
    
    render(
      <GalleryImage
        src="https://example.com/gallery.jpg"
        alt="Gallery image"
        onClick={onClick}
      />
    );

    const container = screen.getByAltText('Gallery image').parentElement;
    fireEvent.click(container!);

    expect(onClick).toHaveBeenCalled();
  });

  it('applies custom className', () => {
    render(
      <GalleryImage
        src="https://example.com/gallery.jpg"
        alt="Gallery image"
        className="custom-class"
      />
    );

    const container = screen.getByAltText('Gallery image').parentElement;
    expect(container).toHaveClass('custom-class');
  });
});

// Helper function para simular eventos
const fireEvent = {
  load: (element: HTMLElement) => {
    element.dispatchEvent(new Event('load', { bubbles: true }));
  },
  error: (element: HTMLElement) => {
    element.dispatchEvent(new Event('error', { bubbles: true }));
  },
  click: (element: HTMLElement) => {
    element.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  },
};

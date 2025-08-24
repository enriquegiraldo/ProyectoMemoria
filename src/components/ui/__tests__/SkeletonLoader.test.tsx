import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import SkeletonLoader, { 
  MemoryCardSkeleton, 
  CommentSkeleton, 
  UserProfileSkeleton,
  NotificationSkeleton 
} from '../SkeletonLoader';

describe('SkeletonLoader', () => {
  it('renders default skeleton', () => {
    render(<SkeletonLoader />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-gray-200', 'animate-pulse', 'rounded');
  });

  it('renders card skeleton', () => {
    render(<SkeletonLoader type="card" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('p-4', 'space-y-3');
  });

  it('renders text skeleton', () => {
    render(<SkeletonLoader type="text" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('space-y-2');
  });

  it('renders avatar skeleton', () => {
    render(<SkeletonLoader type="avatar" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('w-10', 'h-10', 'rounded-full');
  });

  it('renders button skeleton', () => {
    render(<SkeletonLoader type="button" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-10', 'rounded');
  });

  it('renders image skeleton', () => {
    render(<SkeletonLoader type="image" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('h-48', 'w-full');
  });

  it('renders multiple skeletons when count is specified', () => {
    render(<SkeletonLoader type="card" count={3} />);
    const skeletons = screen.getAllByRole('generic');
    expect(skeletons).toHaveLength(3);
  });

  it('applies custom className', () => {
    render(<SkeletonLoader className="custom-class" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });

  it('applies custom height and width', () => {
    render(<SkeletonLoader height="h-20" width="w-32" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('h-20', 'w-32');
  });
});

describe('MemoryCardSkeleton', () => {
  it('renders memory card skeleton', () => {
    render(<MemoryCardSkeleton />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-white', 'border', 'border-gray-200', 'rounded-lg');
  });

  it('applies custom className', () => {
    render(<MemoryCardSkeleton className="custom-class" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('CommentSkeleton', () => {
  it('renders comment skeleton', () => {
    render(<CommentSkeleton />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('flex', 'space-x-3');
  });

  it('applies custom className', () => {
    render(<CommentSkeleton className="custom-class" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('UserProfileSkeleton', () => {
  it('renders user profile skeleton', () => {
    render(<UserProfileSkeleton />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('space-y-4');
  });

  it('applies custom className', () => {
    render(<UserProfileSkeleton className="custom-class" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });
});

describe('NotificationSkeleton', () => {
  it('renders notification skeleton', () => {
    render(<NotificationSkeleton />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('flex', 'items-center', 'space-x-3', 'p-3');
  });

  it('applies custom className', () => {
    render(<NotificationSkeleton className="custom-class" />);
    const skeleton = screen.getByRole('generic');
    expect(skeleton).toHaveClass('custom-class');
  });
});

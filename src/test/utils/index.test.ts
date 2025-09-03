// src/test/utils/index.test.ts
import { describe, it, expect } from 'vitest';
import {
  formatDate,
  formatDistanceToNow,
  validateEmail,
  validatePassword,
  validateFile,
  truncate,
  slugify,
  capitalize,
  chunk,
  unique,
  groupBy,
  deepClone,
  pick,
  omit,
  scrollToElement,
  scrollToTop,
  getFromStorage,
  setToStorage,
  removeFromStorage,
  debounce,
  throttle,
  generateId,
  formatNumber,
  formatFileSize,
  sanitizeHtml,
  hexToRgb,
  rgbToHex,
  cn,
  delay,
  retry,
} from '../../utils';

describe('Date Utilities', () => {
  describe('formatDate', () => {
    it('should format date correctly', () => {
      const date = new Date('2023-12-25T10:30:00Z');
      const formatted = formatDate(date);
      expect(formatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    it('should handle string dates', () => {
      const dateString = '2023-12-25T10:30:00Z';
      const formatted = formatDate(dateString);
      expect(formatted).toMatch(/^\d{1,2}\/\d{1,2}\/\d{4}$/);
    });

    it('should handle invalid dates', () => {
      const invalidDate = 'invalid-date';
      const formatted = formatDate(invalidDate);
      expect(formatted).toBe('Invalid Date');
    });
  });

 
describe('formatDistanceToNow', () => {
  it('should format recent time correctly in Spanish', () => {
    const recent = new Date(Date.now() - 5 * 60 * 1000); // 5 minutos antes
    const formatted = formatDistanceToNow(recent);
    expect(formatted).toBe('hace 5 minutos');
  });

  it('should format hours correctly in Spanish', () => {
    const past = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 horas antes
    const formatted = formatDistanceToNow(past);
    expect(formatted).toBe('hace alrededor de 2 horas');
  });
});

describe('Validation Utilities', () => {
  describe('validateEmail', () => {
    it('should validate correct email addresses', () => {
      expect(validateEmail('test@example.com')).toBe(true);
      expect(validateEmail('user.name+tag@domain.co.uk')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(validateEmail('invalid-email')).toBe(false);
      expect(validateEmail('test@')).toBe(false);
      expect(validateEmail('@example.com')).toBe(false);
      expect(validateEmail('')).toBe(false);
    });
  });

  describe('validatePassword', () => {
    it('should validate strong passwords', () => {
      expect(validatePassword('StrongPass123!')).toBe(true);
      expect(validatePassword('MyP@ssw0rd')).toBe(true);
    });

    it('should reject weak passwords', () => {
      expect(validatePassword('weak')).toBe(false);
      expect(validatePassword('12345678')).toBe(false);
      expect(validatePassword('password')).toBe(false);
      expect(validatePassword('')).toBe(false);
    });
  });

  describe('validateFile', () => {
    it('should validate allowed file types', () => {
      const file = new File([''], 'test.jpg', { type: 'image/jpeg' });
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024; // 5MB

      expect(validateFile(file, allowedTypes, maxSize)).toBe(true);
    });

    it('should reject disallowed file types', () => {
      const file = new File([''], 'test.txt', { type: 'text/plain' });
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024;

      expect(validateFile(file, allowedTypes, maxSize)).toBe(false);
    });

    it('should reject oversized files', () => {
      const file = new File(['x'.repeat(10 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
      const allowedTypes = ['image/jpeg', 'image/png'];
      const maxSize = 5 * 1024 * 1024;

      expect(validateFile(file, allowedTypes, maxSize)).toBe(false);
    });
  });
});

describe('String Utilities', () => {
  describe('truncate', () => {
    it('should truncate long strings', () => {
      const longString = 'This is a very long string that needs to be truncated';
      const truncated = truncate(longString, 20);
      expect(truncated).toBe('This is a very long...');
    });

    it('should not truncate short strings', () => {
      const shortString = 'Short';
      const truncated = truncate(shortString, 20);
      expect(truncated).toBe('Short');
    });

    it('should handle custom suffix', () => {
      const longString = 'This is a very long string';
      const truncated = truncate(longString, 15, '***');
      expect(truncated).toBe('This is a very***');
    });
  });

  describe('slugify', () => {
    it('should create URL-friendly slugs', () => {
      expect(slugify('Hello World!')).toBe('hello-world');
      expect(slugify('Special Characters: @#$%')).toBe('special-characters');
      expect(slugify('Multiple   Spaces')).toBe('multiple-spaces');
    });

    it('should handle empty strings', () => {
      expect(slugify('')).toBe('');
    });
  });

  describe('capitalize', () => {
    it('should capitalize first letter', () => {
      expect(capitalize('hello')).toBe('Hello');
      expect(capitalize('world')).toBe('World');
    });

    it('should handle empty strings', () => {
      expect(capitalize('')).toBe('');
    });
  });
});

describe('Array Utilities', () => {
  describe('chunk', () => {
    it('should split array into chunks', () => {
      const array = [1, 2, 3, 4, 5, 6];
      const chunks = chunk(array, 2);
      expect(chunks).toEqual([[1, 2], [3, 4], [5, 6]]);
    });

    it('should handle uneven chunks', () => {
      const array = [1, 2, 3, 4, 5];
      const chunks = chunk(array, 2);
      expect(chunks).toEqual([[1, 2], [3, 4], [5]]);
    });
  });

  describe('unique', () => {
    it('should remove duplicates', () => {
      const array = [1, 2, 2, 3, 3, 4];
      const uniqueArray = unique(array);
      expect(uniqueArray).toEqual([1, 2, 3, 4]);
    });

    it('should handle objects with key', () => {
      const array = [
        { id: 1, name: 'John' },
        { id: 2, name: 'Jane' },
        { id: 1, name: 'John' },
      ];
      const uniqueArray = unique(array, 'id');
      expect(uniqueArray).toHaveLength(2);
    });
  });

  describe('groupBy', () => {
    it('should group array by key', () => {
      const array = [
        { category: 'A', value: 1 },
        { category: 'B', value: 2 },
        { category: 'A', value: 3 },
      ];
      const grouped = groupBy(array, 'category');
      expect(grouped).toEqual({
        A: [
          { category: 'A', value: 1 },
          { category: 'A', value: 3 },
        ],
        B: [{ category: 'B', value: 2 }],
      });
    });
  });
});

describe('Object Utilities', () => {
  describe('deepClone', () => {
    it('should create deep copy of object', () => {
      const original = { a: 1, b: { c: 2 } };
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.b).not.toBe(original.b);
    });
  });

  describe('pick', () => {
    it('should pick specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const picked = pick(obj, ['a', 'c']);
      expect(picked).toEqual({ a: 1, c: 3 });
    });
  });

  describe('omit', () => {
    it('should omit specified keys', () => {
      const obj = { a: 1, b: 2, c: 3 };
      const omitted = omit(obj, ['b']);
      expect(omitted).toEqual({ a: 1, c: 3 });
    });
  });
});

describe('DOM Utilities', () => {
  describe('scrollToElement', () => {
    it('should scroll to element', () => {
      const mockElement = {
        scrollIntoView: vi.fn(),
      };
      
      document.getElementById = vi.fn(() => mockElement as any);
      
      scrollToElement('test-id');
      expect(mockElement.scrollIntoView).toHaveBeenCalledWith({
        behavior: 'smooth',
        block: 'start',
      });
    });
  });

  describe('scrollToTop', () => {
    it('should scroll to top', () => {
      const scrollToSpy = vi.spyOn(window, 'scrollTo');
      
      scrollToTop();
      expect(scrollToSpy).toHaveBeenCalledWith({
        top: 0,
        behavior: 'smooth',
      });
    });
  });
});

describe('Storage Utilities', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe('getFromStorage', () => {
    it('should get value from storage', () => {
      localStorage.setItem('test-key', JSON.stringify({ data: 'test' }));
      const result = getFromStorage('test-key');
      expect(result).toEqual({ data: 'test' });
    });

    it('should return null for non-existent key', () => {
      const result = getFromStorage('non-existent');
      expect(result).toBeNull();
    });
  });

  describe('setToStorage', () => {
    it('should set value to storage', () => {
      const data = { test: 'value' };
      setToStorage('test-key', data);
      expect(localStorage.getItem('test-key')).toBe(JSON.stringify(data));
    });
  });

  describe('removeFromStorage', () => {
    it('should remove value from storage', () => {
      localStorage.setItem('test-key', 'test-value');
      removeFromStorage('test-key');
      expect(localStorage.getItem('test-key')).toBeNull();
    });
  });
});

describe('Performance Utilities', () => {
  describe('debounce', () => {
    it('should debounce function calls', async () => {
      const fn = vi.fn();
      const debouncedFn = debounce(fn, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      expect(fn).not.toHaveBeenCalled();

      await new Promise(resolve => setTimeout(resolve, 150));
      expect(fn).toHaveBeenCalledTimes(1);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', async () => {
      const fn = vi.fn();
      const throttledFn = throttle(fn, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(fn).toHaveBeenCalledTimes(1);

      await new Promise(resolve => setTimeout(resolve, 150));
      throttledFn();
      expect(fn).toHaveBeenCalledTimes(2);
    });
  });
});

describe('ID Generation', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(0);
    });
  });
});

describe('Formatting Utilities', () => {
  describe('formatNumber', () => {
    it('should format numbers correctly', () => {
      expect(formatNumber(1234)).toBe('1,234');
      expect(formatNumber(1234567)).toBe('1,234,567');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatFileSize', () => {
    it('should format file sizes correctly', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1024 * 1024)).toBe('1 MB');
      expect(formatFileSize(1024 * 1024 * 1024)).toBe('1 GB');
    });
  });
});

describe('HTML Utilities', () => {
  describe('sanitizeHtml', () => {
    it('should remove dangerous HTML', () => {
      const dangerousHtml = '<script>alert("xss")</script><p>Safe content</p>';
      const sanitized = sanitizeHtml(dangerousHtml);
      expect(sanitized).toBe('<p>Safe content</p>');
    });
  });
});

describe('Color Utilities', () => {
  describe('hexToRgb', () => {
    it('should convert hex to RGB', () => {
      expect(hexToRgb('#ff0000')).toEqual({ r: 255, g: 0, b: 0 });
      expect(hexToRgb('#00ff00')).toEqual({ r: 0, g: 255, b: 0 });
    });
  });

  describe('rgbToHex', () => {
    it('should convert RGB to hex', () => {
      expect(rgbToHex(255, 0, 0)).toBe('#ff0000');
      expect(rgbToHex(0, 255, 0)).toBe('#00ff00');
    });
  });
});

describe('Class Name Utilities', () => {
  describe('cn', () => {
    it('should combine class names', () => {
      expect(cn('class1', 'class2')).toBe('class1 class2');
      expect(cn('class1', false && 'class2', 'class3')).toBe('class1 class3');
      expect(cn('class1', null, undefined, 'class2')).toBe('class1 class2');
    });
  });
});

describe('Promise Utilities', () => {
  describe('delay', () => {
    it('should delay execution', async () => {
      const start = Date.now();
      await delay(100);
      const end = Date.now();
      expect(end - start).toBeGreaterThanOrEqual(100);
    });
  });

  describe('retry', () => {
    it('should retry failed operations', async () => {
      let attempts = 0;
      const failingFn = () => {
        attempts++;
        if (attempts < 3) throw new Error('Failed');
        return 'success';
      };

      const result = await retry(failingFn, 3, 10);
      expect(result).toBe('success');
      expect(attempts).toBe(3);
    });

    it('should throw after max attempts', async () => {
      const failingFn = () => {
        throw new Error('Always fails');
      };

      await expect(retry(failingFn, 3, 10)).rejects.toThrow('Always fails');
    });
  });
});

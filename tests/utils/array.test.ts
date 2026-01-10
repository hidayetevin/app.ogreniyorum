import { describe, it, expect } from 'vitest';
import { shuffle, createPairs, chunk, unique, groupBy } from '@utils/array';

describe('Array Utilities', () => {
    describe('shuffle', () => {
        it('should return an array of the same length', () => {
            const input = [1, 2, 3, 4, 5];
            const result = shuffle(input);
            expect(result).toHaveLength(input.length);
        });

        it('should contain all original elements', () => {
            const input = [1, 2, 3, 4, 5];
            const result = shuffle(input);
            expect(result.sort()).toEqual(input.sort());
        });

        it('should not modify the original array', () => {
            const input = [1, 2, 3, 4, 5];
            const original = [...input];
            shuffle(input);
            expect(input).toEqual(original);
        });

        it('should handle empty array', () => {
            const result = shuffle([]);
            expect(result).toEqual([]);
        });
    });

    describe('createPairs', () => {
        it('should duplicate each element', () => {
            const input = [1, 2, 3];
            const result = createPairs(input);
            expect(result).toEqual([1, 1, 2, 2, 3, 3]);
        });

        it('should handle empty array', () => {
            const result = createPairs([]);
            expect(result).toEqual([]);
        });

        it('should handle single element', () => {
            const result = createPairs(['a']);
            expect(result).toEqual(['a', 'a']);
        });
    });

    describe('chunk', () => {
        it('should split array into chunks', () => {
            const input = [1, 2, 3, 4, 5, 6];
            const result = chunk(input, 2);
            expect(result).toEqual([
                [1, 2],
                [3, 4],
                [5, 6],
            ]);
        });

        it('should handle uneven chunks', () => {
            const input = [1, 2, 3, 4, 5];
            const result = chunk(input, 2);
            expect(result).toEqual([[1, 2], [3, 4], [5]]);
        });

        it('should throw error for invalid chunk size', () => {
            expect(() => chunk([1, 2, 3], 0)).toThrow();
            expect(() => chunk([1, 2, 3], -1)).toThrow();
        });
    });

    describe('unique', () => {
        it('should remove duplicates', () => {
            const input = [1, 2, 2, 3, 3, 3, 4];
            const result = unique(input);
            expect(result).toEqual([1, 2, 3, 4]);
        });

        it('should handle array without duplicates', () => {
            const input = [1, 2, 3, 4];
            const result = unique(input);
            expect(result).toEqual(input);
        });

        it('should handle empty array', () => {
            const result = unique([]);
            expect(result).toEqual([]);
        });
    });

    describe('groupBy', () => {
        it('should group elements by key', () => {
            const input = [
                { type: 'fruit', name: 'apple' },
                { type: 'fruit', name: 'banana' },
                { type: 'vegetable', name: 'carrot' },
            ];
            const result = groupBy(input, (item) => item.type);
            expect(result).toEqual({
                fruit: [
                    { type: 'fruit', name: 'apple' },
                    { type: 'fruit', name: 'banana' },
                ],
                vegetable: [{ type: 'vegetable', name: 'carrot' }],
            });
        });

        it('should handle empty array', () => {
            const result = groupBy([], (item: { type: string }) => item.type);
            expect(result).toEqual({});
        });
    });
});

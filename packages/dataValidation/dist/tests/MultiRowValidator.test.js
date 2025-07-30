import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { MultiRowValidator } from '../components/MultiRowValidator';
describe('MultiRowValidator', () => {
    const sourceA = [
        { id: 'A1', name: 'Alice' },
        { id: 'B2', name: 'Bob' }
    ];
    const sourceB = [
        { id: 'A1', name: 'Alice Corp' },
        { id: 'B2', name: 'Bobby' }
    ];
    it('renders loading indicator when loading', () => {
        render(_jsx(MultiRowValidator, { sources: [sourceA, sourceB], idKey: "id", loading: true }));
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
    it('shows message when no matching records', () => {
        render(_jsx(MultiRowValidator, { sources: [[], []], idKey: "id" }));
        expect(screen.getByText(/no matching records found/i)).toBeInTheDocument();
    });
    it('renders multiple comparison tables', () => {
        render(_jsx(MultiRowValidator, { sources: [sourceA, sourceB], idKey: "id", threshold: 0.5 }));
        // Check both record IDs headings
        expect(screen.getByText('Record ID: A1')).toBeInTheDocument();
        expect(screen.getByText('Record ID: B2')).toBeInTheDocument();
        // Check some cell values for A1 and B2
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('Bobby')).toBeInTheDocument();
    });
});

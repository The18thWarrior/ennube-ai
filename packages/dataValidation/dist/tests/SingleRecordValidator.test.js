import { jsx as _jsx } from "react/jsx-runtime";
import { render, screen } from '@testing-library/react';
import { SingleRecordValidator } from '../components/SingleRecordValidator';
describe('SingleRecordValidator', () => {
    const data1 = [{ id: '1', name: 'Alice', address: '123 A St.' }];
    const data2 = [{ id: '1', name: 'Alice', address: '123 A Street' }];
    it('renders loading indicator when loading', () => {
        render(_jsx(SingleRecordValidator, { sources: [data1, data2], idKey: "id", loading: true }));
        expect(screen.getByRole('status')).toBeInTheDocument();
    });
    it('shows message when no matching record', () => {
        const empty1 = [];
        const empty2 = [];
        render(_jsx(SingleRecordValidator, { sources: [empty1, empty2], idKey: "id" }));
        expect(screen.getByText(/no matching record found/i)).toBeInTheDocument();
    });
    it('renders comparison table with correct values and status', () => {
        render(_jsx(SingleRecordValidator, { sources: [data1, data2], idKey: "id", threshold: 0.8 }));
        // Check property headers
        expect(screen.getByText('name')).toBeInTheDocument();
        expect(screen.getByText('address')).toBeInTheDocument();
        // Check values
        expect(screen.getByText('Alice')).toBeInTheDocument();
        expect(screen.getByText('123 A Street')).toBeInTheDocument();
        // Check badges: name -> SAME, address -> DIFFERENT
        expect(screen.getByText('SAME')).toBeInTheDocument();
        expect(screen.getByText('DIFFERENT')).toBeInTheDocument();
    });
});

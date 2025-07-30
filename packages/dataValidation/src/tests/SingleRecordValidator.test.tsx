// === SingleRecordValidator.test.tsx ===
// Created: 2025-07-19
// Purpose: Tests for SingleRecordValidator component

import React from 'react';
import { render, screen } from '@testing-library/react';
import { SingleRecordValidator } from '../components/SingleRecordValidator';

describe('SingleRecordValidator', () => {
  const data1 = [{ id: '1', name: 'Alice', address: '123 A St.' }];
  const data2 = [{ id: '1', name: 'Alice', address: '123 A Street' }];

  it('renders loading indicator when loading', () => {
    render(
      <SingleRecordValidator sources={[data1, data2]} idKey="id" loading />
    );
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('shows message when no matching record', () => {
    const empty1: any[] = [];
    const empty2: any[] = [];
    render(
      <SingleRecordValidator sources={[empty1, empty2]} idKey="id" />
    );
    expect(screen.getByText(/no matching record found/i)).toBeInTheDocument();
  });

  it('renders comparison table with correct values and status', () => {
    render(
      <SingleRecordValidator sources={[data1, data2]} idKey="id" threshold={0.8} />
    );
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

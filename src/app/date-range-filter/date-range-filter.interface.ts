export interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
  filterType: 'week' | 'month' | 'quarter' | '6months' | '1year' | 'custom' | null;
}

export interface QuickFilterOption {
  label: string;
  value: 'week' | 'month' | 'quarter' | '6months' | '1year';
}

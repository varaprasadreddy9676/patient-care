# Date Range Filter Component

A reusable Angular component that provides a date range filter with quick filter options. This component is built using Ionic and supports both standalone and module-based implementations.

## Features

- Date range selection with start and end dates
- Quick filter options (week, month, quarter)
- Custom title support
- Initial filter state configuration
- Animated expand/collapse
- Responsive design
- Moment.js integration for date handling

## Installation

1. Create the component folder structure:
```bash
src/
  app/
    shared/
      components/
        date-range-filter/
          date-range-filter.interface.ts
          date-range-filter.component.ts
          date-range-filter.component.html
          date-range-filter.component.scss
```

2. Dependencies:
```bash
npm install moment
```

## Usage

### Basic Implementation

```typescript
import { DateRangeFilterComponent } from '@shared/components/date-range-filter/date-range-filter.component';
import { DateRangeFilter } from '@shared/components/date-range-filter/date-range-filter.interface';

@Component({
  standalone: true,
  imports: [DateRangeFilterComponent],
  template: `
    <app-date-range-filter
      (filterChange)="onFilterChange($event)"
    ></app-date-range-filter>
  `
})
export class YourComponent {
  onFilterChange(filter: DateRangeFilter) {
    // Handle date filter changes
  }
}
```

### Advanced Implementation

```typescript
@Component({
  template: `
    <app-date-range-filter
      title="Custom Period"
      [initialFilter]="defaultFilter"
      [quickFilters]="['week', 'month']"
      (filterChange)="onFilterChange($event)"
    ></app-date-range-filter>
  `
})
```

## API Reference

### Inputs

| Input           | Type            | Default     | Description                    |
|----------------|-----------------|-------------|--------------------------------|
| title          | string          | 'Date Range'| Filter card title              |
| initialFilter  | DateRangeFilter | null        | Initial date range values      |
| quickFilters   | FilterPeriod[]  | ['week', 'month', 'quarter'] | Available quick filters |

### Outputs

| Output        | Type                    | Description                |
|--------------|-------------------------|----------------------------|
| filterChange | EventEmitter<DateRangeFilter> | Emits when filter changes |

### Interfaces

```typescript
interface DateRangeFilter {
  startDate: string | null;
  endDate: string | null;
  filterType: 'week' | 'month' | 'quarter' | 'custom' | null;
}

type FilterPeriod = 'week' | 'month' | 'quarter';
```

## Events

The component emits filter changes through the `filterChange` event whenever:
- A date is selected
- A quick filter is applied
- The filter is cleared
- The apply button is clicked

## Styling

The component uses Ionic's CSS variables for theming. Key variables used:
- `--ion-color-primary`
- `--ion-color-light`
- `--ion-color-medium`

## Examples

### With Initial Filter

```typescript
const defaultFilter: DateRangeFilter = {
  startDate: moment().subtract(1, 'month').format('YYYY-MM-DD'),
  endDate: moment().format('YYYY-MM-DD'),
  filterType: 'month'
};

@Component({
  template: `
    <app-date-range-filter
      [initialFilter]="defaultFilter"
      (filterChange)="onFilterChange($event)"
    ></app-date-range-filter>
  `
})
```

### Custom Quick Filters

```typescript
@Component({
  template: `
    <app-date-range-filter
      [quickFilters]="['week', 'month']"
      (filterChange)="onFilterChange($event)"
    ></app-date-range-filter>
  `
})
```

### With Service Integration

```typescript
@Component({
  template: `
    <app-date-range-filter
      (filterChange)="loadData($event)"
    ></app-date-range-filter>
  `
})
export class DataComponent {
  constructor(private dataService: DataService) {}

  loadData(filter: DateRangeFilter) {
    if (filter.startDate && filter.endDate) {
      this.dataService.getData(filter.startDate, filter.endDate)
        .subscribe(data => {
          // Handle data
        });
    }
  }
}
```

## Best Practices

1. Always handle null values for dates
2. Use the provided interfaces for type safety
3. Initialize with default values when needed
4. Consider user timezone when handling dates

## Notes

- Uses Moment.js for date manipulation
- Compatible with Ionic Angular applications
- Designed as a standalone component
- Follows Angular's recommended practices
- Supports reactive forms integration

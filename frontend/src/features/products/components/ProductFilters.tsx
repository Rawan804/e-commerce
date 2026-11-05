import { FormControl, Grid, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material'
import { PRODUCT_CATEGORIES, type ProductFilters, type ProductSortKey } from '../types/product.types'

interface ProductFiltersBarProps {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
}

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'featured', label: 'Featured' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'rating', label: 'Top rated' },
  { value: 'name', label: 'Name: A to Z' },
]

/**
 * Category + sort controls laid out side-by-side on small screens and up.
 * Both reset page to 1 in the parent (handled there via the change handler) so
 * results don't end up on a now-empty page.
 */
export default function ProductFiltersBar({ filters, onChange }: ProductFiltersBarProps) {
  function handleCategory(e: SelectChangeEvent<ProductFilters['category']>) {
    onChange({ ...filters, category: e.target.value as ProductFilters['category'] })
  }

  function handleSort(e: SelectChangeEvent<ProductSortKey>) {
    onChange({ ...filters, sort: e.target.value as ProductSortKey })
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="filter-category-label">Category</InputLabel>
          <Select
            labelId="filter-category-label"
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={handleCategory}
          >
            <MenuItem value="All">All categories</MenuItem>
            {PRODUCT_CATEGORIES.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth variant="outlined">
          <InputLabel id="filter-sort-label">Sort by</InputLabel>
          <Select
            labelId="filter-sort-label"
            id="filter-sort"
            label="Sort by"
            value={filters.sort}
            onChange={handleSort}
          >
            {SORT_OPTIONS.map((o) => (
              <MenuItem key={o.value} value={o.value}>
                {o.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
    </Grid>
  )
}

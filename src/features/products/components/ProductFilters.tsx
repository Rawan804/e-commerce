import { FormControl, Grid, InputLabel, MenuItem, Select, type SelectChangeEvent } from '@mui/material'
import type { ProductFilters, ProductSortKey } from '../types/product.types'
import { useBackendCategories } from '../hooks/useBackendCategories'

interface ProductFiltersBarProps {
  filters: ProductFilters
  onChange: (filters: ProductFilters) => void
}

const SORT_OPTIONS: { value: ProductSortKey; label: string }[] = [
  { value: 'featured', label: 'Newest first' },
  { value: 'price-asc', label: 'Price: low to high' },
  { value: 'price-desc', label: 'Price: high to low' },
  { value: 'name', label: 'Name: A to Z' },
]

export default function ProductFiltersBar({ filters, onChange }: ProductFiltersBarProps) {
  const { categories } = useBackendCategories()

  function handleCategory(e: SelectChangeEvent<string>) {
    onChange({ ...filters, category: e.target.value })
  }

  function handleSort(e: SelectChangeEvent<ProductSortKey>) {
    onChange({ ...filters, sort: e.target.value as ProductSortKey })
  }

  return (
    <Grid container spacing={2}>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth variant="outlined" size="small">
          <InputLabel id="filter-category-label">Category</InputLabel>
          <Select
            labelId="filter-category-label"
            id="filter-category"
            label="Category"
            value={filters.category}
            onChange={handleCategory}
          >
            <MenuItem value="All">All categories</MenuItem>
            {categories.map((c) => (
              <MenuItem key={c} value={c}>
                {c}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Grid>
      <Grid size={{ xs: 12, sm: 6 }}>
        <FormControl fullWidth variant="outlined" size="small">
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

import { Pagination, Box, Typography } from '@mui/material'

interface ProductPaginationProps {
  page: number
  totalPages: number
  total: number
  perPage: number
  onChange: (page: number) => void
}

/** Footer pagination with a results summary line. */
export default function ProductPagination({
  page,
  totalPages,
  total,
  perPage,
  onChange,
}: ProductPaginationProps) {
  if (total === 0) return null

  const from = (page - 1) * perPage + 1
  const to = Math.min(page * perPage, total)

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: { xs: 'column', sm: 'row' },
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2,
        mt: 4,
      }}
    >
      <Typography variant="body2" color="text.secondary">
        Showing {from}–{to} of {total} products
      </Typography>
      <Pagination
        page={page}
        count={totalPages}
        onChange={(_, p) => onChange(p)}
        color="primary"
        shape="rounded"
        siblingCount={1}
        // Keep the control from overflowing on very small screens
        sx={{ '& .MuiPagination-ul': { flexWrap: 'wrap', justifyContent: 'center' } }}
      />
    </Box>
  )
}

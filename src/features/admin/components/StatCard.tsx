import { Box, Card, CardContent, Typography } from '@mui/material'
import type { SvgIconComponent } from '@mui/icons-material'

interface StatCardProps {
  label: string
  value: string | number
  icon: SvgIconComponent
  color?: string
  sub?: string
}

export default function StatCard({ label, value, icon: Icon, color = '#C4A7D7', sub }: StatCardProps) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'flex-start', gap: 2 }}>
        <Box
          sx={{
            width: 48,
            height: 48,
            borderRadius: 2,
            bgcolor: `${color}22`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          <Icon />
        </Box>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700, lineHeight: 1.1 }}>
            {value}
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
            {label}
          </Typography>
          {sub && (
            <Typography variant="caption" color="text.disabled">
              {sub}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  )
}

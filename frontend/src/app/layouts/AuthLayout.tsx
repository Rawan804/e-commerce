import { Box, Container, Paper } from '@mui/material'
import { Outlet } from 'react-router-dom'
export default function AuthLayout() {
  return (
    <Box
      component="main"
      id="main-content"
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        bgcolor: 'background.default',
        px: 2,
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={0}
          variant="outlined"
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 1.5,
            bgcolor: 'background.paper',
            borderColor: 'divider',
          }}
        >
          <Outlet />
        </Paper>
      </Container>
    </Box>
  )
}

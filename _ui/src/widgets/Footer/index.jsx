import { Box, Container, Typography, Link, Stack } from '@mui/material';

function Footer() {
  return (
    <Box
      component="footer"
      sx={{
        py: 3,
        px: 2,
        mt: 'auto',
        backgroundColor: (theme) => theme.palette.grey[900]
      }}
    >
      <Container maxWidth="lg">
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={2}
          justifyContent="space-between"
          alignItems="center"
        >
          <Typography variant="body2" color="white">
            © {new Date().getFullYear()} NOORIBANK. All rights reserved.
          </Typography>

          <Stack
            direction="row"
            spacing={3}
            sx={{ color: 'white' }}
          >
            <Link
              href="#"
              color="inherit"
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://docs.nooribank.com', '_blank');
              }}
            >
              Documentation
            </Link>
            <Link
              href="#"
              color="inherit"
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                window.open('https://github.com/nooribank', '_blank');
              }}
            >
              GitHub
            </Link>
            <Link
              href="#"
              color="inherit"
              underline="hover"
              onClick={(e) => {
                e.preventDefault();
                window.location.href = 'mailto:support@nooribank.com';
              }}
            >
              Support
            </Link>
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default Footer;

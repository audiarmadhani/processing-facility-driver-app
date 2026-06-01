'use client';
import * as React from 'react';
import { useRouter } from 'next/navigation';
import Link from '@mui/material/Link';
import { Alert, Button, TextField, Typography, Box, Avatar } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';

export default function SignUpPage() {
  const [formData, setFormData] = React.useState({
    email: '',
    name: '',
    password: '',
  });
  const [error, setError] = React.useState('');
  const [success, setSuccess] = React.useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    try {
      const response = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, role: 'driver' }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          router.push('/auth/signin');
        }, 2000);
      } else {
        const { message } = await response.json();
        setError(message || 'Failed to register.');
      }
    } catch {
      setError('An unexpected error occurred.');
    }
  };

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#000000',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: 4,
          borderRadius: 2,
          boxShadow: 3,
          border: '1px solid lightgrey',
          backgroundColor: 'rgba(8, 9, 21, 0.5)',
        }}
      >
        <Avatar sx={{ bgcolor: 'primary.main', mb: 2 }}>
          <PersonIcon />
        </Avatar>
        <Typography component="h1" variant="h5" sx={{ mb: 1 }}>
          Cherry Pickup Driver Sign Up
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <Link href="/auth/signin">Back to sign in</Link>
        </Typography>
        {error && <Alert severity="error" sx={{ width: '100%', mb: 1 }}>{error}</Alert>}
        {success && (
          <Alert severity="success" sx={{ width: '100%', mb: 1 }}>
            Account created successfully!
          </Alert>
        )}
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%', maxWidth: 400 }}>
          <TextField
            label="Name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <TextField
            label="Password"
            name="password"
            type="password"
            value={formData.password}
            onChange={handleChange}
            fullWidth
            margin="normal"
            required
          />
          <Button type="submit" fullWidth variant="contained" sx={{ mt: 2, minHeight: 48 }}>
            Sign Up
          </Button>
        </Box>
      </Box>
    </Box>
  );
}

'use client';

import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import {
  isIOSDevice,
  isStandalonePwa,
} from '@/lib/geo/location-permission';

function SiteHost() {
  if (typeof window === 'undefined') return null;
  const host = window.location.host;
  return (
    <Box
      component="code"
      sx={{
        display: 'inline-block',
        px: 1,
        py: 0.25,
        borderRadius: 1,
        bgcolor: 'action.hover',
        fontSize: '0.85rem',
      }}
    >
      {host}
    </Box>
  );
}

export default function GeolocationBlockedHelp() {
  if (!isIOSDevice()) return null;

  const standalone = isStandalonePwa();

  return (
    <Alert severity="warning" sx={{ textAlign: 'left' }}>
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" fontWeight={700}>
          Safari Location ON is not enough
        </Typography>
        <Typography variant="body2">
          iPhone keeps two separate controls: Safari may use GPS, and each website
          (or installed app) must be allowed on its own. Your site is{' '}
          <SiteHost />.
        </Typography>

        {standalone ? (
          <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
            <Typography component="li" variant="body2">
              Settings → <strong>Cherry Pickup</strong> → Location →{' '}
              <strong>While Using the App</strong>
            </Typography>
            <Typography component="li" variant="body2">
              Settings → Privacy &amp; Security → Location Services → ON
            </Typography>
            <Typography component="li" variant="body2">
              Force-quit Cherry Pickup (swipe up), reopen, tap Try GPS Again →{' '}
              <strong>Allow</strong>
            </Typography>
          </Stack>
        ) : (
          <Stack component="ol" spacing={0.75} sx={{ m: 0, pl: 2.5 }}>
            <Typography component="li" variant="body2">
              In Safari on this page, tap <strong>aA</strong> (left of the address
              bar) → <strong>Website Settings</strong> → <strong>Location</strong> →{' '}
              <strong>Allow</strong> (not Deny or Ask only)
            </Typography>
            <Typography component="li" variant="body2">
              If you tapped Don&apos;t Allow before, iPhone will not ask again until
              you change that Website Settings entry
            </Typography>
            <Typography component="li" variant="body2">
              Close every tab for <SiteHost />, force-quit Safari, reopen this link,
              tap Try GPS Again → <strong>Allow</strong>
            </Typography>
            <Typography component="li" variant="body2">
              Still stuck: Settings → Safari → Advanced → Website Data → find your
              site → Delete, then reload
            </Typography>
          </Stack>
        )}

        <Typography variant="caption" color="text.secondary">
          Private browsing, Screen Time restrictions, or a VPN can also block GPS.
        </Typography>
      </Stack>
    </Alert>
  );
}

'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Autocomplete from '@mui/material/Autocomplete';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useLiveQuery } from 'dexie-react-hooks';
import DriverFieldButton from '@/components/DriverFieldButton';
import DriverMobileCard from '@/components/DriverMobileCard';
import { getAllFarms, saveFarm, savePickupDraft } from '@/db/dexie';
import { refreshFarmsCache } from '@/lib/sync/sync-engine';
import { farmSchema, type FarmFormValues } from '@/lib/validation/pickup-schemas';
import type { FarmRecord } from '@/types';
import { useEffect } from 'react';

export default function FarmSelectPage() {
  const router = useRouter();
  const farms = useLiveQuery(() => getAllFarms(), [], []);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selected, setSelected] = useState<FarmRecord | null>(null);
  const [locationData, setLocationData] = useState<
    Array<{ kabupaten?: string; desa?: string }>
  >([]);

  useEffect(() => {
    void refreshFarmsCache();
  }, []);

  useEffect(() => {
    let active = true;
    const loadLocationData = async () => {
      try {
        const res = await fetch('/api/location', {
          cache: 'no-store',
        });
        if (!res.ok) return;
        const data = (await res.json()) as Array<{
          kabupaten?: string;
          desa?: string;
        }>;
        if (active) {
          setLocationData(Array.isArray(data) ? data : []);
        }
      } catch {
        if (active) {
          setLocationData([]);
        }
      }
    };
    void loadLocationData();
    return () => {
      active = false;
    };
  }, []);

  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FarmFormValues>({
    resolver: zodResolver(farmSchema),
    defaultValues: {
      farm_name: '',
      farmer_name: '',
      village: '',
      district: '',
    },
  });

  const startPickup = async (farm: FarmRecord) => {
    const localId = uuidv4();
    await savePickupDraft({
      localId,
      farmId: farm.local_only ? undefined : farm.id,
      farmSnapshot: {
        farm_name: farm.farm_name,
        farmer_name: farm.farmer_name,
        village: farm.village,
        district: farm.district,
      },
      sync_status: 'pending',
      created_at: new Date().toISOString(),
    });
    router.push(`/pickup/${localId}`);
  };

  const onSelectFarm = () => {
    if (selected) void startPickup(selected);
  };

  const selectedDistrict = watch('district');
  const districtOptions = useMemo(
    () =>
      [
        ...new Set(
          locationData
            .map((item) => item.kabupaten)
            .filter((value): value is string => Boolean(value))
        ),
      ].sort(),
    [locationData]
  );
  const villageOptions = useMemo(
    () =>
      !selectedDistrict
        ? []
        : [
            ...new Set(
              locationData
                .filter((item) => item.kabupaten === selectedDistrict)
                .map((item) => item.desa)
                .filter((value): value is string => Boolean(value))
            ),
          ].sort(),
    [locationData, selectedDistrict]
  );

  const onCreateFarm = handleSubmit(async (values) => {
    const localId = uuidv4();
    const farmRecord: FarmRecord = {
      id: localId,
      ...values,
      local_only: true,
      created_at: new Date().toISOString(),
    };

    if (navigator.onLine) {
      try {
        const res = await fetch('/api/farms', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(values),
          credentials: 'include',
          cache: 'no-store',
        });
        if (res.ok) {
          const created = await res.json();
          farmRecord.id = created.id;
          farmRecord.local_only = false;
        }
      } catch {
        // keep local_only
      }
    }

    await saveFarm(farmRecord);
    setDialogOpen(false);
    reset();
    void startPickup(farmRecord);
  });

  return (
    <Stack spacing={2}>
      <Typography variant="h6" fontWeight={700}>
        Select farm
      </Typography>

      <DriverMobileCard>
      <Autocomplete
        options={farms ?? []}
        getOptionLabel={(o) =>
          `${o.farm_name} — ${o.farmer_name} (${o.village})`
        }
        value={selected}
        onChange={(_, v) => setSelected(v)}
        renderInput={(params) => (
          <TextField {...params} label="Search farm" placeholder="Type to search" />
        )}
        noOptionsText="No farms — create one below"
      />
      </DriverMobileCard>

      <DriverFieldButton onClick={onSelectFarm} disabled={!selected}>
        Continue with selected farm
      </DriverFieldButton>

      <DriverFieldButton variant="outlined" onClick={() => setDialogOpen(true)}>
        Create new farm
      </DriverFieldButton>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>New Farm</DialogTitle>
        <form onSubmit={onCreateFarm}>
          <DialogContent>
            <Stack spacing={2}>
              <Controller
                name="farm_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Farm Name"
                    error={!!errors.farm_name}
                    helperText={errors.farm_name?.message}
                    fullWidth
                    required
                  />
                )}
              />
              <Controller
                name="farmer_name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Farmer Name"
                    error={!!errors.farmer_name}
                    helperText={errors.farmer_name?.message}
                    fullWidth
                    required
                  />
                )}
              />
              <Controller
                name="district"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={districtOptions}
                    value={field.value || null}
                    freeSolo
                    onChange={(_, value) => {
                      const nextDistrict = value ?? '';
                      field.onChange(String(nextDistrict));
                      setValue('village', '', { shouldValidate: true });
                    }}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') {
                        field.onChange(value);
                        setValue('village', '', { shouldValidate: true });
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="District"
                        error={!!errors.district}
                        helperText={
                          errors.district?.message ??
                          (districtOptions.length === 0
                            ? 'District list unavailable, type district manually.'
                            : '')
                        }
                        fullWidth
                        required
                      />
                    )}
                  />
                )}
              />
              <Controller
                name="village"
                control={control}
                render={({ field }) => (
                  <Autocomplete
                    options={villageOptions}
                    value={field.value || null}
                    freeSolo
                    onChange={(_, value) => {
                      field.onChange(value ? String(value) : '');
                    }}
                    disabled={!selectedDistrict}
                    onInputChange={(_, value, reason) => {
                      if (reason === 'input') {
                        field.onChange(value);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Village"
                        error={!!errors.village}
                        helperText={
                          errors.village?.message ??
                          (!selectedDistrict
                            ? 'Select district first'
                            : villageOptions.length === 0
                              ? 'No villages found for selected district'
                              : '')
                        }
                        fullWidth
                        required
                      />
                    )}
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained">
              Create & Start Pickup
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Stack>
  );
}

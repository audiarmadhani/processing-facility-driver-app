'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';
import Stepper from '@mui/material/Stepper';
import Step from '@mui/material/Step';
import StepLabel from '@mui/material/StepLabel';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Alert from '@mui/material/Alert';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import DriverFieldButton from '@/components/DriverFieldButton';
import { getPickupDraft, savePickupDraft } from '@/db/dexie';
import {
  GeoLocationError,
  getCurrentPosition,
} from '@/lib/geo/get-current-position';
import { compressImage } from '@/lib/media/compress-image';
import {
  calculateDistanceKm,
  calculateFuelLiters,
  calculateTimeAtFarmMinutes,
} from '@/lib/calculations/pickup-metrics';
import {
  COFFEE_SPECIES,
  ROAD_CONDITIONS,
  VEHICLES,
  getCoffeeVarieties,
} from '@/lib/constants/pickup-options';
import { pickupInfoSchema, type PickupInfoFormValues } from '@/lib/validation/pickup-schemas';
import type { PickupDraft } from '@/types';
import { syncPickupDraft } from '@/lib/sync/sync-engine';

const SignaturePad = dynamic(() => import('@/components/SignaturePad'), { ssr: false });

const STEPS = ['Arrival', 'Pickup Info', 'Verification', 'Complete'];

export default function PickupWorkflowPage() {
  const { localId } = useParams<{ localId: string }>();
  const router = useRouter();
  const [activeStep, setActiveStep] = useState(0);
  const [draft, setDraft] = useState<PickupDraft | null>(null);
  const [loading, setLoading] = useState(true);
  const [gpsError, setGpsError] = useState('');
  const [gpsLoading, setGpsLoading] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [completing, setCompleting] = useState(false);
  const farmPhotoRef = useRef<HTMLInputElement>(null);
  const pickupPhotoRef = useRef<HTMLInputElement>(null);

  const varieties = getCoffeeVarieties();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<PickupInfoFormValues>({
    resolver: zodResolver(pickupInfoSchema),
    defaultValues: {
      estimated_weight: undefined,
      species: 'Arabica',
      variety: varieties[0],
      road_condition: 'Good',
      vehicle_used: 'Pickup A',
      notes: '',
    },
  });

  const loadDraft = useCallback(async () => {
    const d = await getPickupDraft(localId);
    if (!d) {
      router.replace('/pickup/farm');
      return;
    }
    setDraft(d);
    if (d.departure_timestamp) setActiveStep(3);
    else if (d.signature_blob && d.pickup_photo_blob) setActiveStep(3);
    else if (d.estimated_weight) setActiveStep(2);
    else if (d.arrival_timestamp && d.farm_photo_blob) setActiveStep(1);
    setLoading(false);
  }, [localId, router]);

  useEffect(() => {
    void loadDraft();
  }, [loadDraft]);

  const updateDraft = async (partial: Partial<PickupDraft>) => {
    if (!draft) return;
    const next = { ...draft, ...partial };
    setDraft(next);
    await savePickupDraft(next);
  };

  const handleArrived = async () => {
    setGpsError('');
    setGpsLoading(true);
    try {
      const pos = await getCurrentPosition();
      await updateDraft({
        latitude: pos.latitude,
        longitude: pos.longitude,
        arrival_timestamp: new Date().toISOString(),
      });
    } catch (e) {
      const message =
        e instanceof GeoLocationError
          ? e.message
          : e instanceof Error
            ? e.message
            : 'GPS failed';
      setGpsError(message);
    } finally {
      setGpsLoading(false);
    }
  };

  const handleFarmPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = await compressImage(file);
    await updateDraft({ farm_photo_blob: blob });
    setActiveStep(1);
  };

  const onInfoSubmit = handleSubmit(async (values) => {
    await updateDraft({
      estimated_weight: values.estimated_weight,
      species: values.species,
      variety: values.variety,
      road_condition: values.road_condition,
      vehicle_used: values.vehicle_used,
      notes: values.notes,
    });
    setActiveStep(2);
  });

  const handlePickupPhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const blob = await compressImage(file);
    await updateDraft({ pickup_photo_blob: blob });
  };

  const handleSignature = async (blob: Blob) => {
    await updateDraft({ signature_blob: blob });
  };

  const canProceedVerification =
    draft?.signature_blob && draft?.pickup_photo_blob;

  const handleComplete = async () => {
    if (!draft?.latitude || !draft.longitude || !draft.arrival_timestamp) return;
    setCompleting(true);
    const departure = new Date().toISOString();
    const distance = calculateDistanceKm(draft.latitude, draft.longitude);
    const fuel =
      distance != null && draft.vehicle_used
        ? calculateFuelLiters(distance, draft.vehicle_used)
        : null;

    const updated: PickupDraft = {
      ...draft,
      departure_timestamp: departure,
      time_at_farm_minutes: calculateTimeAtFarmMinutes(
        draft.arrival_timestamp,
        departure
      ),
      distance_km: distance ?? undefined,
      estimated_fuel_liters: fuel ?? undefined,
      sync_status: 'pending',
    };
    await savePickupDraft(updated);
    setDraft(updated);
    setConfirmOpen(false);

    if (navigator.onLine) {
      await syncPickupDraft(localId);
    }
    setCompleting(false);
    router.push('/');
  };

  if (loading || !draft) {
    return (
      <Stack alignItems="center" py={4}>
        <CircularProgress />
      </Stack>
    );
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" fontWeight={600}>
        {draft.farmSnapshot.farm_name}
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {draft.farmSnapshot.farmer_name} · {draft.farmSnapshot.village}
      </Typography>

      <Stepper activeStep={activeStep} orientation="vertical">
        {STEPS.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {activeStep === 0 && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              {gpsError && (
                <Alert severity="error" onClose={() => setGpsError('')}>
                  {gpsError}
                </Alert>
              )}
              {!draft.arrival_timestamp && !gpsError && (
                <Typography variant="body2" color="text.secondary">
                  {gpsLoading
                    ? 'Getting GPS… may take up to 45 seconds. Stay outdoors if possible.'
                    : 'Tap Arrived at Farm, then tap Allow on the iPhone prompt. Safari’s Location setting alone is not enough — this app needs its own Allow.'}
                </Typography>
              )}
              <DriverFieldButton
                onClick={() => void handleArrived()}
                disabled={gpsLoading || !!draft.arrival_timestamp}
              >
                {gpsLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
                    <CircularProgress size={22} color="inherit" />
                    <span>Getting GPS…</span>
                  </Stack>
                ) : draft.arrival_timestamp ? (
                  'Arrived ✓'
                ) : gpsError ? (
                  'Try GPS Again'
                ) : (
                  'Arrived at Farm'
                )}
              </DriverFieldButton>
              {draft.arrival_timestamp && (
                <>
                  <Typography variant="caption" color="text.secondary">
                    GPS: {draft.latitude?.toFixed(5)}, {draft.longitude?.toFixed(5)}
                  </Typography>
                  <input
                    ref={farmPhotoRef}
                    type="file"
                    accept="image/*"
                    capture="environment"
                    hidden
                    onChange={handleFarmPhoto}
                  />
                  <DriverFieldButton
                    variant="outlined"
                    onClick={() => farmPhotoRef.current?.click()}
                  >
                    {draft.farm_photo_blob ? 'Retake Farm Photo' : 'Capture Farm Photo'}
                  </DriverFieldButton>
                  {draft.farm_photo_blob && (
                    <Alert severity="success">Farm photo saved</Alert>
                  )}
                </>
              )}
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeStep === 1 && (
        <Card>
          <CardContent>
            <form onSubmit={onInfoSubmit}>
              <Stack spacing={2}>
                <Controller
                  name="estimated_weight"
                  control={control}
                  render={({ field }) => (
                    <TextField
                      {...field}
                      label="Estimated Weight (kg)"
                      type="number"
                      inputMode="decimal"
                      fullWidth
                      required
                      error={!!errors.estimated_weight}
                      helperText={errors.estimated_weight?.message}
                    />
                  )}
                />
                <Controller
                  name="species"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Coffee Species" fullWidth required>
                      {COFFEE_SPECIES.map((s) => (
                        <MenuItem key={s} value={s}>
                          {s}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="variety"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Coffee Variety" fullWidth required>
                      {varieties.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="road_condition"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Road Condition" fullWidth required>
                      {ROAD_CONDITIONS.map((r) => (
                        <MenuItem key={r} value={r}>
                          {r}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="vehicle_used"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} select label="Vehicle Used" fullWidth required>
                      {VEHICLES.map((v) => (
                        <MenuItem key={v} value={v}>
                          {v}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
                <Controller
                  name="notes"
                  control={control}
                  render={({ field }) => (
                    <TextField {...field} label="Notes (optional)" multiline rows={2} fullWidth />
                  )}
                />
                <DriverFieldButton type="submit">Continue</DriverFieldButton>
              </Stack>
            </form>
          </CardContent>
        </Card>
      )}

      {activeStep === 2 && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="subtitle2">Farm owner signature</Typography>
              <SignaturePad onSave={handleSignature} />
              {draft.signature_blob && (
                <Alert severity="success">Signature saved</Alert>
              )}
              <input
                ref={pickupPhotoRef}
                type="file"
                accept="image/*"
                capture="environment"
                hidden
                onChange={handlePickupPhoto}
              />
              <DriverFieldButton
                variant="outlined"
                onClick={() => pickupPhotoRef.current?.click()}
              >
                {draft.pickup_photo_blob ? 'Retake Pickup Photo' : 'Capture Pickup Photo'}
              </DriverFieldButton>
              {draft.pickup_photo_blob && (
                <Alert severity="success">Pickup photo saved</Alert>
              )}
              <DriverFieldButton
                disabled={!canProceedVerification}
                onClick={() => setActiveStep(3)}
              >
                Continue
              </DriverFieldButton>
            </Stack>
          </CardContent>
        </Card>
      )}

      {activeStep === 3 && (
        <Card>
          <CardContent>
            <Stack spacing={2}>
              <Typography variant="body2">
                Weight: {draft.estimated_weight} kg · {draft.species} · {draft.variety}
              </Typography>
              <DriverFieldButton onClick={() => setConfirmOpen(true)}>
                Complete Pickup
              </DriverFieldButton>
            </Stack>
          </CardContent>
        </Card>
      )}

      <Dialog open={confirmOpen} onClose={() => !completing && setConfirmOpen(false)}>
        <DialogTitle>Complete pickup?</DialogTitle>
        <DialogContent>
          <Typography>
            This will record departure time and queue sync for{' '}
            <strong>{draft.farmSnapshot.farm_name}</strong>.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button disabled={completing} onClick={() => setConfirmOpen(false)}>
            Cancel
          </Button>
          <Button
            variant="contained"
            disabled={completing}
            onClick={() => void handleComplete()}
          >
            {completing ? 'Saving…' : 'Confirm'}
          </Button>
        </DialogActions>
      </Dialog>
    </Stack>
  );
}

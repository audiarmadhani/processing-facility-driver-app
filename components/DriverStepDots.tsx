'use client';

import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

interface DriverStepDotsProps {
  steps: string[];
  activeStep: number;
}

export default function DriverStepDots({ steps, activeStep }: DriverStepDotsProps) {
  return (
    <Box sx={{ mb: 2 }}>
      <Box
        sx={{
          display: 'flex',
          gap: 0.75,
          mb: 1,
        }}
      >
        {steps.map((_, index) => (
          <Box
            key={steps[index]}
            sx={{
              flex: 1,
              height: 4,
              borderRadius: 2,
              bgcolor:
                index <= activeStep ? 'primary.main' : 'action.selected',
              opacity: index <= activeStep ? 1 : 0.5,
              transition: 'background-color 0.2s',
            }}
          />
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" fontWeight={600}>
        Step {activeStep + 1} of {steps.length}: {steps[activeStep]}
      </Typography>
    </Box>
  );
}

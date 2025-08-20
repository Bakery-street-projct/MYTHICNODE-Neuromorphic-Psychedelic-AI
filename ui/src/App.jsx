import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import {
  AppBar,
  Toolbar,
  Typography,
  Container,
  Grid,
  Paper,
  Box,
  Alert,
  Snackbar
} from '@mui/material';
import io from 'socket.io-client';

import NeuralMonitor from './components/NeuralMonitor';
import BiosignalPlotter from './components/BiosignalPlotter';
import VisualCanvas from './components/VisualCanvas';
import ControlPanel from './components/ControlPanel';
import ConsentDialog from './components/ConsentDialog';
import SafetyMonitor from './components/SafetyMonitor';

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#f59e0b',
    },
    background: {
      default: '#0f0f23',
      paper: '#1a1a2e',
    },
  },
  typography: {
    fontFamily: '"Roboto Mono", "Monaco", monospace',
    h4: {
      fontWeight: 600,
    },
  },
});

const socket = io(process.env.REACT_APP_WEBSOCKET_URL || 'http://localhost:8000');

function App() {
  // State management
  const [neuralData, setNeuralData] = useState({
    firingRate: 0,
    spikeData: [],
    gridActivity: [],
    synchrony: 0,
    entropy: 0
  });

  const [biosignalData, setBiosignalData] = useState({
    eeg: { alpha: 0, beta: 0, theta: 0, gamma: 0 },
    heartRate: 70,
    heartRateVariability: 45,
    skinConductance: 0.5
  });

  const [visualData, setVisualData] = useState({
    imageUrl: null,
    latentVector: [],
    generationTime: 0
  });

  const [controlState, setControlState] = useState({
    isRunning: false,
    modulationLevel: 0.0,
    targetFiringRate: 0.5,
    stimulusIntensity: 0.5
  });

  const [consentGiven, setConsentGiven] = useState(false);
  const [safetyAlert, setSafetyAlert] = useState(null);
  const [connectionStatus, setConnectionStatus] = useState('disconnected');

  // Socket event handlers
  useEffect(() => {
    socket.on('connect', () => {
      console.log('Connected to server');
      setConnectionStatus('connected');
    });

    socket.on('disconnect', () => {
      console.log('Disconnected from server');
      setConnectionStatus('disconnected');
    });

    socket.on('neural_update', (data) => {
      setNeuralData({
        firingRate: data.mean_firing_rate || 0,
        spikeData: data.spike_times || [],
        gridActivity: data.grid_activity || [],
        synchrony: data.synchrony || 0,
        entropy: data.entropy || 0
      });
    });

    socket.on('biosignal_update', (data) => {
      setBiosignalData({
        eeg: data.eeg_bands || { alpha: 0, beta: 0, theta: 0, gamma: 0 },
        heartRate: data.heart_rate || 70,
        heartRateVariability: data.hrv || 45,
        skinConductance: data.gsr || 0.5
      });
    });

    socket.on('visual_update', (data) => {
      setVisualData({
        imageUrl: data.image || null,
        latentVector: data.latent_vector || [],
        generationTime: data.generation_time || 0
      });
    });

    socket.on('safety_alert', (data) => {
      setSafetyAlert({
        type: 'error',
        message: data.message,
        timestamp: new Date().toISOString()
      });
    });

    socket.on('control_update', (data) => {
      setControlState(prevState => ({
        ...prevState,
        ...data
      }));
    });

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('neural_update');
      socket.off('biosignal_update');
      socket.off('visual_update');
      socket.off('safety_alert');
      socket.off('control_update');
    };
  }, []);

  // Control functions
  const startExperiment = useCallback(() => {
    if (!consentGiven) {
      setSafetyAlert({
        type: 'warning',
        message: 'Please provide consent before starting the experiment.'
      });
      return;
    }

    socket.emit('start_experiment', {
      modulation_level: controlState.modulationLevel,
      target_firing_rate: controlState.targetFiringRate
    });

    setControlState(prevState => ({
      ...prevState,
      isRunning: true
    }));
  }, [consentGiven, controlState.modulationLevel, controlState.targetFiringRate]);

  const stopExperiment = useCallback(() => {
    socket.emit('stop_experiment');
    setControlState(prevState => ({
      ...prevState,
      isRunning: false
    }));
  }, []);

  const updateControlParameters = useCallback((params) => {
    setControlState(prevState => ({
      ...prevState,
      ...params
    }));

    socket.emit('update_control_params', params);
  }, []);

  const emergencyStop = useCallback(() => {
    socket.emit('emergency_stop');
    setControlState(prevState => ({
      ...prevState,
      isRunning: false,
      modulationLevel: 0.0
    }));
    setSafetyAlert({
      type: 'info',
      message: 'Emergency stop activated. All stimulation halted.'
    });
  }, []);

  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <Box sx={{ flexGrow: 1, minHeight: '100vh' }}>
        
        {/* App Bar */}
        <AppBar position="static" sx={{ background: 'linear-gradient(45deg, #6366f1 30%, #8b5cf6 90%)' }}>
          <Toolbar>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              🧠 Neuromorphic Psychedelic-AI Framework
            </Typography>
            <Box sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 2,
              color: connectionStatus === 'connected' ? '#10b981' : '#ef4444'
            }}>
              <Typography variant="body2">
                {connectionStatus === 'connected' ? '🟢 Connected' : '🔴 Disconnected'}
              </Typography>
            </Box>
          </Toolbar>
        </AppBar>

        <Container maxWidth="xl" sx={{ mt: 2, mb: 2 }}>
          <Grid container spacing={3}>
            
            {/* Neural Activity Monitor */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Neural Activity Monitor
                </Typography>
                <NeuralMonitor 
                  data={neuralData}
                  isRunning={controlState.isRunning}
                />
              </Paper>
            </Grid>

            {/* Biosignal Monitor */}
            <Grid item xs={12} lg={6}>
              <Paper sx={{ p: 2, height: 400 }}>
                <Typography variant="h6" gutterBottom>
                  Biosignal Monitor
                </Typography>
                <BiosignalPlotter 
                  data={biosignalData}
                  isRunning={controlState.isRunning}
                />
              </Paper>
            </Grid>

            {/* Visual Stimulus Viewer */}
            <Grid item xs={12} lg={8}>
              <Paper sx={{ p: 2, height: 500 }}>
                <Typography variant="h6" gutterBottom>
                  Kaleidoscopic Visual Stimulus
                </Typography>
                <VisualCanvas 
                  data={visualData}
                  isRunning={controlState.isRunning}
                />
              </Paper>
            </Grid>

            {/* Control Panel */}
            <Grid item xs={12} lg={4}>
              <Paper sx={{ p: 2, height: 500 }}>
                <Typography variant="h6" gutterBottom>
                  Control Panel
                </Typography>
                <ControlPanel
                  controlState={controlState}
                  onStart={startExperiment}
                  onStop={stopExperiment}
                  onUpdateParams={updateControlParameters}
                  onEmergencyStop={emergencyStop}
                  consentGiven={consentGiven}
                />
              </Paper>
            </Grid>

            {/* Safety Monitor */}
            <Grid item xs={12}>
              <SafetyMonitor
                neuralData={neuralData}
                biosignalData={biosignalData}
                controlState={controlState}
                onEmergencyStop={emergencyStop}
              />
            </Grid>

          </Grid>
        </Container>

        {/* Consent Dialog */}
        <ConsentDialog
          open={!consentGiven}
          onConsent={(granted) => setConsentGiven(granted)}
        />

        {/* Safety Alerts */}
        <Snackbar
          open={!!safetyAlert}
          autoHideDuration={6000}
          onClose={() => setSafetyAlert(null)}
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        >
          {safetyAlert && (
            <Alert 
              severity={safetyAlert.type} 
              onClose={() => setSafetyAlert(null)}
              sx={{ width: '100%' }}
            >
              {safetyAlert.message}
            </Alert>
          )}
        </Snackbar>

      </Box>
    </ThemeProvider>
  );
}

export default App;
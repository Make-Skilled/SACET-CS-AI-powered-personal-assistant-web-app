import React, { useState, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [transcriptions, setTranscriptions] = useState([]);
  const [status, setStatus] = useState('Click Start Recording to begin');
  const [error, setError] = useState(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const streamRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const animationFrameRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchTranscriptions();
    return () => {
      cleanup();
    };
  }, []);

  const cleanup = () => {
    stopMediaTracks();
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };

  const stopMediaTracks = () => {
    try {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      setRecordingTime(0);
    } catch (error) {
      console.error('Error stopping media tracks:', error);
    }
  };

  const fetchTranscriptions = async () => {
    try {
      setError(null);
      const response = await fetch('http://localhost:5000/api/transcriptions');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setTranscriptions(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error('Error fetching transcriptions:', error);
      setError('Failed to fetch transcriptions. Please make sure the server is running.');
      setStatus('Error: Server connection failed');
    }
  };

  const updateAudioLevel = () => {
    if (analyserRef.current && !error) {
      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      analyserRef.current.getByteFrequencyData(dataArray);
      
      const average = dataArray.reduce((acc, value) => acc + value, 0) / dataArray.length;
      setAudioLevel(Math.min(average * 1.5, 255));
      
      animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      cleanup();
      setCurrentTranscription(null);

      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1
        } 
      });
      
      streamRef.current = stream;

      audioContextRef.current = new (window.AudioContext || window.webkitAudioContext)();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      source.connect(analyserRef.current);
      
      updateAudioLevel();

      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        bitsPerSecond: 128000
      });
      
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        try {
          if (audioChunksRef.current.length > 0) {
            const audioBlob = new Blob(audioChunksRef.current, { 
              type: 'audio/webm;codecs=opus'
            });
            await sendAudioToServer(audioBlob);
          }
          audioChunksRef.current = [];
          cleanup();
          setIsRecording(false);
          setAudioLevel(0);
        } catch (error) {
          console.error('Error processing recording:', error);
          setError('Failed to process recording');
          setStatus('Error: Recording processing failed');
        }
      };

      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      mediaRecorderRef.current.start(1000);
      setIsRecording(true);
      setStatus('Recording... (Speak now)');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('Unable to access microphone. Please check your permissions.');
      setStatus('Error: Microphone access failed');
      setIsRecording(false);
      setAudioLevel(0);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      setStatus('Processing audio...');
      mediaRecorderRef.current.stop();
    } else {
      setError('No active recording to stop');
      setStatus('Error: No active recording');
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const sendAudioToServer = async (audioBlob) => {
    try {
      setError(null);
      setStatus('Processing audio...');
      const formData = new FormData();
      formData.append('audio', audioBlob, `recording-${Date.now()}.webm`);

      const response = await fetch('http://localhost:5000/api/transcribe', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      if (data.success && data.transcription) {
        setStatus('Transcription completed');
        setCurrentTranscription(data.transcription);
        setTranscriptions(prev => [data.transcription, ...prev]);
      } else {
        throw new Error(data.error || 'Transcription failed');
      }
    } catch (error) {
      console.error('Error sending audio to server:', error);
      setError('Failed to process audio. Please try again.');
      setStatus('Error: Transcription failed');
    }
  };

  const clearTranscriptions = async () => {
    try {
      setError(null);
      setStatus('Clearing transcriptions...');
      const response = await fetch('http://localhost:5000/api/transcriptions', {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      setTranscriptions([]);
      setCurrentTranscription(null);
      setStatus('All transcriptions cleared');
    } catch (error) {
      console.error('Error clearing transcriptions:', error);
      setError('Failed to clear transcriptions');
      setStatus('Error: Failed to clear transcriptions');
    }
  };

  return (
    <div className="app-container">
      <h1>Audio to Text Converter</h1>
      
      <div className="controls">
        <div className="recording-status">
          {isRecording && (
            <div className="recording-time">{formatTime(recordingTime)}</div>
          )}
          <div className="audio-visualizer" style={{ 
            transform: `scaleY(${audioLevel / 255})`,
            opacity: isRecording ? 1 : 0.3
          }}></div>
        </div>
        
        <button 
          onClick={isRecording ? stopRecording : startRecording}
          className={isRecording ? 'stop' : 'start'}
          disabled={error && !isRecording}
        >
          {isRecording ? 'Stop Recording' : 'Start Recording'}
        </button>
        <p className="status">{status}</p>
        {error && <p className="error">{error}</p>}
      </div>

      {currentTranscription && (
        <div className="current-transcription">
          <h2>Latest Recording</h2>
          <div className="transcription-card">
            <p>{currentTranscription.text}</p>
            <small>
              {new Date(currentTranscription.createdAt).toLocaleString()} 
              {currentTranscription.fileSize && ` - ${(currentTranscription.fileSize / 1024).toFixed(2)}KB`}
            </small>
          </div>
        </div>
      )}
      
      <div className="transcriptions">
        <div className="transcriptions-header">
          <h2>Previous Transcriptions</h2>
          {transcriptions.length > 0 && (
            <button 
              onClick={clearTranscriptions}
              className="clear-button"
            >
              Clear All
            </button>
          )}
        </div>
        {transcriptions.length > 0 ? (
          <ul>
            {transcriptions.map((item, index) => (
              item && (
                <li key={index}>
                  <p>{item.text}</p>
                  <small>
                    {new Date(item.createdAt).toLocaleString()} 
                    {item.fileSize && ` - ${(item.fileSize / 1024).toFixed(2)}KB`}
                  </small>
                </li>
              )
            ))}
          </ul>
        ) : (
          <p>No transcriptions yet</p>
        )}
      </div>
    </div>
  );
};

export default App;

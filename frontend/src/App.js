import React, { useState, useRef } from 'react';
import './App.css';

function App() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          channelCount: 1,
          sampleRate: 44100,
          sampleSize: 16,
          volume: 1.0,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true
        } 
      });
      
      mediaRecorderRef.current = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
        // Convert to WAV
        const audioContext = new (window.AudioContext || window.webkitAudioContext)({
          sampleRate: 44100
        });
        const fileReader = new FileReader();
        
        fileReader.onload = async function() {
          const arrayBuffer = this.result;
          
          try {
            const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
            const wavBlob = await convertToWav(audioBuffer);
            
            const formData = new FormData();
            formData.append('audio_data', wavBlob, 'recording.wav');

            const response = await fetch('http://localhost:5500/stop_recording', {
              method: 'POST',
              body: formData,
            });
            
            const data = await response.json();
            if (data.status === "Recording stopped") {
              setTranscribedText(data.text);
            } else {
              console.error('Error:', data.error);
              setTranscribedText('Error: ' + data.error);
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            setTranscribedText('Error processing audio: ' + error.message);
          }
        };
        
        fileReader.readAsArrayBuffer(audioBlob);
      };

      mediaRecorderRef.current.start(100); // Collect data every 100ms
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setTranscribedText('Error accessing microphone: ' + error.message);
    }
  };

  const convertToWav = async (audioBuffer) => {
    const numOfChannels = 1; // Force mono
    const sampleRate = 44100;
    const length = audioBuffer.length * 2; // 16-bit samples
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    // Write WAV header
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + length - 8, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true); // Mono
    view.setUint16(22, 1, true); // Num channels
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true); // Byte rate
    view.setUint16(32, 2, true); // Block align
    view.setUint16(34, 16, true); // Bits per sample
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length, true);

    // Convert to mono and write audio data
    const offset = 44;
    const channel = audioBuffer.getChannelData(0);
    for (let i = 0; i < channel.length; i++) {
      const sample = Math.max(-1, Math.min(1, channel[i]));
      view.setInt16(offset + (i * 2), sample * 0x7FFF, true);
    }

    return new Blob([buffer], { type: 'audio/wav' });
  };

  const writeUTFBytes = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
    }
  };

  return (
    <div className="App">
      <header className="App-header">
        <h1>Audio Recorder and Transcriber</h1>
        <div className="controls">
          <button 
            onClick={isRecording ? stopRecording : startRecording}
            className={isRecording ? 'stop' : 'start'}
          >
            {isRecording ? 'Stop Recording' : 'Start Recording'}
          </button>
        </div>
        <div className="transcription">
          {isRecording ? (
            <p>Recording... Speak clearly into your microphone</p>
          ) : transcribedText ? (
            <>
              <h2>Transcribed Text:</h2>
              <p>{transcribedText}</p>
            </>
          ) : (
            <p>Click 'Start Recording' and speak into your microphone</p>
          )}
        </div>
      </header>
    </div>
  );
}

export default App;

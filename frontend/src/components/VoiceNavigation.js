import React, { useState, useRef } from 'react';
import LoadingAnimation from './LoadingAnimation';

const VoiceNavigation = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcribedText, setTranscribedText] = useState('');
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  // Command mappings
  const commands = {
    'open youtube': 'https://youtube.com',
    'open facebook': 'https://facebook.com',
    'open twitter': 'https://twitter.com',
    'open instagram': 'https://instagram.com',
    'open linkedin': 'https://linkedin.com',
    'open github': 'https://github.com',
    'open netflix': 'https://netflix.com',
    'open amazon': 'https://amazon.com',
    'open spotify': 'https://spotify.com',
    'open gmail': 'https://gmail.com',
    'check weather': 'https://weather.com'
  };

  const handleNavigation = (text) => {
    const lowerText = text.toLowerCase();
    
    for (const [command, url] of Object.entries(commands)) {
      if (lowerText.includes(command)) {
        window.open(url, '_blank');
        return;
      }
    }

    const searchQuery = encodeURIComponent(text);
    window.open(`https://www.google.com/search?q=${searchQuery}`, '_blank');
  };

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
        setIsProcessing(true);
        const audioBlob = new Blob(chunksRef.current, { type: 'audio/webm' });
        
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
              handleNavigation(data.text);
            } else {
              console.error('Error:', data.error);
              setTranscribedText('Error: ' + data.error);
            }
          } catch (error) {
            console.error('Error processing audio:', error);
            setTranscribedText('Error processing audio: ' + error.message);
          } finally {
            setIsProcessing(false);
          }
        };
        
        fileReader.readAsArrayBuffer(audioBlob);
      };

      mediaRecorderRef.current.start(100);
      setIsRecording(true);
      setTranscribedText('');
    } catch (error) {
      console.error('Error accessing microphone:', error);
      setTranscribedText('Error accessing microphone: ' + error.message);
    }
  };

  const convertToWav = async (audioBuffer) => {
    const numOfChannels = 1;
    const sampleRate = 44100;
    const length = audioBuffer.length * 2;
    const buffer = new ArrayBuffer(44 + length);
    const view = new DataView(buffer);
    
    writeUTFBytes(view, 0, 'RIFF');
    view.setUint32(4, 44 + length - 8, true);
    writeUTFBytes(view, 8, 'WAVE');
    writeUTFBytes(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeUTFBytes(view, 36, 'data');
    view.setUint32(40, length, true);

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
    <section className="py-20 bg-white text-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold mb-8">Voice Command Assistant</h1>
          <div className="controls mb-8 space-y-4">
            <div className={`mic-icon mx-auto w-24 h-24 flex items-center justify-center rounded-full ${
              isRecording 
                ? 'bg-red-100 animate-pulse' 
                : 'bg-blue-50'
            }`}>
              <svg 
                xmlns="http://www.w3.org/2000/svg" 
                className={`h-12 w-12 transition-colors ${
                  isRecording ? 'text-red-500' : 'text-blue-600'
                }`}
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" 
                />
              </svg>
            </div>
            <button 
              onClick={isRecording ? stopRecording : startRecording}
              className={`px-8 py-3 rounded-full text-lg font-medium transition-all transform hover:scale-105 inline-flex items-center space-x-2 ${
                isRecording 
                  ? 'bg-red-500 hover:bg-red-600 text-white' 
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              <span>{isRecording ? 'Stop Recording' : 'Start Recording'}</span>
              {isRecording && (
                <span className="flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-3 w-3 rounded-full bg-red-200 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-400"></span>
                </span>
              )}
            </button>
          </div>
          <div className="transcription bg-gray-50 p-6 rounded-lg max-w-2xl mx-auto shadow-lg min-h-[200px] flex flex-col justify-center">
            {isRecording ? (
              <div className="space-y-2">
                <div className="flex justify-center space-x-1">
                  <div className="w-2 h-8 bg-blue-600 rounded-full animate-[bounce_1s_infinite_0ms]"></div>
                  <div className="w-2 h-8 bg-blue-600 rounded-full animate-[bounce_1s_infinite_100ms]"></div>
                  <div className="w-2 h-8 bg-blue-600 rounded-full animate-[bounce_1s_infinite_200ms]"></div>
                </div>
                <p className="text-blue-600 text-lg">Recording... Speak your command</p>
              </div>
            ) : isProcessing ? (
              <LoadingAnimation />
            ) : (
              <div className="result">
                <h3 className="text-xl font-semibold mb-3 text-blue-600">Transcribed Text:</h3>
                {transcribedText ? (
                  <p className="text-lg text-red-600 font-medium">{transcribedText}</p>
                ) : (
                  <p className="text-lg text-gray-500">Click "Start Recording" to begin</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default VoiceNavigation;

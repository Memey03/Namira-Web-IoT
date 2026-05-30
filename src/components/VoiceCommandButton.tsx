import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff } from 'lucide-react';
import { useMqtt } from '../mqttContext';

// Support for cross-browser web speech api
const windowAny = window as any;
const SpeechRecognition = windowAny.SpeechRecognition || windowAny.webkitSpeechRecognition;

export const VoiceCommandButton: React.FC = () => {
  const { publish, state } = useMqtt();
  const [isListening, setIsListening] = useState(false);
  const [supported, setSupported] = useState(true);
  const [transcript, setTranscript] = useState('');
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!SpeechRecognition) {
      setSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'id-ID'; // Indonesian as in ESP32 code

    recognition.onstart = () => {
      setIsListening(true);
      setTranscript('Mendengarkan...');
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const result = event.results[current][0].transcript;
      setTranscript(result);
      processCommand(result);
    };

    recognition.onerror = (event: any) => {
      console.error("Speech recognition error", event.error);
      setIsListening(false);
      setTranscript('Error: ' + event.error);
      setTimeout(() => setTranscript(''), 3000);
    };

    recognition.onend = () => {
      setIsListening(false);
      setTimeout(() => setTranscript(''), 3000);
    };

    recognitionRef.current = recognition;
  }, []);

  const toggleListen = () => {
    if (isListening) {
      recognitionRef.current?.stop();
    } else {
      recognitionRef.current?.start();
    }
  };

  const processCommand = (rawText: string) => {
    const text = rawText.toLowerCase();

    // Stop Variasi
    if (
      text.includes('variasi') &&
      (text.includes('stop') ||
        text.includes('mati') ||
        text.includes('henti') ||
        text.includes('off'))
    ) {
      publish('smarthome/variasi', 'STOP');
      for (let i = 1; i <= 4; i++) {
         publish(`smarthome/lampu${i}`, 'OFF');
      }
      return;
    }

    // Variasi
    if (text.includes('variasi')) {
      if (text.includes('1') || text.includes('satu')) {
        publish('smarthome/variasi', 'VARIASI1');
      } else if (text.includes('2') || text.includes('dua')) {
        publish('smarthome/variasi', 'VARIASI2');
      }
      return;
    }

    // Suhu
    if (text.includes('suhu') || text.includes('temperatur') || text.includes('panas')) {
       if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(`Suhu saat ini adalah ${state.temperature} derajat Celcius`);
          utterance.lang = 'id-ID';
          window.speechSynthesis.speak(utterance);
       }
       return;
    }

    // Kelembapan
    if (text.includes('kelembap') || text.includes('lembab') || text.includes('humid')) {
       if (window.speechSynthesis) {
          const utterance = new SpeechSynthesisUtterance(`Kelembapan saat ini adalah ${state.humidity} persen`);
          utterance.lang = 'id-ID';
          window.speechSynthesis.speak(utterance);
       }
       return;
    }

    // Nomor Lampu
    let lampu = -1;
    if (text.includes('lampu 1') || text.includes('satu')) lampu = 1;
    else if (text.includes('lampu 2') || text.includes('dua')) lampu = 2;
    else if (text.includes('lampu 3') || text.includes('tiga')) lampu = 3;
    else if (text.includes('lampu 4') || text.includes('empat')) lampu = 4;

    const isOn =
      text.includes('nyala') ||
      text.includes('hidup') ||
      text.includes(' on') ||
      text.includes('hidupkan');
    const isOff =
      text.includes('mati') ||
      text.includes('padam') ||
      text.includes(' off') ||
      text.includes('matikan');

    if (!isOn && !isOff) {
      // Perintah tidak dikenali
      return;
    }

    if (lampu === -1) {
      // Semua lampu
      publish('smarthome/variasi', 'STOP');
      for (let i = 1; i <= 4; i++) {
        publish(`smarthome/lampu${i}`, isOn ? 'ON' : 'OFF');
      }
    } else {
      publish('smarthome/variasi', 'STOP');
      publish(`smarthome/lampu${lampu}`, isOn ? 'ON' : 'OFF');
    }
  };

  if (!supported) return null;

  return (
    <div className="relative flex items-center justify-center">
      <button
        onClick={toggleListen}
        className={`p-2 rounded-full transition-all duration-300 ${isListening ? 'bg-pink-500 text-white shadow-lg shadow-pink-500/40 animate-pulse' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}
        title="Voice Command"
      >
        {isListening ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
      </button>
      {transcript && (
        <div className="absolute top-12 right-0 bg-white shadow-xl text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-slate-100 z-50 text-slate-700">
           {transcript}
        </div>
      )}
    </div>
  );
};

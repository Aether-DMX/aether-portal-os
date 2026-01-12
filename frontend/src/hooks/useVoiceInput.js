import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook for voice input using Web Speech API
 * Falls back gracefully when speech recognition is unavailable
 */
export default function useVoiceInput({ onTranscript, onPartialTranscript } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState(null);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');

  const recognitionRef = useRef(null);
  const timeoutRef = useRef(null);

  // Check for speech recognition support on mount
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognition);

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      recognition.maxAlternatives = 1;

      recognition.onstart = () => {
        setIsListening(true);
        setError(null);
        setTranscript('');
        setInterimTranscript('');
      };

      recognition.onresult = (event) => {
        let finalTranscript = '';
        let interimText = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimText += result[0].transcript;
          }
        }

        if (finalTranscript) {
          setTranscript((prev) => prev + finalTranscript);
          onTranscript?.(finalTranscript);
        }

        setInterimTranscript(interimText);
        onPartialTranscript?.(interimText);

        // Reset silence timeout on any speech
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }

        // Auto-stop after 3 seconds of silence following speech
        if (finalTranscript) {
          timeoutRef.current = setTimeout(() => {
            stopListening();
          }, 3000);
        }
      };

      recognition.onerror = (event) => {
        console.error('Speech recognition error:', event.error);

        // Handle specific errors
        switch (event.error) {
          case 'not-allowed':
            setError('Microphone access denied. Please allow microphone permissions.');
            break;
          case 'no-speech':
            setError('No speech detected. Please try again.');
            break;
          case 'network':
            setError('Network error. Speech recognition requires an internet connection.');
            break;
          case 'audio-capture':
            setError('No microphone found. Please connect a microphone.');
            break;
          default:
            setError(`Speech recognition error: ${event.error}`);
        }

        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
          timeoutRef.current = null;
        }
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [onTranscript, onPartialTranscript]);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) {
      setError('Speech recognition not supported in this browser.');
      return;
    }

    setError(null);
    setTranscript('');
    setInterimTranscript('');

    try {
      recognitionRef.current.start();
    } catch (e) {
      // Already running - restart it
      recognitionRef.current.stop();
      setTimeout(() => {
        try {
          recognitionRef.current.start();
        } catch (err) {
          setError('Failed to start speech recognition.');
        }
      }, 100);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, [isListening]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, startListening, stopListening]);

  // Get the full current transcript (final + interim)
  const getFullTranscript = useCallback(() => {
    return (transcript + ' ' + interimTranscript).trim();
  }, [transcript, interimTranscript]);

  return {
    isListening,
    isSupported,
    error,
    transcript,
    interimTranscript,
    startListening,
    stopListening,
    toggleListening,
    getFullTranscript,
  };
}

import React, { useState, useEffect } from 'react';
import { View, TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import * as Speech from 'expo-speech';
import { Ionicons } from '@expo/vector-icons';
import {
  ExpoSpeechRecognitionModule,
  useSpeechRecognitionEvent
} from "expo-speech-recognition";
import { askAi, AiAskRequest } from '../lib/api';

interface VoiceSearchProps {
  videoId: string;
  currentStep: number;
}

export default function VoiceSearch({ videoId, currentStep }: VoiceSearchProps) {
  const [isListening, setIsListening] = useState(false);
  const [resultText, setResultText] = useState("");
  const resultTextRef = React.useRef("");  // 클로저 stale 방지

  // 🚀 탭이 활성화되면 자동으로 마이크 켜기
  useEffect(() => {
    const autoStart = async () => {
      setTimeout(() => {
        handlePressMic();
      }, 1500);  // 모달 애니메이션 + 권한 처리 완료 대기
    };
    autoStart();

    return () => {
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setResultText(transcript);
      resultTextRef.current = transcript;  // ref에도 저장
    }
  });

  // 🏁 말이 끝나면 자동으로 AI에게 질문 전송
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    const text = resultTextRef.current;  // stale closure 방지
    if (text.trim().length > 0) {
      handleVoiceCommand(text);
      resultTextRef.current = "";
    }
  });

  useSpeechRecognitionEvent("error", (event) => {
    console.error("❌ 에러:", event.error);
    setIsListening(false);
  });

  const handlePressMic = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) return;

    setResultText("");
    setIsListening(true);

    ExpoSpeechRecognitionModule.start({
      lang: "ko-KR",
      interimResults: true,
      continuous: false,
    });
  };

  const handleVoiceCommand = async (text: string) => {
    try {
      const body: AiAskRequest = {
        video_id: videoId,
        question: text,
        current_step: currentStep
      };

      const response = await askAi(body);

      if (response && response.answer) {
        setResultText(response.answer);
        Speech.speak(response.answer, {
          language: 'ko-KR',
          pitch: 1.0,
          rate: 1.0
        });
      }
    } catch (err) {
      setResultText("서버와 연결이 원활하지 않아요.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        {isListening ? (resultText || "듣고 있어요! 말씀해 주세요") : (resultText || "질문을 기다리고 있어요")}
      </Text>

      <TouchableOpacity
        onPress={handlePressMic}
        style={[styles.btn, isListening && styles.btnActive]}
      >
        <Ionicons name={isListening ? "mic" : "mic-outline"} size={32} color="white" />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { alignItems: 'center', padding: 20, width: '100%' },
  text: { marginBottom: 20, fontSize: 16, color: '#3B4F4E', textAlign: 'center', fontWeight: '600', minHeight: 44 },
  btn: { width: 74, height: 74, borderRadius: 37, backgroundColor: '#54CDA4', justifyContent: 'center', alignItems: 'center', elevation: 5 },
  btnActive: { backgroundColor: '#FF6B6B', transform: [{ scale: 1.1 }] }
});
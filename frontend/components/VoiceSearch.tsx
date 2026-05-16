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

  // 🚀 [추가] 탭이 켜지자마자 자동으로 음성 인식 시작
  useEffect(() => {
    const autoStart = async () => {
      // 탭 애니메이션이나 전환 시간을 고려해 0.5초 뒤에 시작합니다.
      setTimeout(() => {
        handlePressMic();
      }, 500);
    };

    autoStart();

    // 컴포넌트가 닫힐 때 음성 인식을 확실히 종료하여 버그 방지
    return () => {
      ExpoSpeechRecognitionModule.stop();
    };
  }, []);

  // 🎙️ 음성 인식 실시간 결과 처리
  useSpeechRecognitionEvent("result", (event) => {
    const transcript = event.results[0]?.transcript;
    if (transcript) {
      setResultText(transcript);
      console.log("🗣️ 인식 중:", transcript);
    }
  });

  // 🏁 음성 인식이 끝났을 때 (말이 끝나면 자동으로 서버 전송)
  useSpeechRecognitionEvent("end", () => {
    setIsListening(false);
    console.log("🏁 음성 인식 종료");

    if (resultText.trim().length > 0) {
      handleVoiceCommand(resultText);
    }
  });

  // 에러 발생 시 처리
  useSpeechRecognitionEvent("error", (event) => {
    console.error("❌ 음성 인식 에러:", event.error, event.message);
    setIsListening(false);
  });

  // 1️⃣ 마이크 시작/중지 로직
  const handlePressMic = async () => {
    const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
    if (!result.granted) {
      Alert.alert("권한 필요", "음성 인식을 위해 마이크 권한이 필요합니다.");
      return;
    }

    setResultText("");
    setIsListening(true);

    // 음성 인식 시작
    ExpoSpeechRecognitionModule.start({
      lang: "ko-KR",
      interimResults: true,
      continuous: false, // 한 문장이 끝나면 자동으로 종료
    });
  };

  // 2️⃣ 백엔드 AI 통신 로직 (성윤님 API와 연결)
  const handleVoiceCommand = async (text: string) => {
    try {
      console.log(`📡 서버 요청: "${text}"`);
      const body: AiAskRequest = {
        video_id: videoId,
        question: text,
        current_step: currentStep
      };

      const response = await askAi(body);

      if (response && response.answer) {
        setResultText(response.answer);

        // AI의 답변을 음성으로 읽어줌 (TTS)
        Speech.speak(response.answer, {
          language: 'ko-KR',
          pitch: 1.0,
          rate: 1.0
        });
      }
    } catch (err) {
      console.error("❌ 서버 통신 에러:", err);
      setResultText("서버와 대화하는 중에 문제가 생겼어요.");
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
  text: {
    marginBottom: 20,
    fontSize: 16,
    color: '#3B4F4E',
    textAlign: 'center',
    fontWeight: '600',
    minHeight: 44,
  },
  btn: {
    width: 74,
    height: 74,
    borderRadius: 37,
    backgroundColor: '#54CDA4',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 2 }
  },
  btnActive: {
    backgroundColor: '#FF6B6B',
    transform: [{ scale: 1.1 }]
  }
});
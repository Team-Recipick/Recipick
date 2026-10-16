import React, { useEffect, useRef, useState } from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getRecipe, likeRecipe, unlikeRecipe } from '../lib/api';

const LIKED_KEY = 'liked_recipes';

async function readLikedIds(): Promise<string[]> {
    try {
        const raw = await AsyncStorage.getItem(LIKED_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

async function writeLikedIds(ids: string[]) {
    try {
        await AsyncStorage.setItem(LIKED_KEY, JSON.stringify(ids));
    } catch {
        // 로컬 저장 실패는 무시 (서버 기록이 기준)
    }
}

type Props = {
    videoId: string;
    style?: StyleProp<ViewStyle>;
};

// 레시피 좋아요 토글 버튼 (서버 /likes API + 기기 내 좋아요 목록 저장)
export default function LikeButton({ videoId, style }: Props) {
    const [liked, setLiked] = useState(false);
    const [count, setCount] = useState<number | null>(null);
    const busy = useRef(false);

    useEffect(() => {
        let alive = true;
        (async () => {
            const ids = await readLikedIds();
            if (alive) setLiked(ids.includes(videoId));
            try {
                const res = await getRecipe(videoId);
                const n = Number(res?.data?.like_count);
                if (alive && Number.isFinite(n)) setCount(n);
            } catch {
                // 좋아요 수 조회 실패 시 숫자 없이 하트만 표시
            }
        })();
        return () => {
            alive = false;
        };
    }, [videoId]);

    const toggle = async () => {
        if (busy.current || !videoId) return;
        busy.current = true;

        const next = !liked;
        const delta = next ? 1 : -1;
        setLiked(next);
        setCount((c) => (c === null ? c : Math.max(0, c + delta)));

        try {
            const res = next ? await likeRecipe(videoId) : await unlikeRecipe(videoId);
            // 서버에 이미 반영된 상태면 숫자가 변하지 않았으므로 낙관적 증감을 되돌린다
            if (res?.already_exists) {
                setCount((c) => (c === null ? c : Math.max(0, c - delta)));
            }
            const ids = await readLikedIds();
            await writeLikedIds(
                next ? Array.from(new Set([...ids, videoId])) : ids.filter((id) => id !== videoId)
            );
        } catch (e) {
            console.log('[LIKE ERROR]', e);
            setLiked(!next);
            setCount((c) => (c === null ? c : Math.max(0, c - delta)));
        } finally {
            busy.current = false;
        }
    };

    return (
        <TouchableOpacity onPress={toggle} activeOpacity={0.7} hitSlop={10} style={[styles.btn, style]}>
            <Ionicons
                name={liked ? 'heart' : 'heart-outline'}
                size={20}
                color={liked ? '#FF6B6B' : '#FFFFFF'}
            />
            {count !== null && count > 0 && <Text style={styles.count}>{count}</Text>}
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    btn: {
        height: 36,
        minWidth: 36,
        paddingHorizontal: 8,
        borderRadius: 18,
        backgroundColor: 'rgba(0,0,0,0.4)',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 4,
    },
    count: {
        color: '#FFFFFF',
        fontSize: 13,
        fontWeight: '800',
    },
});

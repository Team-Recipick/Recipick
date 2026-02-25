import React, { useMemo, useRef, useState } from 'react';
import { Animated, Dimensions, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';

const BRAND = '#54CDA4';
const BG = '#F3F6F6';
const WHITE = '#FFFFFF';
const BORDER = '#D9D9D9';
const TEXT = '#3B4F4E';

type TabKey = 'recipe' | 'ingredient';
type Step = { id: string; title: string; body: string };
type SubItem = { id: string; name: string; amount: string; price?: string };
type Ingredient = { id: string; name: string; amount: string; price?: string; subs?: SubItem[] };

const { width: SCREEN_W } = Dimensions.get('window');

const TOPBAR_H = 44;
const VIDEO_H = 210;
const META_H = 74;
const TAB_H = 52;

// bottom fixed CTA
const CTA_BTN_H = 45;
const CTA_GAP = 12;

const PAD_LR = 18;
const ING_GAP = 5;

const ING_RADIUS = 14;
const ING_BORDER_W = 1.5;

const SUB_ROW_H = 56; // ✅ 대체품목 넓게
const SUB_PAD_V = 12;

export default function CreateLink() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [tab, setTab] = useState<TabKey>('recipe');
  const [activeStepIdx, setActiveStepIdx] = useState(0);

  const [expandedIngId, setExpandedIngId] = useState<string | null>(null);
  const [selectedIngItem, setSelectedIngItem] = useState<Record<string, string>>({});

  // ✅ nativeDriver 끔: height/opacity 같이 안정적으로 제어하려고
  const scrollY = useRef(new Animated.Value(0)).current;

  // ✅ 제목/유튜버(meta)만 스크롤하면 사라지게
  const metaOpacity = scrollY.interpolate({
    inputRange: [0, 20, 60],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp',
  });

  const metaTranslateY = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [0, -20],
    extrapolate: 'clamp',
  });

  const metaH = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [META_H, 0],
    extrapolate: 'clamp',
  });

  const steps: Step[] = useMemo(
    () => [
      {
        id: 's1',
        title: 'STEP 1',
        body:
          '대파는 송송 썰 필요 없이 길게 반을 갈라준 뒤, 5cm 정도 길이로 큼직하게 썰어 준비합니다. 이 요리는 파 맛으로 먹는 제육볶음이기 때문에, 대파는 넉넉하게 준비해 주세요.',
      },
      { id: 's2', title: 'STEP 2', body: '청양고추는 매운맛을 살리기 위해 두껍게 어슷썰기로 큼직하게 썰어 준비합니다.' },
      { id: 's3', title: 'STEP 3', body: '고기를 볶다가 양념을 넣고 센불로 빠르게 마무리합니다.' },
      { id: 's4', title: 'STEP 4', body: '불을 줄여 한 번 더 볶아 양념이 잘 배도록 마무리합니다.' },
    ],
    []
  );

  const ingredients: Ingredient[] = useMemo(
    () => [
      {
        id: 'pork',
        name: '삼겹살',
        amount: '300g',
        price: '6,000원',
        subs: [
          { id: 'pork2', name: '앞다리살', amount: '300g', price: '5,500원' },
          { id: 'pork3', name: '목살', amount: '300g', price: '5,000원' },
        ],
      },
      {
        id: 'garlic',
        name: '통마늘',
        amount: '8알',
        price: '800원',
        subs: [{ id: 'garlic2', name: '다진마늘', amount: '1큰술', price: '600원' }],
      },
      { id: 'pepper', name: '청양고추', amount: '3개', price: '2,000원' },
      { id: 'greenonion', name: '대파', amount: '2대', price: '2,000원' },
      { id: 'water', name: '물', amount: '60g', price: '10원' },
      { id: 'soy', name: '진간장', amount: '3큰술', price: '100원' },
    ],
    []
  );

  const handleSelectIng = (ingId: string, itemId: string) => {
    setSelectedIngItem((prev) => {
      if (prev[ingId] === itemId) {
        const next = { ...prev };
        delete next[ingId];
        return next;
      }
      return { ...prev, [ingId]: itemId };
    });
  };
  const isSelected = (ingId: string, itemId: string) => selectedIngItem[ingId] === itemId;

  // ✅ ScrollView 아래 padding: 버튼 가리지 않게
  const contentBottomPad = CTA_BTN_H + CTA_GAP + Math.max(insets.bottom, 10) + 18;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      {/* ✅ 상단(영상 + 탭)은 고정 */}
      <View style={[styles.fixedTop, { paddingTop: insets.top }]}>
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} hitSlop={14} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color={TEXT} />
          </TouchableOpacity>
        </View>

        <View style={styles.videoWrap} pointerEvents="none">
          <Image
            source={{ uri: 'https://img.youtube.com/vi/fJEdS2kkxMg/hqdefault.jpg' }}
            style={styles.videoImg}
            resizeMode="cover"
          />
          <View style={styles.playOverlay}>
            <View style={styles.playCircle}>
              <Ionicons name="play" size={26} color="#fff" />
            </View>
          </View>
          <Text style={styles.youtubeBadge}>YouTube</Text>
        </View>

        {/* ✅ 레시피/재료 탭은 무조건 영상 밑에 "한 줄 고정" */}
        <View style={styles.tabsWrapFixed}>
          <TouchableOpacity activeOpacity={0.9} onPress={() => setTab('recipe')} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === 'recipe' && styles.tabTextActive]}>레시피</Text>
            <View style={[styles.tabLine, tab === 'recipe' && styles.tabLineActive]} />
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.9} onPress={() => setTab('ingredient')} style={styles.tabBtn}>
            <Text style={[styles.tabText, tab === 'ingredient' && styles.tabTextActive]}>재료</Text>
            <View style={[styles.tabLine, tab === 'ingredient' && styles.tabLineActive]} />
          </TouchableOpacity>
        </View>
      </View>

      {/* ✅ 스크롤 컨텐츠는 "탭 아래부터" 시작 */}
      <Animated.ScrollView
        style={{ flex: 1 }}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: TOPBAR_H + VIDEO_H + TAB_H, // ✅ 고정 헤더(영상+탭) 아래부터 시작
          paddingBottom: contentBottomPad,
        }}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { y: scrollY } } }], {
          useNativeDriver: false,
        })}
        scrollEventThrottle={16}
      >
        {/* ✅ meta(제목/유튜버)는 스크롤하면 사라짐 */}
        <Animated.View
          style={[
            styles.metaOuter,
            { height: metaH, opacity: metaOpacity, transform: [{ translateY: metaTranslateY }] },
          ]}
        >
          <View style={styles.metaWrap}>
            <Text style={styles.titleText} numberOfLines={2}>
              대파 듬뿍! 삼겹살로 만든 ‘대파 제육볶음’
            </Text>
            <View style={styles.channelRow}>
              <View style={styles.avatar} />
              <Text style={styles.channelText} numberOfLines={1}>
                백종원 PAIK JONG WON
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* content */}
        <View style={styles.contentWrap}>
          {tab === 'recipe' ? (
            <View style={{ paddingHorizontal: PAD_LR }}>
              {steps.map((s, idx) => {
                const active = idx === activeStepIdx;
                return (
                  <TouchableOpacity
                    key={s.id}
                    activeOpacity={0.92}
                    onPress={() => setActiveStepIdx(idx)}
                    style={[styles.stepCard, idx > 0 && { marginTop: 14 }]}
                  >
                    <Text style={[styles.stepTitle, active && { color: BRAND }]}>{s.title}</Text>
                    <Text style={styles.stepBody}>{s.body}</Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          ) : (
            <View>
              <Text style={styles.ingHint}>준비된 재료는 터치해 주세요!</Text>

              <View style={styles.ingListWrap}>
                {ingredients.map((ing) => {
                  const baseSelected = isSelected(ing.id, ing.id);
                  const expanded = expandedIngId === ing.id;

                  return (
                    <View key={ing.id} style={{ marginBottom: ING_GAP }}>
                      <View style={[styles.ingBox, baseSelected && styles.selectedBorder]}>
                        <TouchableOpacity activeOpacity={0.92} onPress={() => handleSelectIng(ing.id, ing.id)}>
                          <View style={styles.ingRow}>
                            <Text style={[styles.ingName, baseSelected && styles.selectedText]}>{ing.name}</Text>
                            <Text style={[styles.ingAmount, baseSelected && styles.selectedText]}>{ing.amount}</Text>
                            <Text style={[styles.ingPrice, baseSelected && styles.selectedText]}>{ing.price ?? ''}</Text>
                          </View>
                        </TouchableOpacity>

                        <TouchableOpacity
                          activeOpacity={0.85}
                          onPress={() => setExpandedIngId(expanded ? null : ing.id)}
                          hitSlop={10}
                          style={styles.subToggleBtn}
                        >
                          <Text style={styles.subToggleText}>대체품목</Text>
                          <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={14} color={TEXT} />
                        </TouchableOpacity>

                        {expanded && (ing.subs?.length ?? 0) > 0 && (
                          <View style={styles.subList}>
                            {ing.subs!.map((sub, i) => {
                              const sel = isSelected(ing.id, sub.id);
                              return (
                                <TouchableOpacity
                                  key={sub.id}
                                  activeOpacity={0.92}
                                  onPress={() => handleSelectIng(ing.id, sub.id)}
                                  style={[styles.subRowBtn, i > 0 && styles.subDivider]}
                                >
                                  <View style={styles.subRow}>
                                    <Text style={[styles.subName, sel && styles.selectedText]}>{sub.name}</Text>
                                    <Text style={[styles.subAmount, sel && styles.selectedText]}>{sub.amount}</Text>
                                    <Text style={[styles.subPrice, sel && styles.selectedText]}>{sub.price ?? ''}</Text>
                                  </View>
                                </TouchableOpacity>
                              );
                            })}
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
              </View>
            </View>
          )}
        </View>
      </Animated.ScrollView>

      {/* ✅ 하단 고정 CTA */}
      <View style={[styles.bottomCta, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <TouchableOpacity activeOpacity={0.9} style={styles.startBtn}>
          <Text style={styles.startText}>요리 시작</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: BG },

  // ✅ fixed video zone (영상 + 탭 고정)
  fixedTop: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: 0,
    zIndex: 1000,
    backgroundColor: WHITE,
  },
  topBar: {
    height: TOPBAR_H,
    backgroundColor: WHITE,
    justifyContent: 'center',
  },
  backBtn: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 6,
  },

  videoWrap: { width: SCREEN_W, height: VIDEO_H, backgroundColor: '#DDE6E6' },
  videoImg: { width: '100%', height: '100%' },
  playOverlay: { position: 'absolute', left: 0, right: 0, top: 0, bottom: 0, alignItems: 'center', justifyContent: 'center' },
  playCircle: { width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(0,0,0,0.45)', alignItems: 'center', justifyContent: 'center' },
  youtubeBadge: { position: 'absolute', right: 10, bottom: 8, fontWeight: '900', color: 'rgba(0,0,0,0.55)' },

  // ✅ tabs fixed under video
  tabsWrapFixed: {
    height: TAB_H,
    backgroundColor: WHITE,
    flexDirection: 'row',
    width: '100%',
    alignItems: 'flex-end',
  },
  tabBtn: {
    width: SCREEN_W / 2, // ✅ 반반 강제 (세로로 절대 안 내려감)
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 10,
  },
  tabText: { fontSize: 14, fontWeight: '900', color: TEXT, opacity: 0.55 },
  tabTextActive: { opacity: 1 },
  tabLine: {
    marginTop: 10,
    height: 2,
    width: '100%',
    backgroundColor: 'transparent',
  },
  tabLineActive: { backgroundColor: BRAND },

  // meta
  metaOuter: { backgroundColor: WHITE, overflow: 'hidden' },
  metaWrap: { paddingHorizontal: 18, paddingTop: 12, paddingBottom: 10 },
  titleText: { fontSize: 15, fontWeight: '900', color: TEXT, lineHeight: 20 },
  channelRow: { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  avatar: { width: 22, height: 22, borderRadius: 11, backgroundColor: '#DDE6E6' },
  channelText: { fontSize: 12, fontWeight: '800', color: TEXT, opacity: 0.9 },

  // content
  contentWrap: { backgroundColor: BG, paddingTop: 8 },

  stepCard: { backgroundColor: WHITE, borderRadius: 18, paddingHorizontal: 16, paddingVertical: 14 },
  stepTitle: { fontSize: 20, fontWeight: '900', color: TEXT, marginBottom: 8 },
  stepBody: { fontSize: 15, fontWeight: '700', color: TEXT, lineHeight: 20 },

  // bottom CTA fixed
  bottomCta: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    paddingTop: CTA_GAP,
    backgroundColor: 'transparent',
  },
  startBtn: {
    width: 208,
    height: CTA_BTN_H,
    borderRadius: 30,
    backgroundColor: BRAND,
    alignItems: 'center',
    justifyContent: 'center',
  },
  startText: { color: WHITE, fontSize: 16, fontWeight: '900' },

  // ingredient
  ingHint: {
    marginTop: 2,
    marginLeft: 30,
    fontSize: 10,
    fontWeight: '700',
    color: '#8A9B9A',
  },
  ingListWrap: { marginTop: 6, paddingHorizontal: 18, paddingBottom: 10 },

  ingBox: {
    width: '100%',
    borderRadius: ING_RADIUS,
    backgroundColor: WHITE,
    borderWidth: ING_BORDER_W,
    borderColor: BORDER,
    paddingHorizontal: 16,
    paddingVertical: 14,
    overflow: 'hidden',
  },
  ingRow: { flexDirection: 'row', alignItems: 'center' },
  ingName: { flex: 1, fontSize: 20, fontWeight: '900', color: TEXT },
  ingAmount: { width: 80, textAlign: 'right', fontSize: 16, fontWeight: '800', color: TEXT },
  ingPrice: { width: 90, textAlign: 'right', fontSize: 16, fontWeight: '900', color: TEXT },

  selectedText: { color: BRAND },
  selectedBorder: { borderColor: BRAND },

  subToggleBtn: { marginTop: 6, flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 2 },
  subToggleText: { fontSize: 10, fontWeight: '800', color: TEXT, opacity: 0.7 },

  subList: { marginTop: 10, borderTopWidth: 1, borderTopColor: BORDER },
  subRowBtn: { height: SUB_ROW_H, justifyContent: 'center', paddingVertical: SUB_PAD_V },
  subDivider: { borderTopWidth: 1, borderTopColor: BORDER },

  subRow: { flexDirection: 'row', alignItems: 'center' },
  subName: { flex: 1, fontSize: 14, fontWeight: '900', color: TEXT },
  subAmount: { width: 80, textAlign: 'right', fontSize: 14, fontWeight: '800', color: TEXT },
  subPrice: { width: 90, textAlign: 'right', fontSize: 14, fontWeight: '900', color: TEXT },
});
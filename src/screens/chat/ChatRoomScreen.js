import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Pressable,
  Image,
  Keyboard,
} from "react-native";
import { useHeaderHeight } from "@react-navigation/elements";
import { Audio } from "expo-av";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";



function clamp(n, min, max) {
  return Math.max(min, Math.min(max, n));
}

function makeWaveform(seedStr, count = 28) {
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) {
    seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;
  }

  const bars = [];
  for (let i = 0; i < count; i++) {
    seed = (seed * 1103515245 + 12345) >>> 0;
    const r = (seed % 1000) / 1000;
    const h = 0.25 + r * 0.75;
    bars.push(h);
  }
  return bars;
}




function pad2(n) {
  return String(n).padStart(2, "0");
}
function formatTime(date) {
  const d = new Date(date);
  const h = d.getHours();
  const m = d.getMinutes();
  const hour12 = ((h + 11) % 12) + 1;
  const ampm = h >= 12 ? "PM" : "AM";
  return `${hour12}:${pad2(m)} ${ampm}`;
}
function isSameDay(a, b) {
  const da = new Date(a);
  const db = new Date(b);
  return (
    da.getFullYear() === db.getFullYear() &&
    da.getMonth() === db.getMonth() &&
    da.getDate() === db.getDate()
  );
}
function msToClock(ms = 0) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${pad2(s)}`;
}
function isImageLike(mimeType, name) {
  const n = (name || "").toLowerCase();
  return (
    (mimeType || "").startsWith("image/") ||
    n.endsWith(".png") ||
    n.endsWith(".jpg") ||
    n.endsWith(".jpeg") ||
    n.endsWith(".webp") ||
    n.endsWith(".heic")
  );
}
function getQuickReplies(myRole) {
  const base = ["Assalam o Alaikum", "Thank you", "I’ll get back to you"];
  if (myRole === "doctor") {
    return [
      ...base,
      "Please share your reports / lab results.",
      "Any allergies or current medicines?",
      "Describe your symptoms and duration.",
      "Book a follow-up for tomorrow.",
      "Take rest and stay hydrated.",
    ];
  }
  if (myRole === "reception" || myRole === "receptionist") {
    return [
      ...base,
      "Your appointment is confirmed.",
      "Please share patient ID / CNIC.",
      "What time do you prefer?",
      "Kindly arrive 10 minutes early.",
      "Your token number is …",
    ];
  }
  return [
    ...base,
    "I want to confirm my appointment.",
    "What are the available slots today?",
    "Can I reschedule my appointment?",
    "I’m feeling unwell, can I consult?",
    "Where should I upload reports?",
  ];
}

export default function ChatRoomScreen({ route }) {



  const seekPlayback = async (ratio) => {
  try {
    if (!soundRef.current) return;
    const dur = playDurMs || 0;
    if (!dur) return;
    const nextPos = Math.floor(clamp(ratio, 0, 1) * dur);
    await soundRef.current.setPositionAsync(nextPos);
  } catch {}
};




  const { name = "Chat", myRole = "patient" } = route.params || {};
  const headerHeight = useHeaderHeight();

  const listRef = useRef(null);

  const [text, setText] = useState("");
  const [typing, setTyping] = useState(false);

  // Attachments selected but not sent yet
  const [pendingFiles, setPendingFiles] = useState([]);

  // ===== Voice recording state (REAL) =====
  const [isRecording, setIsRecording] = useState(false);
  const recordingRef = useRef(null);
  const [recordMs, setRecordMs] = useState(0);

  // ===== Playback state (REAL) =====
  const soundRef = useRef(null);
  const [playingMsgId, setPlayingMsgId] = useState(null);
  const [playPosMs, setPlayPosMs] = useState(0);
  const [playDurMs, setPlayDurMs] = useState(0);

  const quickReplies = useMemo(() => getQuickReplies(myRole), [myRole]);

  const [messages, setMessages] = useState([
    {
      id: "m1",
      fromMe: false,
      text: "Assalam o Alaikum, how can I help?",
      createdAt: Date.now() - 1000 * 60 * 8,
      status: "delivered",
    },
    {
      id: "m2",
      fromMe: true,
      text: "Walikum salam, I want to confirm my appointment.",
      createdAt: Date.now() - 1000 * 60 * 7,
      status: "seen",
    },
  ]);

  const sorted = useMemo(
    () => [...messages].sort((a, b) => a.createdAt - b.createdAt),
    [messages]
  );

  const scrollToBottom = (animated = true) => {
    requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated }));
  };

  useEffect(() => {
    scrollToBottom(false);
    return () => {
      // cleanup sound
      (async () => {
        try {
          if (soundRef.current) {
            await soundRef.current.unloadAsync();
            soundRef.current = null;
          }
        } catch {}
      })();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const addMyMessage = ({ msgText = "", files = [] }) => {
    const t = (msgText ?? "").trim();
    if (!t && (!files || files.length === 0)) return;

    const now = Date.now();
    const newMsg = {
      id: String(now),
      fromMe: true,
      text: t,
      createdAt: now,
      status: "sent",
      attachments: files, // image/file/audio
    };

    setMessages((prev) => [...prev, newMsg]);
    scrollToBottom(true);

    // fake reply (remove when API)
    setTyping(true);
    setTimeout(() => {
      setTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          id: String(Date.now() + 1),
          fromMe: false,
          text: "Got it — I received your message.",
          createdAt: Date.now() + 1,
          status: "delivered",
        },
      ]);
      scrollToBottom(true);
    }, 700);
  };

  // ========= Attachments (Expo) =========
  const pickFromCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Camera permission is required.");
      return;
    }

    const result = await ImagePicker.launchCameraAsync({ quality: 0.8 });
    if (result.canceled) return;

    const asset = result.assets?.[0];
    if (!asset?.uri) return;

    setPendingFiles((prev) => [
      ...prev,
      {
        uri: asset.uri,
        name: asset.fileName || `camera_${Date.now()}.jpg`,
        mimeType: asset.mimeType || "image/jpeg",
        size: asset.fileSize,
        kind: "image",
      },
    ]);
  };

  const pickFromGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permission needed", "Gallery permission is required.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      quality: 0.8,
      allowsMultipleSelection: true,
      selectionLimit: 5,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });

    if (result.canceled) return;
    const assets = result.assets || [];
    const mapped = assets
      .filter((a) => a?.uri)
      .map((a, idx) => ({
        uri: a.uri,
        name: a.fileName || `image_${Date.now()}_${idx}.jpg`,
        mimeType: a.mimeType || "image/jpeg",
        size: a.fileSize,
        kind: "image",
      }));

    if (mapped.length) setPendingFiles((prev) => [...prev, ...mapped]);
  };

  const pickDocument = async () => {
    const result = await DocumentPicker.getDocumentAsync({
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;
    const assets = result.assets || [];
    const mapped = assets
      .filter((a) => a?.uri)
      .map((a) => ({
        uri: a.uri,
        name: a.name || `file_${Date.now()}`,
        mimeType: a.mimeType || "application/octet-stream",
        size: a.size,
        kind: isImageLike(a.mimeType, a.name) ? "image" : "file",
      }));

    if (mapped.length) setPendingFiles((prev) => [...prev, ...mapped]);
  };

  const onPressAttach = () => {
    Alert.alert("Attach", "Choose an option", [
      { text: "Camera", onPress: pickFromCamera },
      { text: "Gallery", onPress: pickFromGallery },
      { text: "Document", onPress: pickDocument },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const removePending = (index) =>
    setPendingFiles((prev) => prev.filter((_, i) => i !== index));

  // ========= Voice Recording (Expo AV) =========
  const ensureAudioReady = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
  };

  const stopPlayback = async () => {
    try {
      if (soundRef.current) {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }
    } catch {}
    setPlayingMsgId(null);
    setPlayPosMs(0);
    setPlayDurMs(0);
  };

  const startRecording = async () => {
    try {
      const perm = await Audio.requestPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Permission needed", "Microphone permission is required.");
        return;
      }

      await ensureAudioReady();
      await stopPlayback();

      setRecordMs(0);
      const rec = new Audio.Recording();
      recordingRef.current = rec;

      await rec.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      rec.setOnRecordingStatusUpdate((s) => {
        if (s?.isRecording) setRecordMs(s.durationMillis ?? 0);
      });

      await rec.startAsync();
      setIsRecording(true);
    } catch (e) {
      setIsRecording(false);
      recordingRef.current = null;
      Alert.alert("Recording error", String(e));
    }
  };

  const stopRecording = async () => {
    try {
      const rec = recordingRef.current;
      if (!rec) return;

      setIsRecording(false);
      await rec.stopAndUnloadAsync();
      const uri = rec.getURI();
      recordingRef.current = null;

      if (!uri) return;

      setPendingFiles((prev) => [
        ...prev,
        {
          uri,
          name: `voice_${Date.now()}.m4a`,
          mimeType: "audio/m4a",
          size: undefined,
          kind: "audio",
          durationMs: recordMs,
        },
      ]);
    } catch (e) {
      setIsRecording(false);
      recordingRef.current = null;
      Alert.alert("Stop error", String(e));
    }
  };

  const togglePlayAudio = async (msgId, audioUri) => {
    try {
      if (playingMsgId === msgId) {
        await stopPlayback();
        return;
      }

      await stopPlayback();
      await ensureAudioReady();

      const { sound } = await Audio.Sound.createAsync(
        { uri: audioUri },
        { shouldPlay: true },
        (status) => {
          if (!status?.isLoaded) return;
          setPlayPosMs(status.positionMillis ?? 0);
          setPlayDurMs(status.durationMillis ?? 0);

          if (status.didJustFinish) stopPlayback();
        }
      );

      soundRef.current = sound;
      setPlayingMsgId(msgId);
    } catch (e) {
      Alert.alert("Playback error", String(e));
    }
  };

  // ========= Sending =========
  const onSend = () => {
    const t = text.trim();
    const filesToSend = pendingFiles;
    if (!t && filesToSend.length === 0) return;

    setText("");
    setPendingFiles([]);
    addMyMessage({ msgText: t, files: filesToSend });
  };

  // ========= Render helpers =========
  const renderAttachments = (atts = [], msgId) => {
    if (!atts.length) return null;

    return (
      <View style={styles.attWrap}>
        {atts.map((a, idx) => {
          if (a.kind === "image") {
            return (
              <Image
                key={`${a.uri}-${idx}`}
                source={{ uri: a.uri }}
                style={styles.attImage}
              />
            );
          }

          if (a.kind === "audio") {
  const isThisPlaying = playingMsgId === msgId;
  const dur = (isThisPlaying ? playDurMs : a.durationMs) ?? 0;
  const pos = isThisPlaying ? playPosMs : 0;
  const ratio = dur > 0 ? pos / dur : 0;

  const bars = makeWaveform(msgId, 28);

  return (
    <View key={`${a.uri}-${idx}`} style={styles.audioWrap}>
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.audioPlayBtn}
        onPress={() => togglePlayAudio(msgId, a.url || a.uri)}
      >
        <Text style={styles.audioPlayIcon}>
          {isThisPlaying ? "⏹" : "▶"}
        </Text>
      </TouchableOpacity>

      <View style={{ flex: 1 }}>
        <View style={styles.waveRow}>
          {bars.map((h, i) => {
            const active = i / bars.length <= ratio;
            return (
              <View
                key={i}
                style={[
                  styles.waveBar,
                  { height: 8 + h * 18 },
                  active ? styles.waveBarActive : styles.waveBarInactive,
                ]}
              />
            );
          })}
        </View>

        <View style={styles.seekRow}>
          <Pressable
            style={styles.seekTrack}
            onPress={(e) => {
              const x = e.nativeEvent.locationX;
              const w = e.nativeEvent.layout?.width || 1;
              seekPlayback(x / w);
            }}
          >
            <View style={[styles.seekFill, { width: `${ratio * 100}%` }]} />
            <View style={[styles.seekKnob, { left: `${ratio * 100}%` }]} />
          </Pressable>

          <Text style={styles.seekTime}>
            {msToClock(pos)} / {msToClock(dur)}
          </Text>
        </View>
      </View>
    </View>
  );
}


          return (
            <View key={`${a.uri}-${idx}`} style={styles.attFile}>
              <Text style={styles.attFileName} numberOfLines={1}>
                {a.name || "File"}
              </Text>
            </View>
          );
        })}
      </View>
    );
  };

  const renderItem = ({ item, index }) => {
    const prev = sorted[index - 1];
    const showDay = index === 0 || (prev && !isSameDay(prev.createdAt, item.createdAt));

    return (
      <View>
        {showDay ? (
          <View style={styles.dayPillWrap}>
            <View style={styles.dayPill}>
              <Text style={styles.dayPillText}>Today</Text>
            </View>
          </View>
        ) : null}

        <View style={[styles.row, item.fromMe ? styles.rowMe : styles.rowThem]}>
          <View style={[styles.bubble, item.fromMe ? styles.me : styles.them]}>
            {renderAttachments(item.attachments || [], item.id)}

            {!!item.text ? (
              <Text style={[styles.bubbleText, item.fromMe ? styles.meText : styles.themText]}>
                {item.text}
              </Text>
            ) : null}

            <View style={styles.metaRow}>
              <Text style={[styles.metaText, item.fromMe ? styles.metaMe : styles.metaThem]}>
                {formatTime(item.createdAt)}
              </Text>
              {item.fromMe ? (
                <Text style={[styles.metaText, styles.metaMe]}>
                  {"  "}
                  {item.status === "seen" ? "Seen" : item.status === "delivered" ? "Delivered" : "Sent"}
                </Text>
              ) : null}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const canSend = text.trim().length > 0 || pendingFiles.length > 0;

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "#fff" }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={headerHeight}
    >
      <View style={{ flex: 1 }}>
        <FlatList
          ref={listRef}
          style={{ flex: 1 }}
          data={sorted}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={renderItem}
          keyboardShouldPersistTaps="handled"
          keyboardDismissMode="on-drag"
          onContentSizeChange={() => scrollToBottom(false)}
          onLayout={() => scrollToBottom(false)}
        />

        {typing ? (
          <View style={styles.typingWrap}>
            <View style={styles.typingBubble}>
              <Text style={styles.typingText}>{name} is typing…</Text>
            </View>
          </View>
        ) : null}

        {/* Quick Replies */}
        <View style={styles.quickWrap}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {quickReplies.map((q) => (
              <TouchableOpacity
                key={q}
                activeOpacity={0.85}
                style={styles.quickChip}
                onPress={() => addMyMessage({ msgText: q, files: [] })}
              >
                <Text style={styles.quickText}>{q}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Pending attachments preview (tap to remove) */}
        {pendingFiles.length > 0 ? (
          <View style={styles.pendingWrap}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {pendingFiles.map((f, idx) => (
                <TouchableOpacity
                  key={`${f.uri}-${idx}`}
                  activeOpacity={0.85}
                  onPress={() => removePending(idx)}
                  style={styles.pendingItem}
                >
                  {f.kind === "image" ? (
                    <Image source={{ uri: f.uri }} style={styles.pendingThumb} />
                  ) : f.kind === "audio" ? (
                    <View style={styles.pendingFile}>
                      <Text style={styles.pendingFileText} numberOfLines={1}>
                        🎙 Voice {msToClock(f.durationMs || 0)}
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.pendingFile}>
                      <Text style={styles.pendingFileText} numberOfLines={1}>
                        {f.name}
                      </Text>
                    </View>
                  )}

                  <View style={styles.pendingX}>
                    <Text style={styles.pendingXText}>×</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={styles.pendingHint}>Tap an item to remove</Text>
          </View>
        ) : null}

        {/* Composer */}
        <View style={styles.composer}>
          <TouchableOpacity style={styles.iconBtn} onPress={onPressAttach} activeOpacity={0.85}>
            <Text style={styles.iconText}>＋</Text>
          </TouchableOpacity>

          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Type a message…"
            placeholderTextColor="#777"
            style={styles.input}
            multiline
          />

          {/* Press and hold mic to record */}
          <Pressable
            onPressIn={() => {
              Keyboard.dismiss();
              startRecording();
            }}
            onPressOut={stopRecording}
            style={[styles.iconBtn, isRecording && styles.iconBtnRecording]}
          >
            <Text style={styles.iconText}>{isRecording ? "●" : "🎤"}</Text>
          </Pressable>

          <TouchableOpacity
            style={[styles.sendBtn, !canSend && styles.sendBtnDisabled]}
            onPress={onSend}
            activeOpacity={0.85}
            disabled={!canSend}
          >
            <Text style={styles.sendText}>Send</Text>
          </TouchableOpacity>
        </View>

        {/* recording timer */}
        {isRecording ? (
          <View style={styles.recBar}>
            <Text style={styles.recText}>Recording… {msToClock(recordMs)}</Text>
            <Text style={styles.recHint}>Release to stop</Text>
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  list: { padding: 14, paddingBottom: 10 },

  dayPillWrap: { alignItems: "center", marginVertical: 10 },
  dayPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999, backgroundColor: "#f2f2f2" },
  dayPillText: { fontSize: 12, color: "#666", fontWeight: "700" },

  row: { flexDirection: "row", marginBottom: 10 },
  rowMe: { justifyContent: "flex-end" },
  rowThem: { justifyContent: "flex-start" },

  bubble: { maxWidth: "82%", paddingHorizontal: 12, paddingTop: 10, paddingBottom: 8, borderRadius: 16 },
  me: { backgroundColor: "#1f6feb", borderTopRightRadius: 6 },
  them: { backgroundColor: "#f2f2f2", borderTopLeftRadius: 6 },

  bubbleText: { fontSize: 14, lineHeight: 19 },
  meText: { color: "white" },
  themText: { color: "#111" },

  metaRow: { flexDirection: "row", marginTop: 6, alignItems: "center" },
  metaText: { fontSize: 11, fontWeight: "700" },
  metaMe: { color: "rgba(255,255,255,0.85)" },
  metaThem: { color: "#777" },

  typingWrap: { paddingHorizontal: 14, paddingBottom: 8 },
  typingBubble: { alignSelf: "flex-start", backgroundColor: "#f2f2f2", borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8 },
  typingText: { color: "#666", fontWeight: "700", fontSize: 12 },

  quickWrap: { borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff", paddingVertical: 8, paddingLeft: 10 },
  quickChip: { backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee", paddingHorizontal: 10, paddingVertical: 8, borderRadius: 999, marginRight: 8 },
  quickText: { fontSize: 12, color: "#333", fontWeight: "700" },

  composer: { flexDirection: "row", alignItems: "flex-end", padding: 10, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "white", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 12, backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee", alignItems: "center", justifyContent: "center" },
  iconBtnRecording: { borderColor: "#ff4d4f" },
  iconText: { fontSize: 18, fontWeight: "900", color: "#111" },

  input: { flex: 1, maxHeight: 120, paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#f7f7f7", borderRadius: 12, color: "#111", borderWidth: 1, borderColor: "#eee" },

  sendBtn: { paddingHorizontal: 14, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#1f6feb" },
  sendBtnDisabled: { opacity: 0.5 },
  sendText: { color: "white", fontWeight: "800" },

  // attachments in message
  attWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  attImage: { width: 110, height: 90, borderRadius: 12, backgroundColor: "#ddd" },
  attFile: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.18)" },
  attFileName: { maxWidth: 200, fontWeight: "800", color: "#fff" },

  // audio card
  audioCard: {
    width: 220,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 14,
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  audioBtn: { fontSize: 18, fontWeight: "900", color: "#fff", width: 22, textAlign: "center" },
  audioTitle: { color: "#fff", fontWeight: "900" },
  audioTime: { marginTop: 2, color: "rgba(255,255,255,0.85)", fontWeight: "800", fontSize: 12 },

  // pending preview
  pendingWrap: { paddingHorizontal: 10, paddingTop: 10, paddingBottom: 6, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
  pendingItem: { marginRight: 10 },
  pendingThumb: { width: 70, height: 56, borderRadius: 12, backgroundColor: "#ddd" },
  pendingFile: { width: 140, height: 56, borderRadius: 12, backgroundColor: "#f7f7f7", borderWidth: 1, borderColor: "#eee", padding: 10, justifyContent: "center" },
  pendingFileText: { fontWeight: "800", color: "#111" },
  pendingX: { position: "absolute", top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: "#111", alignItems: "center", justifyContent: "center" },
  pendingXText: { color: "#fff", fontWeight: "900", fontSize: 14, marginTop: -1 }, 
  pendingHint: { marginTop: 6, color: "#777", fontWeight: "700", fontSize: 12 },

  // recording bar
  recBar: { paddingHorizontal: 12, paddingVertical: 10, borderTopWidth: 1, borderTopColor: "#eee", backgroundColor: "#fff" },
  recText: { fontWeight: "900", color: "#111" },
  recHint: { marginTop: 2, color: "#777", fontWeight: "700", fontSize: 12 },



  audioWrap: {
  width: 270,
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
  paddingHorizontal: 10,
  paddingVertical: 10,
  borderRadius: 16,
  backgroundColor: "rgba(255,255,255,0.18)",
},

audioPlayBtn: {
  width: 36,
  height: 36,
  borderRadius: 12,
  alignItems: "center",
  justifyContent: "center",
  backgroundColor: "rgba(255,255,255,0.2)",
},

audioPlayIcon: {
  color: "#fff",
  fontWeight: "900",
  fontSize: 18,
  marginLeft: 2,
},

waveRow: {
  flexDirection: "row",
  alignItems: "flex-end",
  gap: 3,
  marginBottom: 8,
},

waveBar: {
  width: 3,
  borderRadius: 2,
},

waveBarActive: {
  backgroundColor: "rgba(255,255,255,0.95)",
},

waveBarInactive: {
  backgroundColor: "rgba(255,255,255,0.35)",
},

seekRow: {
  flexDirection: "row",
  alignItems: "center",
  gap: 10,
},

seekTrack: {
  flex: 1,
  height: 10,
  borderRadius: 999,
  backgroundColor: "rgba(255,255,255,0.22)",
  overflow: "hidden",
  justifyContent: "center",
},

seekFill: {
  position: "absolute",
  left: 0,
  height: 10,
  borderRadius: 999,
  backgroundColor: "rgba(255,255,255,0.75)",
},

seekKnob: {
  position: "absolute",
  width: 14,
  height: 14,
  borderRadius: 7,
  backgroundColor: "rgba(255,255,255,0.95)",
  marginLeft: -7,
},

seekTime: {
  color: "rgba(255,255,255,0.9)",
  fontWeight: "800",
  fontSize: 11,
  width: 86,
  textAlign: "right",
},

});

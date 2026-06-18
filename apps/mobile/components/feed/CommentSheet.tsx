import React, { useEffect, useState } from "react";
import {
  View, Text, StyleSheet, Modal, FlatList,
  TextInput, TouchableOpacity, KeyboardAvoidingView,
  Platform, ActivityIndicator,
} from "react-native";
import { subscribeToComments, addComment } from "../../supabase/db";
import { useAuthStore } from "../../store/authStore";
import { useTranslation } from "react-i18next";
import { Colors, Typography, Spacing, Radius } from "../../utils/theme";
import { format } from "date-fns";
import type { Comment } from "@newmomcircle/types";

const getInitials = (name: string) =>
  name.split(" ").map((n) => n[0] ?? "").join("").toUpperCase().slice(0, 2) || "MM";

interface Props {
  postId: string | null;
  visible: boolean;
  onClose: () => void;
}

export default function CommentSheet({ postId, visible, onClose }: Props) {
  const { t } = useTranslation();
  const user = useAuthStore((s) => s.user);
  const profile = useAuthStore((s) => s.profile);

  const [comments, setComments] = useState<Comment[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!postId || !visible) return;
    const unsub = subscribeToComments(postId, setComments);
    return unsub;
  }, [postId, visible]);

  const handleSend = async () => {
    if (!text.trim() || !postId || !user || !profile) return;
    setSending(true);
    try {
      await addComment({
        postId,
        authorId: user.id,
        authorName: profile.displayName,
        authorInitials: getInitials(profile.displayName),
        content: text.trim(),
      });
      setText("");
    } finally {
      setSending(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View style={styles.sheet}>
          <View style={styles.handle} />

          <View style={styles.header}>
            <Text style={styles.headerTitle}>{t("comments")}</Text>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>
          </View>

          <FlatList
            data={comments}
            keyExtractor={(c) => c.id}
            contentContainerStyle={styles.list}
            style={{ maxHeight: 380 }}
            ListEmptyComponent={
              <Text style={styles.empty}>No comments yet. Be the first! 💬</Text>
            }
            renderItem={({ item }) => <CommentItem comment={item} />}
          />

          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={text}
              onChangeText={setText}
              placeholder={t("write_comment")}
              placeholderTextColor={Colors.textMuted}
              multiline
            />
            <TouchableOpacity
              style={[styles.sendBtn, (!text.trim() || sending) && { opacity: 0.4 }]}
              onPress={handleSend}
              disabled={!text.trim() || sending}
            >
              {sending
                ? <ActivityIndicator color={Colors.white} size="small" />
                : <Text style={styles.sendIcon}>➤</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function CommentItem({ comment }: { comment: Comment }) {
  const date = comment.createdAt ? format(new Date(comment.createdAt), "dd MMM · HH:mm") : "";
  return (
    <View style={styles.comment}>
      <View style={styles.commentAvatar}>
        <Text style={{ fontSize: 16 }}>👩</Text>
      </View>
      <View style={{ flex: 1 }}>
        <View style={styles.commentTop}>
          <Text style={styles.commentAuthor}>{comment.authorName}</Text>
          <Text style={styles.commentDate}>{date}</Text>
        </View>
        <Text style={styles.commentText}>{comment.content}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.45)" },
  sheet: {
    backgroundColor: Colors.white, borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl, paddingTop: Spacing.sm, paddingBottom: 32, maxHeight: "85%",
  },
  handle: { width: 40, height: 4, borderRadius: 2, backgroundColor: Colors.divider, alignSelf: "center", marginBottom: Spacing.md },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: Spacing.lg, marginBottom: Spacing.sm },
  headerTitle: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.lg, color: Colors.textPrimary },
  closeText: { fontFamily: Typography.fontFamily, fontSize: Typography.lg, color: Colors.textMuted },
  list: { paddingHorizontal: Spacing.lg, gap: Spacing.md, paddingBottom: Spacing.md },
  empty: { fontFamily: Typography.fontFamily, fontSize: Typography.base, color: Colors.textMuted, textAlign: "center", marginTop: Spacing.xl },
  comment: { flexDirection: "row", gap: Spacing.sm },
  commentAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: Colors.peachOverlay, justifyContent: "center", alignItems: "center" },
  commentTop: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 2 },
  commentAuthor: { fontFamily: Typography.fontFamilySemiBold, fontSize: Typography.sm, color: Colors.textPrimary },
  commentDate: { fontFamily: Typography.fontFamily, fontSize: Typography.xs, color: Colors.textMuted },
  commentText: { fontFamily: Typography.fontFamily, fontSize: Typography.sm, color: Colors.textPrimary, lineHeight: 20 },
  inputRow: { flexDirection: "row", alignItems: "flex-end", paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, borderTopWidth: 1, borderTopColor: Colors.divider, gap: Spacing.sm },
  input: { flex: 1, backgroundColor: Colors.warmGrey, borderRadius: Radius.md, paddingHorizontal: Spacing.md, paddingVertical: 10, fontFamily: Typography.fontFamily, fontSize: Typography.sm, color: Colors.textPrimary, maxHeight: 80 },
  sendBtn: { width: 42, height: 42, borderRadius: 21, backgroundColor: Colors.peach, justifyContent: "center", alignItems: "center" },
  sendIcon: { color: Colors.white, fontSize: 16 },
});

import { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import { CompositeScreenProps, useFocusEffect } from "@react-navigation/native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useCallback, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { api, ApiError, Friend, FriendRequests } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList, MainTabParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";

type Props = CompositeScreenProps<
  BottomTabScreenProps<MainTabParamList, "FriendsTab">,
  NativeStackScreenProps<AppStackParamList>
>;

export function FriendsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { token } = useAuth();
  const [friends, setFriends] = useState<Friend[] | null>(null);
  const [requests, setRequests] = useState<FriendRequests | null>(null);
  const [username, setUsername] = useState("");
  const [sending, setSending] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!token) return;
    try {
      setError(null);
      const [friendsData, requestsData] = await Promise.all([api.getFriends(token), api.getFriendRequests(token)]);
      setFriends(friendsData);
      setRequests(requestsData);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not load friends.");
    }
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function onRefresh() {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }

  async function sendRequest() {
    if (!token || !username.trim()) return;
    setSending(true);
    setError(null);
    setNotice(null);
    try {
      await api.sendFriendRequest(username.trim(), token);
      setUsername("");
      setNotice("Friend request sent.");
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not send that friend request.");
    } finally {
      setSending(false);
    }
  }

  async function accept(requestId: string) {
    if (!token) return;
    setBusyId(requestId);
    setError(null);
    try {
      await api.acceptFriendRequest(requestId, token);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not accept that request.");
    } finally {
      setBusyId(null);
    }
  }

  async function removeFriendship(id: string) {
    if (!token) return;
    setBusyId(id);
    setError(null);
    try {
      await api.removeFriendship(id, token);
      await load();
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Could not complete that action.");
    } finally {
      setBusyId(null);
    }
  }

  const loading = friends === null && requests === null && !error;

  return (
    <ScrollView
      style={[styles.container, { paddingTop: insets.top / 2 + spacing.lg }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      contentContainerStyle={styles.content}
    >
      <Text style={styles.title}>Friends</Text>
      <Text style={styles.subtitle}>Add friends by username to see them on the course.</Text>

      <View style={styles.qrRow}>
        <View style={styles.qrButton}>
          <Button title="My QR Code" variant="secondary" onPress={() => navigation.navigate("MyQrCode")} />
        </View>
        <View style={styles.qrButton}>
          <Button title="Scan to Add" onPress={() => navigation.navigate("ScanQr")} />
        </View>
      </View>

      <View style={styles.addRow}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        <Button title="Add" onPress={sendRequest} loading={sending} disabled={!username.trim()} />
      </View>

      {error && <Text style={styles.error}>{error}</Text>}
      {notice && <Text style={styles.notice}>{notice}</Text>}
      {loading && <ActivityIndicator style={{ marginTop: spacing.xl }} />}

      {requests && requests.incoming.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Requests</Text>
          {requests.incoming.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.rowName}>{r.from.username}</Text>
              <View style={styles.rowActions}>
                <View style={styles.rowActionButton}>
                  <Button title="Accept" onPress={() => accept(r.id)} loading={busyId === r.id} />
                </View>
                <View style={styles.rowActionButton}>
                  <Button
                    title="Decline"
                    variant="secondary"
                    onPress={() => removeFriendship(r.id)}
                    loading={busyId === r.id}
                  />
                </View>
              </View>
            </View>
          ))}
        </View>
      )}

      {requests && requests.outgoing.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Sent</Text>
          {requests.outgoing.map((r) => (
            <View key={r.id} style={styles.row}>
              <Text style={styles.rowName}>{r.to.username}</Text>
              <View style={styles.rowActionButton}>
                <Button
                  title="Cancel"
                  variant="secondary"
                  onPress={() => removeFriendship(r.id)}
                  loading={busyId === r.id}
                />
              </View>
            </View>
          ))}
        </View>
      )}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Your friends</Text>
        {friends && friends.length === 0 && (
          <Text style={styles.empty}>No friends yet — add one above by their username.</Text>
        )}
        {friends?.map((f) => (
          <Pressable
            key={f.friendshipId}
            style={styles.row}
            onPress={() => navigation.navigate("FriendProfile", { userId: f.friend.id, username: f.friend.username })}
          >
            <View style={styles.friendInfo}>
              <Text style={styles.rowName}>{f.friend.username}</Text>
              <Text style={styles.friendMeta}>
                {f.courseCount === 0
                  ? "No courses yet"
                  : `${f.courseCount} course${f.courseCount === 1 ? "" : "s"} · latest ${new Date(
                      f.latestCourseAt!
                    ).toLocaleDateString()}`}
              </Text>
            </View>
            <Text style={styles.viewCourses}>View profile ›</Text>
            <Pressable
              hitSlop={8}
              onPress={() => removeFriendship(f.friendshipId)}
              disabled={busyId === f.friendshipId}
              style={styles.removeLink}
            >
              <Text style={styles.removeLinkText}>{busyId === f.friendshipId ? "Removing…" : "Remove friend"}</Text>
            </Pressable>
          </Pressable>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2, gap: spacing.md },
  title: { fontSize: 30, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  subtitle: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.muted, marginTop: -spacing.sm },
  qrRow: { flexDirection: "row", gap: spacing.sm },
  qrButton: { flex: 1 },
  addRow: { flexDirection: "row", gap: spacing.sm, alignItems: "center" },
  input: {
    flex: 1,
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: fonts.serif,
    color: colors.ink,
  },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center" },
  notice: { color: colors.fairway, fontFamily: fonts.serif, textAlign: "center" },
  section: { gap: spacing.sm },
  sectionTitle: {
    fontSize: 12,
    fontFamily: fonts.serifBold,
    color: colors.muted,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  empty: { fontSize: 13, fontFamily: fonts.serifItalic, color: colors.muted },
  row: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.sm,
  },
  rowName: { fontSize: 15, fontFamily: fonts.serifBold, color: colors.ink },
  rowActions: { flexDirection: "row", gap: spacing.sm },
  rowActionButton: { flex: 1 },
  friendInfo: { gap: 2 },
  friendMeta: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted },
  viewCourses: { fontSize: 13, fontFamily: fonts.serifBold, color: colors.fairway },
  removeLink: { alignSelf: "flex-start" },
  removeLinkText: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted, textDecorationLine: "underline" },
});

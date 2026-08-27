import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useState } from "react";
import { ActivityIndicator, StyleSheet, Text, View } from "react-native";
import { api, ApiError } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, fonts, spacing } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "ScanQr">;

type Status =
  | { kind: "sending" }
  | { kind: "sent"; username: string }
  | { kind: "self" }
  | { kind: "error"; message: string };

export function ScanQrScreen({ navigation }: Props) {
  const { user, token } = useAuth();
  const [permission, requestPermission] = useCameraPermissions();
  const [locked, setLocked] = useState(false);
  const [status, setStatus] = useState<Status | null>(null);

  async function handleScan({ data }: { data: string }) {
    if (locked) return;

    let payload: { id: string; username: string };
    try {
      const parsed = JSON.parse(data);
      if (parsed?.app !== "homecourse" || parsed?.type !== "user" || !parsed.id || !parsed.username) {
        throw new Error("not a Home Course code");
      }
      payload = { id: parsed.id, username: parsed.username };
    } catch {
      // Not a code we recognize -- keep scanning without locking, so a stray
      // barcode in view doesn't block the user from trying the right one.
      return;
    }

    setLocked(true);

    if (payload.id === user?.id) {
      setStatus({ kind: "self" });
      return;
    }

    if (!token) return;
    setStatus({ kind: "sending" });
    try {
      await api.sendFriendRequest(payload.username, token);
      setStatus({ kind: "sent", username: payload.username });
    } catch (e) {
      if (e instanceof ApiError && e.status === 409 && e.message.toLowerCase().includes("already friends")) {
        navigation.replace("FriendProfile", { userId: payload.id, username: payload.username });
        return;
      }
      setStatus({
        kind: "error",
        message: e instanceof ApiError ? e.message : "Could not send that friend request.",
      });
    }
  }

  function scanAgain() {
    setLocked(false);
    setStatus(null);
  }

  if (!permission) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
      </View>
    );
  }

  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>
          {permission.canAskAgain
            ? "Home Course needs camera access to scan a friend's QR code."
            : "Camera access was denied. Enable it for Home Course in your device Settings to scan a QR code."}
        </Text>
        {permission.canAskAgain && <Button title="Grant camera access" onPress={requestPermission} />}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        facing="back"
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
        onBarcodeScanned={handleScan}
      />
      {!status && <Text style={styles.hint}>Point your camera at a friend's QR code.</Text>}

      {status && (
        <View style={styles.overlay}>
          <View style={styles.overlayCard}>
            {status.kind === "sending" && (
              <>
                <ActivityIndicator color={colors.fairway} />
                <Text style={styles.overlayText}>Sending friend request…</Text>
              </>
            )}
            {status.kind === "sent" && (
              <>
                <Text style={styles.overlayTitle}>Request sent</Text>
                <Text style={styles.overlayText}>Friend request sent to {status.username}.</Text>
                <Button title="Done" onPress={() => navigation.goBack()} />
              </>
            )}
            {status.kind === "self" && (
              <>
                <Text style={styles.overlayTitle}>That's your own code</Text>
                <Text style={styles.overlayText}>Have a friend scan it instead.</Text>
                <Button title="Scan again" variant="secondary" onPress={scanAgain} />
              </>
            )}
            {status.kind === "error" && (
              <>
                <Text style={styles.overlayTitle}>Couldn't add friend</Text>
                <Text style={styles.overlayText}>{status.message}</Text>
                <Button title="Scan again" variant="secondary" onPress={scanAgain} />
              </>
            )}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#000" },
  camera: { flex: 1 },
  center: {
    flex: 1,
    backgroundColor: colors.sky,
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.xl,
    gap: spacing.md,
  },
  permissionText: { fontSize: 15, fontFamily: fonts.serif, color: colors.ink, textAlign: "center" },
  hint: {
    position: "absolute",
    bottom: spacing.xl,
    alignSelf: "center",
    color: colors.sky,
    fontFamily: fonts.serifBold,
    fontSize: 13,
    backgroundColor: "rgba(5,56,36,0.75)",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 999,
  },
  overlay: {
    position: "absolute",
    inset: 0,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: spacing.lg,
  },
  overlayCard: {
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: "center",
    gap: spacing.sm,
    width: "100%",
  },
  overlayTitle: { fontSize: 19, fontFamily: fonts.display, color: colors.fairwayDark },
  overlayText: { fontSize: 14, fontFamily: fonts.serif, color: colors.ink, textAlign: "center" },
});

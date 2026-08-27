import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useAuth } from "../context/AuthContext";
import { AppStackParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<AppStackParamList, "MyQrCode">;

export function MyQrCodeScreen(_props: Props) {
  const { user } = useAuth();

  const payload = JSON.stringify({ app: "homecourse", type: "user", id: user?.id, username: user?.username });

  return (
    <View style={styles.container}>
      <Text style={styles.eyebrow}>SCAN TO ADD ME</Text>
      <View style={styles.card}>
        <QRCode value={payload} size={220} color={colors.ink} backgroundColor={colors.card} />
      </View>
      <Text style={styles.username}>{user?.username}</Text>
      <Text style={styles.subtitle}>Have a friend scan this from their Friends tab to send you a request.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky, alignItems: "center", padding: spacing.xl, gap: spacing.md },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.serifBold,
    color: colors.gold,
    letterSpacing: 2,
    marginTop: spacing.lg,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.lg,
  },
  username: { fontSize: 24, fontFamily: fonts.display, color: colors.fairwayDark },
  subtitle: {
    fontSize: 13,
    fontFamily: fonts.serifItalic,
    color: colors.muted,
    textAlign: "center",
    paddingHorizontal: spacing.lg,
  },
});

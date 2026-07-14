import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [usernameOrEmail, setUsernameOrEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await login(usernameOrEmail.trim(), password);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : "Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      style={styles.container}
    >
      <View style={styles.header}>
        <Text style={styles.eyebrow}>ESTABLISHED FOR THE PUBLIC PARK</Text>
        <Text style={styles.title}>Campus Golf</Text>
        <View style={styles.rule} />
        <Text style={styles.subtitle}>Play the park. Chase the course record.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username or email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          value={usernameOrEmail}
          onChangeText={setUsernameOrEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          title="Log in"
          onPress={onSubmit}
          loading={loading}
          disabled={!usernameOrEmail || !password}
        />
        <Button title="Create an account" variant="secondary" onPress={() => navigation.navigate("Register")} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky, justifyContent: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: spacing.xl },
  eyebrow: {
    fontSize: 11,
    fontFamily: fonts.serifBold,
    color: colors.gold,
    letterSpacing: 2,
    marginBottom: spacing.xs,
  },
  title: { fontSize: 40, fontFamily: fonts.displayBlack, color: colors.fairwayDark },
  rule: { width: 64, height: 2, backgroundColor: colors.gold, marginTop: spacing.sm, marginBottom: spacing.sm },
  subtitle: { fontSize: 15, fontFamily: fonts.serifItalic, color: colors.muted },
  form: { gap: spacing.md },
  input: {
    backgroundColor: colors.card,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    fontFamily: fonts.serif,
    color: colors.ink,
  },
  error: { color: colors.danger, textAlign: "center", fontFamily: fonts.serif },
});

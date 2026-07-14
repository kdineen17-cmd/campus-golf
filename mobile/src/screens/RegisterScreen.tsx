import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useState } from "react";
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, View } from "react-native";
import { ApiError } from "../api";
import { Button } from "../components/Button";
import { useAuth } from "../context/AuthContext";
import { AuthStackParamList } from "../navigation/types";
import { colors, fonts, radii, spacing } from "../theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Register">;

export function RegisterScreen({ navigation }: Props) {
  const { register } = useAuth();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit() {
    setError(null);
    setLoading(true);
    try {
      await register(username.trim(), email.trim(), password);
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
        <Text style={styles.title}>Join Campus Golf</Text>
        <View style={styles.rule} />
        <Text style={styles.subtitle}>3-24 characters, letters/numbers/underscore for username.</Text>
      </View>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="Username"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          value={username}
          onChangeText={setUsername}
        />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password (min 8 characters)"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {error && <Text style={styles.error}>{error}</Text>}
        <Button
          title="Create account"
          onPress={onSubmit}
          loading={loading}
          disabled={!username || !email || password.length < 8}
        />
        <Button title="Back to log in" variant="secondary" onPress={() => navigation.navigate("Login")} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.sky, justifyContent: "center", padding: spacing.lg },
  header: { alignItems: "center", marginBottom: spacing.xl },
  title: { fontSize: 28, fontFamily: fonts.display, color: colors.fairwayDark },
  rule: { width: 48, height: 2, backgroundColor: colors.gold, marginTop: spacing.sm, marginBottom: spacing.sm },
  subtitle: { fontSize: 13, fontFamily: fonts.serif, color: colors.muted, textAlign: "center" },
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

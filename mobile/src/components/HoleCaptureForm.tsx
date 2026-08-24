import { useState } from "react";
import { Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { LatLng, NewHoleInput } from "../api";
import { colors, fonts, radii, spacing } from "../theme";
import { formatDistance } from "../utils/format";
import { distanceMeters } from "../utils/geo";
import { getCurrentLatLng, LocationPermissionError } from "../utils/location";
import { Button } from "./Button";
import { PhotoFlagCapture } from "./PhotoFlagCapture";
import { Stepper } from "./Stepper";

interface Props {
  title: string;
  submitLabel: string;
  onSubmit: (hole: NewHoleInput, strokes?: number) => void;
  submitting?: boolean;
  /** Lets the designer log their strokes for this hole right after capturing it. */
  allowScoring?: boolean;
}

export function HoleCaptureForm({ title, submitLabel, onSubmit, submitting, allowScoring }: Props) {
  const [draftTee, setDraftTee] = useState<LatLng | null>(null);
  const [draftHole, setDraftHole] = useState<LatLng | null>(null);
  const [draftPar, setDraftPar] = useState(3);
  const [draftName, setDraftName] = useState("");
  const [draftStrokes, setDraftStrokes] = useState<number | null>(null);
  const [draftPhoto, setDraftPhoto] = useState<string | null>(null);
  const [draftFlagX, setDraftFlagX] = useState<number | null>(null);
  const [draftFlagY, setDraftFlagY] = useState<number | null>(null);
  const [capturing, setCapturing] = useState<"tee" | "hole" | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function capture(kind: "tee" | "hole") {
    setError(null);
    setCapturing(kind);
    try {
      const point = await getCurrentLatLng();
      if (kind === "tee") setDraftTee(point);
      else setDraftHole(point);
    } catch (e) {
      setError(e instanceof LocationPermissionError ? e.message : "Could not get your GPS location.");
    } finally {
      setCapturing(null);
    }
  }

  function submit() {
    if (!draftTee || !draftHole) return;
    onSubmit(
      {
        name: draftName.trim() || undefined,
        par: draftPar,
        tee: draftTee,
        hole: draftHole,
        photo: draftPhoto ?? undefined,
        flagX: draftFlagX ?? undefined,
        flagY: draftFlagY ?? undefined,
      },
      draftStrokes ?? undefined
    );
    setDraftTee(null);
    setDraftHole(null);
    setDraftPar(3);
    setDraftName("");
    setDraftStrokes(null);
    setDraftPhoto(null);
    setDraftFlagX(null);
    setDraftFlagY(null);
  }

  const canSubmit = draftTee !== null && draftHole !== null && !submitting;

  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>{title}</Text>

      <View style={styles.captureRow}>
        <View style={styles.captureButton}>
          <Button
            title={draftTee ? "✓ Tee captured" : "Set tee here"}
            variant={draftTee ? "secondary" : "primary"}
            loading={capturing === "tee"}
            onPress={() => capture("tee")}
          />
        </View>
        <View style={styles.captureButton}>
          <Button
            title={draftHole ? "✓ Hole captured" : "Set hole here"}
            variant={draftHole ? "secondary" : "primary"}
            loading={capturing === "hole"}
            onPress={() => capture("hole")}
          />
        </View>
      </View>

      {draftTee && draftHole && (
        <Text style={styles.captureDistance}>
          {formatDistance(distanceMeters(draftTee, draftHole))} from tee to hole
        </Text>
      )}

      {error && <Text style={styles.error}>{error}</Text>}

      <TextInput
        style={styles.input}
        placeholder="Landmark name (e.g. The Old Oak)"
        placeholderTextColor={colors.muted}
        value={draftName}
        onChangeText={setDraftName}
      />
      <Stepper label="Par" value={draftPar} min={1} max={15} onChange={setDraftPar} />

      <PhotoFlagCapture
        photo={draftPhoto}
        flagX={draftFlagX}
        flagY={draftFlagY}
        onChange={(photo, flagX, flagY) => {
          setDraftPhoto(photo);
          setDraftFlagX(flagX);
          setDraftFlagY(flagY);
        }}
      />

      {allowScoring &&
        (draftStrokes === null ? (
          <Pressable onPress={() => setDraftStrokes(draftPar)}>
            <Text style={styles.scoreToggle}>Played this hole? Log your strokes →</Text>
          </Pressable>
        ) : (
          <View style={styles.scoreBlock}>
            <Stepper label="Your strokes" value={draftStrokes} min={1} max={15} onChange={setDraftStrokes} />
            <Pressable onPress={() => setDraftStrokes(null)}>
              <Text style={styles.scoreClear}>Didn't play it — clear score</Text>
            </Pressable>
          </View>
        ))}

      <Button title={submitLabel} onPress={submit} disabled={!canSubmit} loading={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    gap: spacing.md,
  },
  cardTitle: { fontSize: 17, fontFamily: fonts.display, color: colors.ink },
  captureRow: { flexDirection: "row", gap: spacing.sm },
  captureButton: { flex: 1 },
  captureDistance: { fontSize: 13, fontFamily: fonts.serifBold, color: colors.fairway },
  error: { color: colors.danger, fontFamily: fonts.serif, textAlign: "center" },
  input: {
    backgroundColor: colors.sky,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radii.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 15,
    fontFamily: fonts.serif,
    color: colors.ink,
  },
  scoreToggle: { fontSize: 13, fontFamily: fonts.serifBold, color: colors.fairway },
  scoreBlock: {
    gap: spacing.sm,
    backgroundColor: colors.sky,
    borderRadius: radii.sm,
    padding: spacing.sm,
  },
  scoreClear: { fontSize: 12, fontFamily: fonts.serif, color: colors.muted, textAlign: "center" },
});

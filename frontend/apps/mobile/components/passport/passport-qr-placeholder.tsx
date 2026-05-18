import { maskQrToken } from "@yunicity/utils";
import { StyleSheet, Text, View } from "react-native";

import { passportTheme } from "./passport-theme";

const GRID = [
  [1, 1, 1, 0, 1, 1],
  [1, 0, 1, 0, 1, 0],
  [1, 1, 1, 0, 0, 1],
  [0, 0, 1, 1, 1, 0],
  [1, 0, 0, 1, 0, 1],
  [1, 1, 1, 0, 1, 1],
];

export function PassportQrPlaceholder({ qrToken }: { qrToken: string }) {
  return (
    <View style={styles.wrap}>
      <View style={styles.qrBox}>
        {GRID.map((row, rowIndex) => (
          <View key={`row-${rowIndex}`} style={styles.row}>
            {row.map((cell, colIndex) => (
              <View
                key={`c-${rowIndex}-${colIndex}`}
                style={[styles.cell, cell === 1 && styles.cellFilled]}
              />
            ))}
          </View>
        ))}
      </View>
      <Text style={styles.caption}>QR citoyen — scan à venir</Text>
      <Text style={styles.token}>{maskQrToken(qrToken)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", gap: 8 },
  qrBox: {
    backgroundColor: "#fafaf9",
    borderRadius: 12,
    padding: 10,
    gap: 3,
  },
  row: { flexDirection: "row", gap: 3 },
  cell: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: "transparent",
  },
  cellFilled: { backgroundColor: passportTheme.bg },
  caption: {
    fontSize: 11,
    color: passportTheme.textSubtle,
    letterSpacing: 0.4,
    textTransform: "uppercase",
  },
  token: {
    fontSize: 12,
    fontFamily: "monospace",
    color: passportTheme.textMuted,
    letterSpacing: 1,
  },
});

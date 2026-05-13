import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

const NEON_GREEN = "#CCFF00";

export default function SplashScreen() {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View
        style={{
          opacity: fadeAnim,
          transform: [{ scale: scaleAnim }],
          alignItems: "center",
        }}
      >
        {/* Replace with your App Logo */}
        <View style={styles.logoSquare}>
          <Text style={styles.logoText}>SF</Text>
        </View>

        {/*<Text style={styles.brandName}>SYNTRAFIT</Text>*/}
        <View style={styles.loaderBar}>
          <Animated.View style={[styles.loaderProgress, { width: "60%" }]} />
        </View>
        <Text style={styles.statusText}>RE-RACKING THE PLATES...</Text>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: NEON_GREEN,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  logoSquare: {
    width: 60,
    height: 60,
    backgroundColor: NEON_GREEN,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 20,
  },
  logoText: {
    color: "#000",
    fontSize: 32,
    fontWeight: "900",
  },
  brandName: {
    color: "white",
    fontSize: 24,
    fontWeight: "900",
    letterSpacing: 4,
  },
  loaderBar: {
    width: 150,
    height: 2,
    backgroundColor: "#111",
    marginTop: 30,
    overflow: "hidden",
  },
  loaderProgress: {
    height: "100%",
    backgroundColor: NEON_GREEN,
  },
  statusText: {
    color: "#444",
    fontSize: 12,
    fontWeight: "800",
    marginTop: 10,
    letterSpacing: 2,
  },
});

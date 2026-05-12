import { useRouter } from "expo-router";
import { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { supabase } from "../../lib/supabase";

const THEME_COLOR = "#CCFF00";

export default function Login() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email || !password) {
      Alert.alert("SYSTEM ERROR", "Required credentials missing.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      Alert.alert("LOGIN FAILED", error.message);
      return;
    }

    // REDIRECT TARGET: PROFILE PAGE
    router.replace("/workout");
  }

  async function handleSignUp() {
    console.log("SIGNUP DATA:", { email, password });

    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: password.trim(),
    });

    setLoading(false);

    console.log("SIGNUP RESPONSE:", { data, error });

    if (error) {
      Alert.alert("ENROLLMENT FAILED", error.message);
    } else {
      Alert.alert("SUCCESS", "Check email / account created");
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <StatusBar barStyle="light-content" />
      <View style={styles.inner}>
        {/* BRANDING AREA */}
        <View style={styles.header}>
          <View style={styles.logoSquare}>
            <Text style={styles.logoText}>SF</Text>
          </View>

          <Text style={styles.title}>
            Syntra<Text style={{ color: THEME_COLOR }}>Fit</Text>
          </Text>

          <Text style={styles.subtitle}>
            SIGNIN WITH YOUR USERNAME AND PASSWORD
          </Text>
        </View>

        {/* INPUTS */}
        <View style={styles.form}>
          <View style={styles.inputContainer}>
            <Text style={styles.label}>EMAIL</Text>
            <TextInput
              placeholder="operator@syntrafit.com"
              placeholderTextColor="#27272A"
              value={email}
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              style={styles.input}
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.label}>PASSWORD</Text>
            <TextInput
              placeholder="••••••••"
              placeholderTextColor="#27272A"
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              style={styles.input}
            />
          </View>

          <TouchableOpacity
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.9}
            style={[styles.mainButton, loading && styles.buttonDisabled]}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.buttonText}>SIGNIN</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleSignUp}
            style={styles.secondaryButton}
          >
            <Text style={styles.secondaryButtonText}>
              NEW TO SYNTRAFIT?{" "}
              <Text style={{ color: THEME_COLOR }}>SIGNUP HERE</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  inner: {
    flex: 1,
    justifyContent: "center",
    paddingHorizontal: 30,
  },
  header: {
    alignItems: "center",
    marginBottom: 50,
  },
  logoSquare: {
    width: 60,
    height: 60,
    backgroundColor: THEME_COLOR,
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 12,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#000",
  },
  title: {
    fontSize: 32,
    fontWeight: "900",
    color: "#FFF",
    letterSpacing: 2,
    marginBottom: 10,
  },
  subtitle: {
    color: "#52525B",
    fontSize: 10,
    textAlign: "center",
    fontWeight: "800",
    letterSpacing: 1,
    lineHeight: 16,
  },
  form: {
    width: "100%",
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    color: THEME_COLOR,
    fontSize: 10,
    fontWeight: "900",
    marginBottom: 8,
    letterSpacing: 1,
  },
  input: {
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "#1C1C1E",
    borderRadius: 8,
    padding: 16,
    color: "#FFF",
    fontSize: 14,
    fontWeight: "600",
  },
  mainButton: {
    backgroundColor: THEME_COLOR,
    padding: 18,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000",
    fontWeight: "900",
    fontSize: 14,
    letterSpacing: 1,
  },
  secondaryButton: {
    marginTop: 25,
    alignItems: "center",
  },
  secondaryButtonText: {
    color: "#52525B",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
});
